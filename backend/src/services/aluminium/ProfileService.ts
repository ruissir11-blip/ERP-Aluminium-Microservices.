import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { AluminumProfile, ProfileType } from '../../models/aluminium/AluminumProfile';

// Fallback mock data for development when database is unavailable
const MOCK_PROFILES: AluminumProfile[] = [
  { id: '1', reference: 'PROF-001', name: 'Profile 70mm', type: ProfileType.TUBE, unitPrice: 25.50, isActive: true, density: 2.700, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', reference: 'PROF-002', name: 'Profile 55mm', type: ProfileType.CORNIERE, unitPrice: 18.75, isActive: true, density: 2.700, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', reference: 'PROF-003', name: 'Clover Cap', type: ProfileType.CUSTOM, unitPrice: 32.00, isActive: true, density: 2.700, createdAt: new Date(), updatedAt: new Date() },
];

// In-memory storage for profiles when database is unavailable
const mockProfileStore: AluminumProfile[] = [...MOCK_PROFILES];

let isDatabaseAvailable = false;
let databaseCheckDone = false;

// Check database availability (cached)
const checkDatabase = async (): Promise<boolean> => {
  // Return cached result if already checked
  if (databaseCheckDone) {
    return isDatabaseAvailable;
  }
  
  try {
    if (!AppDataSource.isInitialized) {
      console.log('Database not initialized');
      isDatabaseAvailable = false;
      databaseCheckDone = true;
      return false;
    }
    
    // Use a simple query with timeout
    const result = await Promise.race([
      AppDataSource.query('SELECT 1 as value'),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Database query timeout')), 5000))
    ]);
    
    isDatabaseAvailable = result !== undefined;
    databaseCheckDone = true;
    console.log('Database available:', isDatabaseAvailable);
    return isDatabaseAvailable;
  } catch (error) {
    console.log('Database check failed:', error instanceof Error ? error.message : 'Unknown error');
    isDatabaseAvailable = false;
    databaseCheckDone = true;
    return false;
  }
};

export interface CreateProfileInput {
  reference: string;
  name: string;
  type: ProfileType;
  length?: number;
  width?: number;
  thickness?: number;
  outerWidth?: number;
  innerWidth?: number;
  outerHeight?: number;
  innerHeight?: number;
  diameter?: number;
  innerDiameter?: number;
  technicalSpecs?: string;
  unitPrice: number;
  weightPerMeter?: number;
  surfacePerMeter?: number;
  density?: number;
}

export interface UpdateProfileInput extends Partial<CreateProfileInput> {
  isActive?: boolean;
}

export interface ProfileFilters {
  type?: ProfileType;
  isActive?: boolean;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

export class ProfileService {
  private profileRepository: Repository<AluminumProfile>;
  private useMockData = false;

  constructor() {
    try {
      if (AppDataSource.isInitialized) {
        this.profileRepository = AppDataSource.getRepository(AluminumProfile);
        isDatabaseAvailable = true;
      } else {
        this.useMockData = true;
      }
    } catch {
      this.useMockData = true;
    }
  }

