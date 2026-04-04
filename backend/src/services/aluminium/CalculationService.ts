import { Decimal } from 'decimal.js';
import { AluminumProfile, ProfileType } from '../../models/aluminium/AluminumProfile';

// Configure decimal.js for financial precision
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface CalculationResult {
  weight: Decimal;
  surface: Decimal;
  materialCost: Decimal;
}

export interface Dimensions {
  length: number;  // in mm
  quantity: number;
}

export class CalculationService {
  private readonly ALUMINUM_DENSITY = new Decimal(2.70); // g/cm³

  /**
   * Calculate weight, surface, and material cost for a profile
   */
  calculateForProfile(
    profile: AluminumProfile,
    dimensions: Dimensions
  ): CalculationResult {
    const { length, quantity } = dimensions;

    // Use pre-calculated weight per meter if available (for complex profiles)
    let weight: Decimal;
    if (profile.weightPerMeter) {
      const lengthM = new Decimal(length).div(1000); // Convert mm to m
      weight = new Decimal(profile.weightPerMeter).times(lengthM).times(quantity);
    } else {
      weight = this.calculateWeight(profile, length, quantity);
    }

    const surface = this.calculateSurface(profile, length, quantity);
    const materialCost = weight.times(profile.unitPrice);

    return {
      weight,
      surface,
      materialCost,
    };
  }

  /**
   * Calculate weight based on volume and aluminum density
   * Weight (kg) = Volume (cm³) × Density (g/cm³) / 1000
   */
  private calculateWeight(
    profile: AluminumProfile,
    lengthMm: number,
    quantity: number
  ): Decimal {
    const lengthCm = new Decimal(lengthMm).div(10); // Convert mm to cm
    const qty = new Decimal(quantity);

    switch (profile.type) {
      case ProfileType.PLAT:
        return this.calculatePlatWeight(profile, lengthCm, qty);
      
      case ProfileType.TUBE:
        return this.calculateTubeWeight(profile, lengthCm, qty);
      
      case ProfileType.CORNIERE:
        return this.calculateCorniereWeight(profile, lengthCm, qty);
      
      default:
        // For complex profiles without pre-calculated weight, throw error
        throw new Error(
          `Weight calculation not implemented for type: ${profile.type}. ` +
          'Please provide weightPerMeter in profile.'
        );
    }
  }

  /**
   * Calculate weight for PLAT (flat bar) profile
   * Volume = Length × Width × Thickness
   */
  private calculatePlatWeight(
    profile: AluminumProfile,
    lengthCm: Decimal,
    quantity: Decimal
  ): Decimal {
    if (!profile.width || !profile.thickness) {
      throw new Error('PLAT profile requires width and thickness');
    }

    const widthCm = new Decimal(profile.width).div(10);
    const thicknessCm = new Decimal(profile.thickness).div(10);
    
    // Volume in cm³
    const volume = lengthCm.times(widthCm).times(thicknessCm);
    
    // Weight in kg (density in g/cm³, divide by 1000 for kg)
    return volume.times(this.ALUMINUM_DENSITY).div(1000).times(quantity);
  }

  /**
   * Calculate weight for TUBE (round hollow) profile
   * Volume = π × (R² - r²) × Length
   * Where R = outer radius, r = inner radius
   */
  private calculateTubeWeight(
    profile: AluminumProfile,
    lengthCm: Decimal,
    quantity: Decimal
  ): Decimal {
    if (!profile.diameter) {
      throw new Error('TUBE profile requires diameter');
    }

    const outerRadiusCm = new Decimal(profile.diameter).div(10).div(2);
    
    // Calculate inner radius if inner diameter provided, otherwise estimate
    let innerRadiusCm: Decimal;
    if (profile.innerDiameter) {
      innerRadiusCm = new Decimal(profile.innerDiameter).div(10).div(2);
    } else if (profile.thickness) {
      innerRadiusCm = outerRadiusCm.minus(new Decimal(profile.thickness).div(10));
    } else {
      // Default to 80% of outer radius if no thickness specified
      innerRadiusCm = outerRadiusCm.times(0.8);
    }

    const pi = new Decimal(Math.PI);
    const outerArea = pi.times(outerRadiusCm.pow(2));
    const innerArea = pi.times(innerRadiusCm.pow(2));
    const crossSectionArea = outerArea.minus(innerArea);
    
    const volume = crossSectionArea.times(lengthCm);
    
    return volume.times(this.ALUMINUM_DENSITY).div(1000).times(quantity);
  }

  /**
   * Calculate weight for CORNIERE (angle/L-profile)
   * Approximation: Two rectangular bars minus overlap
   */
  private calculateCorniereWeight(
    profile: AluminumProfile,
    lengthCm: Decimal,
    quantity: Decimal
  ): Decimal {
    if (!profile.width || !profile.thickness) {
      throw new Error('CORNIERE profile requires width and thickness');
    }

    const widthCm = new Decimal(profile.width).div(10);
    const thicknessCm = new Decimal(profile.thickness).div(10);
    
    // L-shape: two legs minus overlapping corner
    const leg1Volume = lengthCm.times(widthCm).times(thicknessCm);
    const leg2Volume = lengthCm.times(widthCm).times(thicknessCm);
    const overlapVolume = lengthCm.times(thicknessCm).times(thicknessCm);
    
    const volume = leg1Volume.plus(leg2Volume).minus(overlapVolume);
    
    return volume.times(this.ALUMINUM_DENSITY).div(1000).times(quantity);
  }

  /**
   * Calculate surface area
   * Surface (m²) = Length (m) × Width (m) for flat surfaces
   */
  private calculateSurface(
    profile: AluminumProfile,
    lengthMm: number,
    quantity: number
  ): Decimal {
    const lengthM = new Decimal(lengthMm).div(1000); // Convert mm to m
    const qty = new Decimal(quantity);

    switch (profile.type) {
      case ProfileType.PLAT:
        if (!profile.width) {
          throw new Error('PLAT profile requires width for surface calculation');
        }
        const widthM = new Decimal(profile.width).div(1000);
        return lengthM.times(widthM).times(qty);
      
      case ProfileType.TUBE:
        if (!profile.diameter) {
          throw new Error('TUBE profile requires diameter for surface calculation');
        }
        const diameterM = new Decimal(profile.diameter).div(1000);
        const circumference = new Decimal(Math.PI).times(diameterM);
        return lengthM.times(circumference).times(qty);
      
      default:
        // Return 0 for unimplemented types or use pre-calculated value
        return new Decimal(0);
    }
  }

  /**
   * Calculate selling price from material cost and desired margin
   * @throws Error if marginPercent is >= 100 (would cause division by zero)
   */
  calculateSellingPrice(
    materialCost: Decimal,
    marginPercent: number
  ): Decimal {
    if (marginPercent >= 100) {
      throw new Error('Margin percentage must be less than 100');
    }
    if (marginPercent < 0) {
      throw new Error('Margin percentage cannot be negative');
    }
    const margin = new Decimal(marginPercent).div(100);
    // Selling Price = Cost / (1 - Margin%)
    return materialCost.div(new Decimal(1).minus(margin));
  }

  /**
   * Calculate margin amount and percentage
   */
  calculateMargin(
    sellingPrice: Decimal,
    materialCost: Decimal
  ): { amount: Decimal; percent: Decimal } {
    const amount = sellingPrice.minus(materialCost);
    const percent = amount.div(sellingPrice).times(100);
    
    return { amount, percent };
  }
}
