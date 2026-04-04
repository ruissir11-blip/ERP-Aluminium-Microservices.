# Quickstart Guide: Aluminum Business Module

**Feature**: 002-module-aluminium  
**Date**: 2026-03-04  
**Prerequisites**: 001-auth-security module implemented and running

---

## Overview

This guide covers the implementation of the Aluminum Business Module, including:

1. Database migrations for new entities
2. Backend service implementation
3. Frontend component development
4. PDF template creation
5. Testing approach

---

## 1. Database Setup

### Install Dependencies

```bash
cd backend
npm install decimal.js puppeteer
npm install -D @types/puppeteer
```

### TypeORM Migrations

Create migration file: `src/migrations/1710100000000-AluminumModule.ts`

```typescript
import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AluminumModule1710100000000 implements MigrationInterface {
  name = 'AluminumModule1710100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types first
    await queryRunner.query(`
      CREATE TYPE profile_type_enum AS ENUM ('PLAT', 'TUBE', 'CORNIERE', 'UPN', 'IPE', 'CUSTOM');
      CREATE TYPE quote_status_enum AS ENUM ('BROUILLON', 'ENVOYÉ', 'ACCEPTÉ', 'REFUSÉ', 'EXPIRÉ', 'ANNULÉ', 'ARCHIVÉ');
      CREATE TYPE order_status_enum AS ENUM ('EN_ATTENTE', 'CONFIRMÉE', 'EN_PRODUCTION', 'PARTIELLE', 'TERMINÉE', 'LIVRÉE', 'FACTURÉE', 'ANNULÉE');
      CREATE TYPE production_status_enum AS ENUM ('PLANIFIÉ', 'EN_COURS', 'EN_PAUSE', 'TERMINÉ', 'ANNULÉ');
    `);

    // Customers table
    await queryRunner.createTable(
      new Table({
        name: 'customers',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'code', type: 'varchar', length: '20', isUnique: true },
          { name: 'company_name', type: 'varchar', length: '255' },
          { name: 'contact_name', type: 'varchar', length: '255', isNullable: true },
          { name: 'email', type: 'varchar', length: '255', isNullable: true },
          { name: 'phone', type: 'varchar', length: '50', isNullable: true },
          { name: 'billing_street', type: 'varchar', length: '255' },
          { name: 'billing_city', type: 'varchar', length: '100' },
          { name: 'billing_postal_code', type: 'varchar', length: '20' },
          { name: 'billing_country', type: 'varchar', length: '100', default: 'France' },
          { name: 'payment_terms', type: 'varchar', length: '100', isNullable: true },
          { name: 'vat_number', type: 'varchar', length: '50', isNullable: true },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Aluminum profiles table
    await queryRunner.createTable(
      new Table({
        name: 'aluminum_profiles',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'reference', type: 'varchar', length: '50', isUnique: true },
          { name: 'name', type: 'varchar', length: '255' },
          { name: 'type', type: 'profile_type_enum' },
          { name: 'length', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'width', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'thickness', type: 'decimal', precision: 10, scale: 2, isNullable: true },
          { name: 'unit_price', type: 'decimal', precision: 12, scale: 4 },
          { name: 'weight_per_meter', type: 'decimal', precision: 10, scale: 4, isNullable: true },
          { name: 'density', type: 'decimal', precision: 6, scale: 3, default: 2.700 },
          { name: 'is_active', type: 'boolean', default: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Quotes table
    await queryRunner.createTable(
      new Table({
        name: 'quotes',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'quote_number', type: 'varchar', length: '50', isUnique: true },
          { name: 'customer_id', type: 'uuid' },
          { name: 'commercial_id', type: 'uuid' },
          { name: 'status', type: 'quote_status_enum', default: 'BROUILLON' },
          { name: 'subtotal', type: 'decimal', precision: 15, scale: 4 },
          { name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 },
          { name: 'discount_amount', type: 'decimal', precision: 15, scale: 4, default: 0 },
          { name: 'vat_rate', type: 'decimal', precision: 5, scale: 2, default: 20.00 },
          { name: 'vat_amount', type: 'decimal', precision: 15, scale: 4 },
          { name: 'total', type: 'decimal', precision: 15, scale: 4 },
          { name: 'valid_until', type: 'date' },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'sent_at', type: 'timestamp', isNullable: true },
          { name: 'accepted_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    // Add foreign keys and indexes
    await queryRunner.createForeignKey(
      'quotes',
      new TableForeignKey({
        columnNames: ['customer_id'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createForeignKey(
      'quotes',
      new TableForeignKey({
        columnNames: ['commercial_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    await queryRunner.createIndex(
      'quotes',
      new TableIndex({ name: 'idx_quotes_status', columnNames: ['status'] })
    );

    // Quote lines table
    await queryRunner.createTable(
      new Table({
        name: 'quote_lines',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'quote_id', type: 'uuid' },
          { name: 'profile_id', type: 'uuid' },
          { name: 'quantity', type: 'integer' },
          { name: 'unit_length', type: 'decimal', precision: 10, scale: 2 },
          { name: 'unit_weight', type: 'decimal', precision: 10, scale: 4 },
          { name: 'total_weight', type: 'decimal', precision: 12, scale: 4 },
          { name: 'unit_price', type: 'decimal', precision: 12, scale: 4 },
          { name: 'line_total', type: 'decimal', precision: 15, scale: 4 },
          { name: 'description', type: 'varchar', length: '500', isNullable: true },
          { name: 'sort_order', type: 'integer' },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'quote_lines',
      new TableForeignKey({
        columnNames: ['quote_id'],
        referencedTableName: 'quotes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'quote_lines',
      new TableForeignKey({
        columnNames: ['profile_id'],
        referencedTableName: 'aluminum_profiles',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      })
    );

    // Customer orders table
    await queryRunner.createTable(
      new Table({
        name: 'customer_orders',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid', default: 'uuid_generate_v4()' },
          { name: 'order_number', type: 'varchar', length: '50', isUnique: true },
          { name: 'quote_id', type: 'uuid', isNullable: true },
          { name: 'customer_id', type: 'uuid' },
          { name: 'commercial_id', type: 'uuid' },
          { name: 'status', type: 'order_status_enum', default: 'EN_ATTENTE' },
          { name: 'total', type: 'decimal', precision: 15, scale: 4 },
          { name: 'delivery_date', type: 'date', isNullable: true },
          { name: 'confirmed_at', type: 'timestamp', isNullable: true },
          { name: 'completed_at', type: 'timestamp', isNullable: true },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse order for drop
    await queryRunner.dropTable('customer_orders');
    await queryRunner.dropTable('quote_lines');
    await queryRunner.dropTable('quotes');
    await queryRunner.dropTable('aluminum_profiles');
    await queryRunner.dropTable('customers');
    
    await queryRunner.query(`
      DROP TYPE IF EXISTS production_status_enum;
      DROP TYPE IF EXISTS order_status_enum;
      DROP TYPE IF EXISTS quote_status_enum;
      DROP TYPE IF EXISTS profile_type_enum;
    `);
  }
}
```