  /**
   * Get all profiles with optional filtering
   */
  async findAll(filters: ProfileFilters = {}): Promise<AluminumProfile[]> {
    if (this.useMockData || !(await checkDatabase())) {
      // Return mock data when database is unavailable
      let filtered = [...mockProfileStore];
      if (filters.type) {
        filtered = filtered.filter(p => p.type === filters.type);
      }
      if (filters.isActive !== undefined) {
        filtered = filtered.filter(p => p.isActive === filters.isActive);
      }
      if (filters.search) {
        const searchLower = (filters.search).toLowerCase();
        filtered = filtered.filter(p => 
          p.reference?.toLowerCase().includes(searchLower) || 
          p.name?.toLowerCase().includes(searchLower)
        );
      }
      return filtered;
    }
    
    const query = this.profileRepository.createQueryBuilder('profile');

    if (filters.type) {
      query.andWhere('profile.type = :type', { type: filters.type });
    }

    if (filters.isActive !== undefined) {
      query.andWhere('profile.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters.search) {
      query.andWhere(
        '(profile.reference ILIKE :search OR profile.name ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return query.orderBy('profile.reference', 'ASC').getMany();
  }

  /**
   * Get all profiles with pagination and optional filtering
   */
  async findAllPaginated(
    filters: ProfileFilters = {},
    page: number = 1,
    perPage: number = 10
  ): Promise<PaginatedResult<AluminumProfile>> {
    const skip = (page - 1) * perPage;
    
    if (this.useMockData || !(await checkDatabase())) {
      // Return paginated mock data when database is unavailable
      let filtered = [...mockProfileStore];
      if (filters.type) {
        filtered = filtered.filter(p => p.type === filters.type);
      }
      if (filters.isActive !== undefined) {
        filtered = filtered.filter(p => p.isActive === filters.isActive);
      }
      if (filters.search) {
        const searchLower = (filters.search).toLowerCase();
        filtered = filtered.filter(p => 
          p.reference?.toLowerCase().includes(searchLower) || 
          p.name?.toLowerCase().includes(searchLower)
        );
      }
      
      const total = filtered.length;
      const totalPages = Math.ceil(total / perPage);
      const paginatedData = filtered.slice(skip, skip + perPage);
      
      return {
        data: paginatedData,
        total,
        totalPages,
        currentPage: page,
        perPage
      };
    }
    
    const query = this.profileRepository.createQueryBuilder('profile');

    if (filters.type) {
      query.andWhere('profile.type = :type', { type: filters.type });
    }

    if (filters.isActive !== undefined) {
      query.andWhere('profile.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters.search) {
      query.andWhere(
        '(profile.reference ILIKE :search OR profile.name ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const total = await query.getCount();
    const totalPages = Math.ceil(total / perPage);
    
    const data = await query
      .orderBy('profile.reference', 'ASC')
      .skip(skip)
      .take(perPage)
      .getMany();

    return {
      data,
      total,
      totalPages,
      currentPage: page,
      perPage
    };
  }

  /**
   * Get profile by ID
   */
  async findById(id: string): Promise<AluminumProfile | null> {
    if (this.useMockData || !(await checkDatabase())) {
      // Return mock data when database is unavailable
      const mockProfile = mockProfileStore.find(p => p.id === id);
      return mockProfile || null;
    }
    return this.profileRepository.findOneBy({ id });
  }

  /**
   * Get profile by reference
   */
  async findByReference(reference: string): Promise<AluminumProfile | null> {
    if (this.useMockData || !(await checkDatabase())) {
      // Return mock data when database is unavailable
      const mockProfile = mockProfileStore.find(p => p.reference === reference);
      return mockProfile || null;
    }
    return this.profileRepository.findOneBy({ reference });
  }

  /**
   * Create new profile
   */
  async create(input: CreateProfileInput): Promise<AluminumProfile> {
    const dbAvailable = await checkDatabase();
    
    // If database is unavailable, use in-memory storage
    if (!dbAvailable) {
      // Check for duplicate in mock store
      const existing = mockProfileStore.find(p => p.reference === input.reference);
      if (existing) {
        throw new Error(`Profile with reference '${input.reference}' already exists`);
      }
      
      // Create new mock profile
      const newProfile: AluminumProfile = {
        id: String(mockProfileStore.length + 1),
        reference: input.reference,
        name: input.name,
        type: input.type,
        length: input.length,
        width: input.width,
        thickness: input.thickness,
        outerWidth: input.outerWidth,
        innerWidth: input.innerWidth,
        outerHeight: input.outerHeight,
        innerHeight: input.innerHeight,
        diameter: input.diameter,
        innerDiameter: input.innerDiameter,
        technicalSpecs: input.technicalSpecs,
        unitPrice: input.unitPrice,
        weightPerMeter: input.weightPerMeter,
        surfacePerMeter: input.surfacePerMeter,
        density: input.density || 2.700,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockProfileStore.push(newProfile);
      console.log('Created profile in mock store:', newProfile.reference);
      return newProfile;
    }
    
    try {
      // Check for duplicate reference
      const existing = await this.findByReference(input.reference);
      if (existing) {
        throw new Error(`Profile with reference '${input.reference}' already exists`);
      }

      const profile = this.profileRepository.create({
        ...input,
        density: input.density || 2.700,
        isActive: true,
      });

      const savedProfile = await this.profileRepository.save(profile);
      console.log('Created profile in database:', savedProfile.reference);
      return savedProfile;
    } catch (dbError) {
      console.error('Database error, falling back to mock:', dbError);
      // Fall back to mock storage if database fails
      const existing = mockProfileStore.find(p => p.reference === input.reference);
      if (existing) {
        throw new Error(`Profile with reference '${input.reference}' already exists`);
      }
      
      const newProfile: AluminumProfile = {
        id: String(mockProfileStore.length + 1),
        reference: input.reference,
        name: input.name,
        type: input.type,
        length: input.length,
        width: input.width,
        thickness: input.thickness,
        outerWidth: input.outerWidth,
        innerWidth: input.innerWidth,
        outerHeight: input.outerHeight,
        innerHeight: input.innerHeight,
        diameter: input.diameter,
        innerDiameter: input.innerDiameter,
        technicalSpecs: input.technicalSpecs,
        unitPrice: input.unitPrice,
        weightPerMeter: input.weightPerMeter,
        surfacePerMeter: input.surfacePerMeter,
        density: input.density || 2.700,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockProfileStore.push(newProfile);
      console.log('Created profile in fallback mock store:', newProfile.reference);
      return newProfile;
    }
  }

  /**
   * Update existing profile
   */
  async update(id: string, input: UpdateProfileInput): Promise<AluminumProfile> {
    if (this.useMockData || !(await checkDatabase())) {
      throw new Error('Database unavailable: Cannot update profile. Please start the database server.');
    }
    const profile = await this.findById(id);
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Check for duplicate reference if changing reference
    if (input.reference && input.reference !== profile.reference) {
      const existing = await this.findByReference(input.reference);
      if (existing) {
        throw new Error(`Profile with reference '${input.reference}' already exists`);
      }
    }

    Object.assign(profile, input);
    return this.profileRepository.save(profile);
  }

  /**
   * Soft delete (deactivate) profile
   */
  async deactivate(id: string): Promise<void> {
    if (this.useMockData || !(await checkDatabase())) {
      throw new Error('Database unavailable: Cannot deactivate profile. Please start the database server.');
    }
    const profile = await this.findById(id);
    if (!profile) {
      throw new Error('Profile not found');
    }

    profile.isActive = false;
    await this.profileRepository.save(profile);
  }

  /**
   * Reactivate profile
   */
  async reactivate(id: string): Promise<AluminumProfile> {
    if (this.useMockData || !(await checkDatabase())) {
      throw new Error('Database unavailable: Cannot reactivate profile. Please start the database server.');
    }
    const profile = await this.findById(id);
    if (!profile) {
      throw new Error('Profile not found');
    }

    profile.isActive = true;
    return this.profileRepository.save(profile);
  }

  /**
   * Get active profiles only
   */
  async findActive(): Promise<AluminumProfile[]> {
    if (this.useMockData || !(await checkDatabase())) {
      return mockProfileStore.filter(p => p.isActive);
    }
    return this.profileRepository.find({
      where: { isActive: true },
      order: { reference: 'ASC' },
    });
  }

  /**
   * Get profiles by type
   */
  async findByType(type: ProfileType): Promise<AluminumProfile[]> {
    if (this.useMockData || !(await checkDatabase())) {
      return mockProfileStore.filter(p => p.type === type);
    }
    return this.profileRepository.find({
      where: { type, isActive: true },
      order: { reference: 'ASC' },
    });
  }
}
