import { AppDataSource } from '../../config/database';
import { NCRootCause, RootCauseMethod, RootCauseCategory } from '../../models/quality/NCRootCause';
import { NonConformity, NCStatus } from '../../models/quality/NonConformity';

export class NCRootCauseService {
  private repository = AppDataSource.getRepository(NCRootCause);
  private ncRepository = AppDataSource.getRepository(NonConformity);

  async findAll(filters?: {
    method?: RootCauseMethod;
    category?: RootCauseCategory;
    ncId?: string;
  }): Promise<NCRootCause[]> {
    const query = this.repository.createQueryBuilder('rootCause')
      .leftJoinAndSelect('rootCause.nonConformity', 'nc');

    if (filters?.method) {
      query.andWhere('rootCause.method = :method', { method: filters.method });
    }
    if (filters?.category) {
      query.andWhere('rootCause.category = :category', { category: filters.category });
    }
    if (filters?.ncId) {
      query.andWhere('rootCause.nc_id = :ncId', { ncId: filters.ncId });
    }

    return query.orderBy('rootCause.created_at', 'DESC').getMany();
  }

  async findById(id: string): Promise<NCRootCause | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['nonConformity'],
    });
  }

  async findByNC(ncId: string): Promise<NCRootCause | null> {
    return this.repository.findOne({
      where: { nc_id: ncId },
      relations: ['nonConformity'],
    });
  }

  async create(data: {
    nc_id: string;
    method: RootCauseMethod;
    analysis_json?: Record<string, unknown>;
    identified_cause?: string;
    category?: RootCauseCategory;
    recommendations?: string;
    analyzed_by?: string;
  }): Promise<NCRootCause> {
    const rootCause = this.repository.create({
      ...data,
      analyzed_at: new Date(),
    });
    
    const savedRootCause = await this.repository.save(rootCause);
    
    // Update NC status to "En cours" if it's still "Ouverte" or "En cours"
    await this.ncRepository.update(data.nc_id, { status: NCStatus.TRAITEMENT });
    
    return this.findById(savedRootCause.id) as Promise<NCRootCause>;
  }

  async update(
    id: string,
    data: {
      method?: RootCauseMethod;
      identified_cause?: string;
      category?: RootCauseCategory;
      recommendations?: string;
      analyzed_by?: string;
    }
  ): Promise<NCRootCause | null> {
    await this.repository.update(id, data as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  // 5 Pourquoi analysis helper
  async addCinqPourquoi(ncId: string, pourquoiResponses: string[]): Promise<NCRootCause | null> {
    let rootCause = await this.findByNC(ncId);
    
    const analysis = {
      method: RootCauseMethod.CINQ_POURQUOI,
      responses: pourquoiResponses,
      completed_at: new Date(),
    };

    if (rootCause) {
      // Update existing
      await this.repository.update(rootCause.id, {
        analysis_json: analysis as any,
      } as any);
    } else {
      // Create new
      rootCause = await this.create({
        nc_id: ncId,
        method: RootCauseMethod.CINQ_POURQUOI,
        analysis_json: analysis as any,
      });
    }

    return this.findById(rootCause.id);
  }

  // Ishikawa diagram analysis helper
  async addIshikawa(ncId: string, ishikawaData: {
    machine?: string[];
    method?: string[];
    material?: string[];
    man?: string[];
    environment?: string[];
    mesure?: string[];
  }): Promise<NCRootCause | null> {
    let rootCause = await this.findByNC(ncId);
    
    const analysis = {
      method: RootCauseMethod.ISHIKAWA,
      causes: ishikawaData,
      completed_at: new Date(),
    };

    if (rootCause) {
      await this.repository.update(rootCause.id, {
        analysis_json: analysis as any,
      } as any);
    } else {
      rootCause = await this.create({
        nc_id: ncId,
        method: RootCauseMethod.ISHIKAWA,
        analysis_json: analysis as any,
      });
    }

    return this.findById(rootCause.id);
  }

  async getStatistics(startDate: Date, endDate: Date): Promise<{
    total: number;
    byMethod: Record<RootCauseMethod, number>;
    byCategory: Record<RootCauseCategory, number>;
  }> {
    const rootCauses = await this.repository
      .createQueryBuilder('rootCause')
      .where('rootCause.analyzed_at BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getMany();

    const total = rootCauses.length;
    const byMethod = {
      [RootCauseMethod.CINQ_POURQUOI]: rootCauses.filter(rc => rc.method === RootCauseMethod.CINQ_POURQUOI).length,
      [RootCauseMethod.ISHIKAWA]: rootCauses.filter(rc => rc.method === RootCauseMethod.ISHIKAWA).length,
    };
    const byCategory = {
      [RootCauseCategory.MACHINE]: rootCauses.filter(rc => rc.category === RootCauseCategory.MACHINE).length,
      [RootCauseCategory.METHODE]: rootCauses.filter(rc => rc.category === RootCauseCategory.METHODE).length,
      [RootCauseCategory.MATERIAU]: rootCauses.filter(rc => rc.category === RootCauseCategory.MATERIAU).length,
      [RootCauseCategory.HOMME]: rootCauses.filter(rc => rc.category === RootCauseCategory.HOMME).length,
      [RootCauseCategory.ENVIRONNEMENT]: rootCauses.filter(rc => rc.category === RootCauseCategory.ENVIRONNEMENT).length,
      [RootCauseCategory.MESURE]: rootCauses.filter(rc => rc.category === RootCauseCategory.MESURE).length,
    };

    return { total, byMethod, byCategory };
  }
}

export const ncRootCauseService = new NCRootCauseService();