Run migration:
```bash
npm run migration:run
```

---

## 2. Backend Implementation

### Entity: AluminumProfile

Create `src/models/AluminumProfile.ts`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum ProfileType {
  PLAT = 'PLAT',
  TUBE = 'TUBE',
  CORNIERE = 'CORNIERE',
  UPN = 'UPN',
  IPE = 'IPE',
  CUSTOM = 'CUSTOM',
}

@Entity('aluminum_profiles')
@Index(['reference'], { unique: true })
@Index(['type'])
@Index(['isActive'])
export class AluminumProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  reference!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'enum', enum: ProfileType })
  type!: ProfileType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  length?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  width?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  thickness?: number;

  @Column({ type: 'decimal', precision: 12, scale: 4 })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  weightPerMeter?: number;

  @Column({ type: 'decimal', precision: 6, scale: 3, default: 2.700 })
  density!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
```

### Service: CalculationService

Create `src/services/calculation.service.ts`:

```typescript
import { Decimal } from 'decimal.js';
import { AluminumProfile, ProfileType } from '../models/AluminumProfile';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export interface CalculationResult {
  weight: Decimal;
  surface: Decimal;
  materialCost: Decimal;
}

export class CalculationService {
  private readonly ALUMINUM_DENSITY = new Decimal(2.70); // g/cm³

