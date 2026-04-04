import { AppDataSource } from '../../config/database';
import { NonConformity, NCSeverity, NCStatus } from '../../models/quality/NonConformity';
import { Between, In, QueryRunner } from 'typeorm';

export class NonConformityService {
  private repository = AppDataSource.getRepository(NonConformity);

  /**
   * Generate a unique NC number using database transaction to prevent race conditions.
   * Uses row-level locking to ensure concurrent requests don't get duplicate numbers.
   */
  private async generateNCNumber(): Promise<string> {
    const queryRunner: QueryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      await queryRunner.startTransaction();
      
      const year = new Date().getFullYear();
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      
      // Lock the table for reading to get consistent count
      await queryRunner.query('LOCK TABLE non_conformities IN ACCESS SHARE MODE');
      
      const countResult = await queryRunner.manager
        .createQueryBuilder(NonConformity, 'nc')
        .select('COUNT(nc.id)', 'count')
        .where('nc.created_at >= :startDate', { startDate })
        .andWhere('nc.created_at <= :endDate', { endDate })
        .getRawOne();
      
      const count = parseInt(countResult?.count || '0', 10);
      const ncNumber = `NC-${year}-${String(count + 1).padStart(4, '0')}`;
      
      await queryRunner.commitTransaction();
      
      return ncNumber;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filters?: {
    status?: NCStatus;
    severity?: NCSeverity;
    startDate?: Date;
    endDate?: Date;
  }): Promise<NonConformity[]> {
    const query = this.repository.createQueryBuilder('nc')
      .leftJoinAndSelect('nc.detectedBy', 'detectedBy');

    if (filters?.status) {
      query.andWhere('nc.status = :status', { status: filters.status });
    }
    if (filters?.severity) {
      query.andWhere('nc.severity = :severity', { severity: filters.severity });
    }
    if (filters?.startDate && filters?.endDate) {
      query.andWhere('nc.detected_at BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    return query.orderBy('nc.detected_at', 'DESC').getMany();
  }

  async findById(id: string): Promise<NonConformity | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['detectedBy'],
    });
  }

  async findByNCNumber(ncNumber: string): Promise<NonConformity | null> {
    return this.repository.findOne({
      where: { nc_number: ncNumber },
      relations: ['detectedBy'],
    });
  }

  async findByLot(lotNumber: string): Promise<NonConformity[]> {
    return this.repository.find({
      where: { lot_number: lotNumber },
      relations: ['detectedBy'],
      order: { detected_at: 'DESC' },
    });
  }

  async create(data: {
    production_order_id?: string;
    lot_number?: string;
    description: string;
    severity: NCSeverity;
    detected_by: string;
    photos?: string[];
  }): Promise<NonConformity> {
    // Use transaction to prevent race conditions in NC number generation
    const queryRunner: QueryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
      await queryRunner.startTransaction();
      
      const year = new Date().getFullYear();
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31, 23, 59, 59);
      
      // Get the current max count within the transaction
      const countResult = await queryRunner.manager
        .createQueryBuilder(NonConformity, 'nc')
        .select('MAX(CAST(SUBSTRING(nc.nc_number FROM 10 FOR 4) AS INTEGER))', 'maxCount')
        .where('nc.nc_number LIKE :pattern', { pattern: `NC-${year}-%` })
        .getRawOne();
      
      const maxCount = parseInt(countResult?.maxCount || '0', 10);
      const ncNumber = `NC-${year}-${String(maxCount + 1).padStart(4, '0')}`;
      
      const nonConformity = queryRunner.manager.create(NonConformity, {
        ...data,
        nc_number: ncNumber,
        status: NCStatus.OUVERTE,
      });
      
      const saved = await queryRunner.manager.save(nonConformity);
      
      await queryRunner.commitTransaction();
      
      return saved;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: string,
    data: {
      description?: string;
      severity?: NCSeverity;
      status?: NCStatus;
      resolution_notes?: string;
    }
  ): Promise<NonConformity | null> {
    const updateData: any = { ...data };
    
    if (data.status === NCStatus.CLOTUREE) {
      updateData.closed_at = new Date();
    }

    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  async close(id: string, resolutionNotes?: string): Promise<NonConformity | null> {
    await this.repository.update(id, {
      status: NCStatus.CLOTUREE,
      closed_at: new Date(),
      resolution_notes: resolutionNotes,
    });
    return this.findById(id);
  }

  async getStatistics(startDate: Date, endDate: Date): Promise<{
    total: number;
    bySeverity: Record<NCSeverity, number>;
    byStatus: Record<NCStatus, number>;
    closureRate: number;
    averageClosureTime: number;
  }> {
    const ncRecords = await this.repository.find({
      where: {
        detected_at: Between(startDate, endDate),
      },
    });

    const total = ncRecords.length;
    const bySeverity = {
      [NCSeverity.CRITIQUE]: ncRecords.filter(nc => nc.severity === NCSeverity.CRITIQUE).length,
      [NCSeverity.MAJEUR]: ncRecords.filter(nc => nc.severity === NCSeverity.MAJEUR).length,
      [NCSeverity.MINEUR]: ncRecords.filter(nc => nc.severity === NCSeverity.MINEUR).length,
    };
    const byStatus = {
      [NCStatus.OUVERTE]: ncRecords.filter(nc => nc.status === NCStatus.OUVERTE).length,
      [NCStatus.EN_COURS]: ncRecords.filter(nc => nc.status === NCStatus.EN_COURS).length,
      [NCStatus.TRAITEMENT]: ncRecords.filter(nc => nc.status === NCStatus.TRAITEMENT).length,
      [NCStatus.CLOTUREE]: ncRecords.filter(nc => nc.status === NCStatus.CLOTUREE).length,
    };
    
    const closedNCs = ncRecords.filter(nc => nc.closed_at);
    const closureRate = total > 0 ? (closedNCs.length / total) * 100 : 0;
    
    const averageClosureTime = closedNCs.length > 0
      ? closedNCs.reduce((acc, nc) => {
          const diff = new Date(nc.closed_at).getTime() - new Date(nc.detected_at).getTime();
          return acc + diff;
        }, 0) / closedNCs.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    return { total, bySeverity, byStatus, closureRate, averageClosureTime };
  }

  async getOpenNCsByPriority(): Promise<NonConformity[]> {
    const priorityOrder = [NCSeverity.CRITIQUE, NCSeverity.MAJEUR, NCSeverity.MINEUR];
    
    const ncRecords = await this.repository.find({
      where: {
        status: In([NCStatus.OUVERTE, NCStatus.EN_COURS, NCStatus.TRAITEMENT]),
      },
      order: { detected_at: 'ASC' },
    });

    // Sort by severity priority
    return ncRecords.sort((a, b) => {
      const aIndex = priorityOrder.indexOf(a.severity);
      const bIndex = priorityOrder.indexOf(b.severity);
      return aIndex - bIndex;
    });
  }
}

export const nonConformityService = new NonConformityService();
