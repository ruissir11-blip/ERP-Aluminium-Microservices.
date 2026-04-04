import { AppDataSource } from '../../config/database';
import { InspectionRecord, InspectionStatus, InspectionResult } from '../../models/quality/InspectionRecord';
import { InspectionCriteria } from '../../models/quality/InspectionCriteria';
import { Between, In } from 'typeorm';

export class InspectionRecordService {
  private repository = AppDataSource.getRepository(InspectionRecord);
  private criteriaRepository = AppDataSource.getRepository(InspectionCriteria);

  async findAll(filters?: {
    status?: InspectionStatus;
    result?: InspectionResult;
    inspectorId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<InspectionRecord[]> {
    const query = this.repository.createQueryBuilder('record')
      .leftJoinAndSelect('record.inspectionPoint', 'point')
      .leftJoinAndSelect('record.inspector', 'inspector');

    if (filters?.status) {
      query.andWhere('record.status = :status', { status: filters.status });
    }
    if (filters?.result) {
      query.andWhere('record.result = :result', { result: filters.result });
    }
    if (filters?.inspectorId) {
      query.andWhere('record.inspector_id = :inspectorId', { inspectorId: filters.inspectorId });
    }
    if (filters?.startDate && filters?.endDate) {
      query.andWhere('record.created_at BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    return query.orderBy('record.created_at', 'DESC').getMany();
  }

  async findById(id: string): Promise<InspectionRecord | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['inspectionPoint', 'inspector'],
    });
  }

  async findByProductionOrder(productionOrderId: string): Promise<InspectionRecord[]> {
    return this.repository.find({
      where: { production_order_id: productionOrderId },
      relations: ['inspectionPoint', 'inspector'],
      order: { created_at: 'ASC' },
    });
  }

  async create(data: {
    production_order_id?: string;
    inspection_point_id: string;
    inspector_id: string;
    status?: InspectionStatus;
  }): Promise<InspectionRecord> {
    const record = this.repository.create({
      ...data,
      status: data.status || InspectionStatus.PENDING,
      result: InspectionResult.EN_ATTENTE,
    });
    return this.repository.save(record);
  }

  async update(
    id: string,
    data: {
      status?: InspectionStatus;
      result?: InspectionResult;
      measured_values_json?: Record<string, unknown>;
      observations?: string;
      signature?: string;
    }
  ): Promise<InspectionRecord | null> {
    const updateData: any = { ...data };
    
    if (data.signature) {
      updateData.signed_at = new Date();
    }

    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  async completeInspection(
    id: string,
    measuredValues: Record<string, number>,
    inspectorId: string
  ): Promise<InspectionRecord | null> {
    const record = await this.findById(id);
    if (!record) return null;

    // Get criteria for this inspection point
    const criteria = await this.criteriaRepository.find({
      where: { inspection_point_id: record.inspection_point_id, is_active: true },
    });

    // Check each measured value against tolerance
    const results: Record<string, { value: number; status: string }> = {};
    let hasNonConforme = false;

    for (const [paramName, value] of Object.entries(measuredValues)) {
      const criterion = criteria.find(c => c.parameter_name === paramName);
      if (criterion) {
        const isConforme = 
          (!criterion.tolerance_min || value >= Number(criterion.tolerance_min)) &&
          (!criterion.tolerance_max || value <= Number(criterion.tolerance_max));
        
        results[paramName] = {
          value,
          status: isConforme ? 'conforme' : 'non_conforme',
        };
        
        if (!isConforme) hasNonConforme = true;
      } else {
        results[paramName] = { value, status: 'checked' };
      }
    }

    const result: InspectionResult = hasNonConforme ? InspectionResult.NON_CONFORME : InspectionResult.CONFORME;

    await this.repository.update(id, {
      status: InspectionStatus.COMPLETED,
      result,
      measured_values_json: results as any,
      signed_at: new Date(),
    });

    return this.findById(id);
  }

  async getStatistics(startDate: Date, endDate: Date): Promise<{
    total: number;
    conforme: number;
    nonConforme: number;
    enAttente: number;
    ncRate: number;
  }> {
    const records = await this.repository.find({
      where: {
        created_at: Between(startDate, endDate),
      },
    });

    const total = records.length;
    const conforme = records.filter(r => r.result === InspectionResult.CONFORME).length;
    const nonConforme = records.filter(r => r.result === InspectionResult.NON_CONFORME).length;
    const enAttente = records.filter(r => r.result === InspectionResult.EN_ATTENTE).length;
    const ncRate = total > 0 ? (nonConforme / total) * 100 : 0;

    return { total, conforme, nonConforme, enAttente, ncRate };
  }
}

export const inspectionRecordService = new InspectionRecordService();