  calculateForProfile(
    profile: AluminumProfile,
    lengthMm: number,
    quantity: number = 1
  ): CalculationResult {
    const lengthM = new Decimal(lengthMm).div(1000); // Convert mm to m
    const qty = new Decimal(quantity);

    let weight: Decimal;
    let surface: Decimal;

    // Use pre-calculated weight per meter if available
    if (profile.weightPerMeter) {
      weight = new Decimal(profile.weightPerMeter).times(lengthM).times(qty);
    } else {
      weight = this.calculateWeight(profile, lengthMm, quantity);
    }

    surface = this.calculateSurface(profile, lengthMm, quantity);

    const materialCost = weight.times(profile.unitPrice);

    return {
      weight: weight,
      surface: surface,
      materialCost: materialCost,
    };
  }

  private calculateWeight(profile: AluminumProfile, lengthMm: number, quantity: number): Decimal {
    const lengthCm = new Decimal(lengthMm).div(10); // cm
    const qty = new Decimal(quantity);

    switch (profile.type) {
      case ProfileType.PLAT:
        if (!profile.width || !profile.thickness) {
          throw new Error('PLAT profile requires width and thickness');
        }
        const widthCm = new Decimal(profile.width).div(10);
        const thicknessCm = new Decimal(profile.thickness).div(10);
        const volume = lengthCm.times(widthCm).times(thicknessCm); // cm³
        return volume.times(this.ALUMINUM_DENSITY).div(1000).times(qty); // kg

      case ProfileType.TUBE:
        // Simplified tube calculation - assumes round tube
        if (!profile.width) {
          throw new Error('TUBE profile requires outer diameter (width)');
        }
        const diameterCm = new Decimal(profile.width).div(10);
        const radiusCm = diameterCm.div(2);
        const tubeVolume = new Decimal(Math.PI)
          .times(radiusCm.pow(2))
          .times(lengthCm);
        return tubeVolume.times(this.ALUMINUM_DENSITY).div(1000).times(qty);

      default:
        throw new Error(`Calculation not implemented for type: ${profile.type}`);
    }
  }

  private calculateSurface(profile: AluminumProfile, lengthMm: number, quantity: number): Decimal {
    const lengthM = new Decimal(lengthMm).div(1000);
    const qty = new Decimal(quantity);

    switch (profile.type) {
      case ProfileType.PLAT:
        if (!profile.width) {
          throw new Error('PLAT profile requires width');
        }
        const widthM = new Decimal(profile.width).div(1000);
        return lengthM.times(widthM).times(qty);

      default:
        // Default: return 0 for unimplemented types
        return new Decimal(0);
    }
  }
}
```

### PDF Generation Service

Create `src/services/pdf.service.ts`:

```typescript
import puppeteer from 'puppeteer';
import { Quote } from '../models/Quote';
import { QuoteLine } from '../models/QuoteLine';

