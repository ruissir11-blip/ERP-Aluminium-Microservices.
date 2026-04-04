import { Repository, DataSource } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { CostComponent, CostComponentType } from '../../models/comptabilite/CostComponent';

export class CostComponentRepository {
  private repository: Repository<CostComponent>;

  constructor(dataSource?: DataSource) {
    const ds = dataSource || AppDataSource;
    this.repository = ds.getRepository(CostComponent);
  }

  /**
   * Find all cost components with optional filters
   */
  async findAll(
    filters: { type?: CostComponentType; isActive?: boolean } = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: CostComponent[]; total: number }> {
    const query = this.repository.createQueryBuilder('component');

    if (filters.type) {
      query.andWhere('component.type = :type', { type: filters.type });
    }

    if (filters.isActive !== undefined) {
      query.andWhere('component.isActive = :isActive', { isActive: filters.isActive });
    }

    const [data, total] = await query
      .orderBy('component.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  /**
   * Find a single cost component by ID
   */
  async findById(id: string): Promise<CostComponent | null> {
    return this.repository.findOne({ where: { id } });
  }

  /**
   * Create a new cost component
   */
  async create(data: {
    name: string;
    type: CostComponentType;
    rate: number;
    unit: string;
  }): Promise<CostComponent> {
    const component = new CostComponent();
    component.name = data.name;
    component.type = data.type;
    component.rate = data.rate;
    component.unit = data.unit;
    component.isActive = true;

    return this.repository.save(component);
  }

  /**
   * Update a cost component
   */
  async update(
    id: string,
    updates: {
      name?: string;
      type?: CostComponentType;
      rate?: number;
      unit?: string;
      isActive?: boolean;
    }
  ): Promise<CostComponent | null> {
    const component = await this.findById(id);

    if (!component) {
      return null;
    }

    Object.assign(component, updates);
    return this.repository.save(component);
  }

  /**
   * Soft delete a cost component (set isActive to false)
   */
  async softDelete(id: string): Promise<boolean> {
    const component = await this.findById(id);

    if (!component) {
      return false;
    }

    component.isActive = false;
    await this.repository.save(component);
    return true;
  }

  /**
   * Get active cost components by type
   */
  async findByType(type: CostComponentType): Promise<CostComponent[]> {
    return this.repository.find({
      where: { type, isActive: true },
    });
  }
}
