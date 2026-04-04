import { AppDataSource } from '../../config/database';
import { QualityDecision, DecisionType, DecisionStatus } from '../../models/quality/QualityDecision';
import { NonConformity, NCStatus } from '../../models/quality/NonConformity';

export class QualityDecisionService {
  private repository = AppDataSource.getRepository(QualityDecision);
  private ncRepository = AppDataSource.getRepository(NonConformity);

  async findAll(filters?: {
    status?: DecisionStatus;
    decisionType?: DecisionType;
    ncId?: string;
  }): Promise<QualityDecision[]> {
    const query = this.repository.createQueryBuilder('decision')
      .leftJoinAndSelect('decision.nonConformity', 'nc')
      .leftJoinAndSelect('decision.approvedBy', 'approvedBy');

    if (filters?.status) {
      query.andWhere('decision.status = :status', { status: filters.status });
    }
    if (filters?.decisionType) {
      query.andWhere('decision.decision_type = :decisionType', { decisionType: filters.decisionType });
    }
    if (filters?.ncId) {
      query.andWhere('decision.nc_id = :ncId', { ncId: filters.ncId });
    }

    return query.orderBy('decision.created_at', 'DESC').getMany();
  }

  async findById(id: string): Promise<QualityDecision | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['nonConformity', 'approvedBy'],
    });
  }

  async findByNC(ncId: string): Promise<QualityDecision[]> {
    return this.repository.find({
      where: { nc_id: ncId },
      relations: ['approvedBy'],
      order: { created_at: 'DESC' },
    });
  }

  async create(data: {
    nc_id: string;
    decision_type: DecisionType;
    approved_by: string;
    notes?: string;
    quantity?: number;
    supporting_documents?: string[];
  }): Promise<QualityDecision> {
    // For decisions that require approval (like Derogation), start in pending status
    // Others can be auto-approved
    const requiresApproval = data.decision_type === DecisionType.DEROGATION;
    
    const decision = this.repository.create({
      nc_id: data.nc_id,
      decision_type: data.decision_type,
      approved_by: data.approved_by,
      notes: data.notes,
      quantity: data.quantity,
      supporting_documents: data.supporting_documents,
      status: requiresApproval ? DecisionStatus.EN_ATTENTE : DecisionStatus.APPROUVE,
      approved_at: requiresApproval ? undefined : new Date(),
    });
    
    const savedDecision = await this.repository.save(decision);
    
    // If approved, update NC status
    if (!requiresApproval) {
      await this.ncRepository.update(data.nc_id, { status: NCStatus.CLOTUREE });
    }
    
    return this.findById(savedDecision.id) as Promise<QualityDecision>;
  }

  async approve(
    id: string,
    approvedBy: string,
    notes?: string
  ): Promise<QualityDecision | null> {
    await this.repository.update(id, {
      status: DecisionStatus.APPROUVE,
      approved_by: approvedBy,
      approved_at: new Date(),
      notes: notes,
    } as any);
    
    const decision = await this.findById(id);
    
    // Close the NC when decision is approved
    if (decision) {
      await this.ncRepository.update(decision.nc_id, { status: NCStatus.CLOTUREE });
    }
    
    return this.findById(id);
  }

  async reject(
    id: string,
    rejectedBy: string,
    notes?: string
  ): Promise<QualityDecision | null> {
    await this.repository.update(id, {
      status: DecisionStatus.REJETE,
      approved_by: rejectedBy,
      approved_at: new Date(),
      notes: notes,
    } as any);
    
    return this.findById(id);
  }

  async update(
    id: string,
    data: {
      decision_type?: DecisionType;
      notes?: string;
      quantity?: number;
      supporting_documents?: string[];
    }
  ): Promise<QualityDecision | null> {
    await this.repository.update(id, data as any);
    return this.findById(id);
  }

  async getPendingApprovals(): Promise<QualityDecision[]> {
    return this.repository.find({
      where: { status: DecisionStatus.EN_ATTENTE },
      relations: ['nonConformity', 'approvedBy'],
      order: { created_at: 'ASC' },
    });
  }

  async getStatistics(startDate: Date, endDate: Date): Promise<{
    total: number;
    byType: Record<DecisionType, number>;
    approved: number;
    rejected: number;
    pending: number;
  }> {
    const decisions = await this.repository
      .createQueryBuilder('decision')
      .where('decision.created_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    const total = decisions.length;
    const byType = {
      [DecisionType.CONFORME]: decisions.filter(d => d.decision_type === DecisionType.CONFORME).length,
      [DecisionType.NON_CONFORME]: decisions.filter(d => d.decision_type === DecisionType.NON_CONFORME).length,
      [DecisionType.A_RETRAVAILLER]: decisions.filter(d => d.decision_type === DecisionType.A_RETRAVAILLER).length,
      [DecisionType.REBUT]: decisions.filter(d => d.decision_type === DecisionType.REBUT).length,
      [DecisionType.DEROGATION]: decisions.filter(d => d.decision_type === DecisionType.DEROGATION).length,
    };
    const approved = decisions.filter(d => d.status === DecisionStatus.APPROUVE).length;
    const rejected = decisions.filter(d => d.status === DecisionStatus.REJETE).length;
    const pending = decisions.filter(d => d.status === DecisionStatus.EN_ATTENTE).length;

    return { total, byType, approved, rejected, pending };
  }
}

export const qualityDecisionService = new QualityDecisionService();
