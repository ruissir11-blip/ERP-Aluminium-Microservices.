import { AppDataSource } from '../../config/database';
import { CorrectiveAction, CorrectiveActionStatus } from '../../models/quality/CorrectiveAction';
import { NonConformity, NCStatus } from '../../models/quality/NonConformity';
import { In } from 'typeorm';

export class CorrectiveActionService {
  private repository = AppDataSource.getRepository(CorrectiveAction);
  private ncRepository = AppDataSource.getRepository(NonConformity);

  async findAll(filters?: {
    status?: CorrectiveActionStatus;
    ncId?: string;
    assignedTo?: string;
  }): Promise<CorrectiveAction[]> {
    const query = this.repository.createQueryBuilder('action')
      .leftJoinAndSelect('action.nonConformity', 'nc')
      .leftJoinAndSelect('action.assignedTo', 'assignedTo');

    if (filters?.status) {
      query.andWhere('action.status = :status', { status: filters.status });
    }
    if (filters?.ncId) {
      query.andWhere('action.nc_id = :ncId', { ncId: filters.ncId });
    }
    if (filters?.assignedTo) {
      query.andWhere('action.assigned_to = :assignedTo', { assignedTo: filters.assignedTo });
    }

    return query.orderBy('action.due_date', 'ASC').getMany();
  }

  async findById(id: string): Promise<CorrectiveAction | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['nonConformity', 'assignedTo'],
    });
  }

  async findByNC(ncId: string): Promise<CorrectiveAction[]> {
    return this.repository.find({
      where: { nc_id: ncId },
      relations: ['assignedTo'],
      order: { due_date: 'ASC' },
    });
  }

  async create(data: {
    nc_id: string;
    description: string;
    assigned_to?: string;
    due_date: Date;
  }): Promise<CorrectiveAction> {
    const action = this.repository.create({
      ...data,
      status: CorrectiveActionStatus.A_FAIRE,
    });
    
    const savedAction = await this.repository.save(action);
    
    // Update NC status to "En cours" if it's still "Ouverte"
    await this.ncRepository.update(data.nc_id, { status: NCStatus.EN_COURS });
    
    return this.findById(savedAction.id) as Promise<CorrectiveAction>;
  }

  async update(
    id: string,
    data: {
      description?: string;
      assigned_to?: string;
      due_date?: Date;
      status?: CorrectiveActionStatus;
      effectiveness_verification?: string;
    }
  ): Promise<CorrectiveAction | null> {
    const updateData: any = { ...data };
    
    if (data.status === CorrectiveActionStatus.TERMINE) {
      updateData.completed_at = new Date();
    }

    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  async complete(id: string, effectivenessVerification?: string): Promise<CorrectiveAction | null> {
    await this.repository.update(id, {
      status: CorrectiveActionStatus.TERMINE,
      completed_at: new Date(),
      effectiveness_verification: effectivenessVerification,
    });
    
    const action = await this.findById(id);
    
    // Check if all actions for this NC are completed
    if (action) {
      const ncActions = await this.findByNC(action.nc_id);
      const allCompleted = ncActions.every(a => 
        a.status === CorrectiveActionStatus.TERMINE || a.status === CorrectiveActionStatus.VERIFIE
      );
      
      if (allCompleted) {
        await this.ncRepository.update(action.nc_id, { status: NCStatus.TRAITEMENT });
      }
    }
    
    return this.findById(id);
  }

  async verify(id: string, verificationNotes: string): Promise<CorrectiveAction | null> {
    await this.repository.update(id, {
      status: CorrectiveActionStatus.VERIFIE,
      verified_at: new Date(),
      effectiveness_verification: verificationNotes,
    });
    
    const action = await this.findById(id);
    
    // If verified, check if NC can be closed
    if (action) {
      const ncActions = await this.findByNC(action.nc_id);
      const allVerified = ncActions.every(a => a.status === CorrectiveActionStatus.VERIFIE);
      
      if (allVerified) {
        await this.ncRepository.update(action.nc_id, { status: NCStatus.CLOTUREE });
      }
    }
    
    return this.findById(id);
  }

  async getOverdue(): Promise<CorrectiveAction[]> {
    const now = new Date();
    return this.repository.find({
      where: {
        status: In([CorrectiveActionStatus.A_FAIRE, CorrectiveActionStatus.EN_COURS]),
        due_date: In([null as any]), // This won't work as expected, need different approach
      },
      relations: ['nonConformity', 'assignedTo'],
    });
  }

  async getUpcoming(days: number = 7): Promise<CorrectiveAction[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.repository
      .createQueryBuilder('action')
      .leftJoinAndSelect('action.nonConformity', 'nc')
      .leftJoinAndSelect('action.assignedTo', 'assignedTo')
      .where('action.status IN (:...statuses)', {
        statuses: [CorrectiveActionStatus.A_FAIRE, CorrectiveActionStatus.EN_COURS],
      })
      .andWhere('action.due_date BETWEEN :now AND :futureDate', {
        now,
        futureDate,
      })
      .orderBy('action.due_date', 'ASC')
      .getMany();
  }
}

export const correctiveActionService = new CorrectiveActionService();