export class PdfService {
  private browser: puppeteer.Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async generateQuotePdf(quote: Quote, lines: QuoteLine[]): Promise<Buffer> {
    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();

    const html = this.buildQuoteHtml(quote, lines);
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });

    await page.close();
    return pdf;
  }

  private buildQuoteHtml(quote: Quote, lines: QuoteLine[]): string {
    // HTML template with company branding
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .quote-number { font-size: 24px; font-weight: bold; }
          .company-info { float: right; text-align: right; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; }
          .totals { margin-top: 30px; text-align: right; }
          .total-row { font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-info">
            <h2>ERP Aluminium</h2>
            <p>123 Rue de l'Industrie<br>75001 Paris, France</p>
          </div>
          <div class="quote-number">Devis ${quote.quoteNumber}</div>
          <p>Date: ${quote.createdAt.toLocaleDateString('fr-FR')}</p>
          <p>Valable jusqu'au: ${quote.validUntil.toLocaleDateString('fr-FR')}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Référence</th>
              <th>Description</th>
              <th>Qté</th>
              <th>Longueur</th>
              <th>Poids</th>
              <th>Prix unit.</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${lines.map(line => `
              <tr>
                <td>${line.profile?.reference || ''}</td>
                <td>${line.description || line.profile?.name || ''}</td>
                <td>${line.quantity}</td>
                <td>${line.unitLength} mm</td>
                <td>${line.totalWeight} kg</td>
                <td>${line.unitPrice.toFixed(2)} €</td>
                <td>${line.lineTotal.toFixed(2)} €</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <p>Sous-total: ${quote.subtotal.toFixed(2)} €</p>
          ${quote.discountAmount > 0 ? `<p>Remise: -${quote.discountAmount.toFixed(2)} €</p>` : ''}
          <p>TVA (${quote.vatRate}%): ${quote.vatAmount.toFixed(2)} €</p>
          <p class="total-row">Total TTC: ${quote.total.toFixed(2)} €</p>
        </div>
      </body>
      </html>
    `;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
```

---

## 3. Frontend Implementation

### Types

Create `frontend/src/types/aluminium.types.ts`:

```typescript
export interface AluminumProfile {
  id: string;
  reference: string;
  name: string;
  type: 'PLAT' | 'TUBE' | 'CORNIERE' | 'UPN' | 'IPE' | 'CUSTOM';
  length?: number;
  width?: number;
  thickness?: number;
  unitPrice: number;
  weightPerMeter?: number;
  isActive: boolean;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  status: QuoteStatus;
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  total: number;
  validUntil: string;
  createdAt: string;
  lines?: QuoteLine[];
}

export type QuoteStatus = 
  | 'BROUILLON' 
  | 'ENVOYÉ' 
  | 'ACCEPTÉ' 
  | 'REFUSÉ' 
  | 'EXPIRÉ' 
  | 'ANNULÉ' 
  | 'ARCHIVÉ';

export interface QuoteLine {
  id: string;
  profileId: string;
  profile?: AluminumProfile;
  quantity: number;
  unitLength: number;
  unitWeight: number;
  totalWeight: number;
  unitPrice: number;
  lineTotal: number;
  description?: string;
}

export interface Customer {
  id: string;
  code: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  billingCity: string;
  billingCountry: string;
}
```

### Quote Builder Component

Create `frontend/src/components/quotes/QuoteBuilder.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { Quote, QuoteLine, AluminumProfile, Customer } from '../../types/aluminium.types';
import { profileApi, quoteApi } from '../../services/api';

interface QuoteBuilderProps {
  customerId: string;
  onSave?: (quote: Quote) => void;
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({ customerId, onSave }) => {
  const [profiles, setProfiles] = useState<AluminumProfile[]>([]);
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await profileApi.getAll({ isActive: true });
      setProfiles(response.data.data);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const addLine = (profile: AluminumProfile) => {
    const newLine: QuoteLine = {
      id: `temp-${Date.now()}`,
      profileId: profile.id,
      profile,
      quantity: 1,
      unitLength: profile.length || 6000,
      unitWeight: 0,
      totalWeight: 0,
      unitPrice: profile.unitPrice,
      lineTotal: 0,
    };
    setLines([...lines, newLine]);
    recalculateLine(newLine);
  };

  const recalculateLine = async (line: QuoteLine) => {
    try {
      const response = await profileApi.calculate(line.profileId, {
        length: line.unitLength,
        quantity: line.quantity,
      });
      
      const updatedLine = {
        ...line,
        unitWeight: response.data.weight / line.quantity,
        totalWeight: response.data.weight,
        lineTotal: line.unitPrice * line.quantity,
      };
      
      setLines(prev => prev.map(l => l.id === line.id ? updatedLine : l));
    } catch (error) {
      console.error('Calculation failed:', error);
    }
  };

  const totals = lines.reduce(
    (acc, line) => ({
      subtotal: acc.subtotal + line.lineTotal,
      weight: acc.weight + line.totalWeight,
    }),
    { subtotal: 0, weight: 0 }
  );

  return (
    <div className="quote-builder">
      <h2>Nouveau Devis</h2>
      
      <div className="profile-selector">
        <h3>Ajouter un profilé</h3>
        <select onChange={(e) => {
          const profile = profiles.find(p => p.id === e.target.value);
          if (profile) addLine(profile);
        }}>
          <option value="">Sélectionner...</option>
          {profiles.map(profile => (
            <option key={profile.id} value={profile.id}>
              {profile.reference} - {profile.name}
            </option>
          ))}
        </select>
      </div>

      <table className="quote-lines">
        <thead>
          <tr>
            <th>Référence</th>
            <th>Qté</th>
            <th>Longueur (mm)</th>
            <th>Poids (kg)</th>
            <th>Prix unit.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(line => (
            <tr key={line.id}>
              <td>{line.profile?.reference}</td>
              <td>
                <input
                  type="number"
                  value={line.quantity}
                  onChange={(e) => {
                    const updated = { ...line, quantity: parseInt(e.target.value) || 1 };
                    recalculateLine(updated);
                  }}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={line.unitLength}
                  onChange={(e) => {
                    const updated = { ...line, unitLength: parseInt(e.target.value) || 0 };
                    recalculateLine(updated);
                  }}
                />
              </td>
              <td>{line.totalWeight.toFixed(2)}</td>
              <td>{line.unitPrice.toFixed(2)} €</td>
              <td>{line.lineTotal.toFixed(2)} €</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="quote-totals">
        <p>Poids total: {totals.weight.toFixed(2)} kg</p>
        <p>Sous-total: {totals.subtotal.toFixed(2)} €</p>
      </div>

      <button 
        onClick={async () => {
          setLoading(true);
          try {
            const quote = await quoteApi.create({
              customerId,
              lines: lines.map(l => ({
                profileId: l.profileId,
                quantity: l.quantity,
                unitLength: l.unitLength,
                unitPrice: l.unitPrice,
              })),
            });
            onSave?.(quote.data);
          } catch (error) {
            console.error('Failed to save quote:', error);
          } finally {
            setLoading(false);
          }
        }}
        disabled={loading || lines.length === 0}
      >
        {loading ? 'Sauvegarde...' : 'Sauvegarder le devis'}
      </button>
    </div>
  );
};
```

---

## 4. Testing Strategy

### Unit Tests

Create `backend/tests/unit/calculation.service.test.ts`:

```typescript
import { CalculationService } from '../../src/services/calculation.service';
import { AluminumProfile, ProfileType } from '../../src/models/AluminumProfile';

describe('CalculationService', () => {
  const service = new CalculationService();

  describe('PLAT profile calculations', () => {
    const profile: AluminumProfile = {
      id: 'test-id',
      reference: 'ALU-PLAT-001',
      name: 'Flat Bar 100x10',
      type: ProfileType.PLAT,
      length: 6000,
      width: 100,
      thickness: 10,
      unitPrice: 3.50,
      density: 2.70,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('calculates weight correctly for 6000mm length', () => {
      const result = service.calculateForProfile(profile, 6000);
      // Volume = 600mm × 100mm × 10mm = 600,000 mm³ = 600 cm³
      // Weight = 600 cm³ × 2.70 g/cm³ = 1620g = 1.62 kg
      expect(result.weight.toNumber()).toBeCloseTo(1.62, 2);
    });

    it('calculates surface correctly', () => {
      const result = service.calculateForProfile(profile, 6000);
      // Surface = 6m × 0.1m = 0.6 m²
      expect(result.surface.toNumber()).toBeCloseTo(0.6, 2);
    });

    it('calculates material cost correctly', () => {
      const result = service.calculateForProfile(profile, 6000);
      // Cost = 1.62 kg × 3.50 €/kg = 5.67 €
      expect(result.materialCost.toNumber()).toBeCloseTo(5.67, 2);
    });
  });
});
```

### Integration Tests

Create `backend/tests/integration/quotes.test.ts`:

```typescript
import request from 'supertest';
import { app } from '../../src/app';
import { TestDataSource } from '../test-utils';

describe('Quotes API', () => {
  let authToken: string;
  let customerId: string;
  let profileId: string;

  beforeAll(async () => {
    await TestDataSource.initialize();
    // Setup: login, create test customer and profile
  });

  describe('POST /api/quotes', () => {
    it('creates a new quote in BROUILLON status', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customerId,
          validUntil: '2024-12-31',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('BROUILLON');
      expect(response.body.quoteNumber).toMatch(/^D-\d{4}-\d+$/);
    });
  });

  describe('POST /api/quotes/:id/lines', () => {
    it('adds a line and recalculates totals', async () => {
      // Test implementation
    });
  });

  describe('POST /api/quotes/:id/send', () => {
    it('transitions quote from BROUILLON to ENVOYÉ', async () => {
      // Test implementation
    });
  });
});
```

---

## 5. Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables configured (Puppeteer Chrome path)
- [ ] PDF templates customized with company branding
- [ ] Quote number sequence initialized
- [ ] Email templates configured for quote notifications
- [ ] Backup strategy for generated PDFs
- [ ] Monitoring for calculation errors

---

## Next Steps

1. Run database migrations
2. Implement backend services following the patterns above
3. Build frontend components
4. Create PDF templates
5. Write comprehensive tests
6. Deploy to staging environment

---

**Quickstart Version**: 1.0.0 | **Last Updated**: 2026-03-04
