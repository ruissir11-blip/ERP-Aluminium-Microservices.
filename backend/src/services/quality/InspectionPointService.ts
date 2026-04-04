import { AppDataSource } from '../../config/database';
import { InspectionPoint, ProductionStage } from '../../models/quality/InspectionPoint';
import { InspectionCriteria } from '../../models/quality/InspectionCriteria';
import { In } from 'typeorm';

export class InspectionPointService {
  private repository = AppDataSource.getRepository(InspectionPoint);
  private criteriaRepository = AppDataSource.getRepository(InspectionCriteria);

  async findAll(): Promise<InspectionPoint[]> {
    return this.repository.find({
      where: { is_active: true },
      relations: ['criteria'],
      order: { production_stage: 'ASC', name: 'ASC' },
    });
  }

  async findById(id: string): Promise<InspectionPoint | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['criteria'],
    });
  }

  async findByStage(stage: ProductionStage): Promise<InspectionPoint[]> {
    return this.repository.find({
      where: { production_stage: stage, is_active: true },
      relations: ['criteria'],
      order: { name: 'ASC' },
    });
  }

  async create(data: {
    production_stage: ProductionStage;
    name: string;
    description?: string;
    is_mandatory?: boolean;
    criteria?: Partial<InspectionCriteria>[];
  }): Promise<InspectionPoint> {
    const { criteria, ...pointData } = data;
    
    const point = this.repository.create(pointData);
    const savedPoint = await this.repository.save(point);

    if (criteria && criteria.length > 0) {
      const criteriaEntities = criteria.map((c) =>
        this.criteriaRepository.create({
          ...c,
          inspection_point_id: savedPoint.id,
        })
      );
      await this.criteriaRepository.save(criteriaEntities);
    }

    return this.findById(savedPoint.id) as Promise<InspectionPoint>;
  }

  async update(
    id: string,
    data: {
      production_stage?: ProductionStage;
      name?: string;
      description?: string;
      is_mandatory?: boolean;
      is_active?: boolean;
      criteria?: Partial<InspectionCriteria>[];
    }
  ): Promise<InspectionPoint | null> {
    const { criteria, ...pointData } = data;
    
    await this.repository.update(id, pointData as any);

    if (criteria) {
      await this.criteriaRepository.delete({ inspection_point_id: id });
      const criteriaEntities = criteria.map((c) =>
        this.criteriaRepository.create({
          ...c,
          inspection_point_id: id,
        })
      );
      await this.criteriaRepository.save(criteriaEntities);
    }

    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.update(id, { is_active: false });
  }

  async findByIds(ids: string[]): Promise<InspectionPoint[]> {
    return this.repository.find({
      where: { id: In(ids), is_active: true },
      relations: ['criteria'],
    });
  }
}

export const inspectionPointService = new InspectionPointService();
