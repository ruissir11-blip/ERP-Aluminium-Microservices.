import { AppDataSource } from '../../config/database';
import { Customer } from '../../models/aluminium/Customer';
import { Like, FindOptionsWhere } from 'typeorm';

export interface CustomerFilters {
  search?: string;
  isActive?: boolean;
}

export class CustomerService {
  private customerRepository = AppDataSource.getRepository(Customer);

  /**
   * Find all customers with pagination and filters
   */
  async findAllPaginated(
    filters: CustomerFilters,
    page: number = 1,
    perPage: number = 10
  ): Promise<{ data: Customer[]; total: number; totalPages: number }> {
    const where: FindOptionsWhere<Customer> = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.companyName = Like(`%${filters.search}%`);
    }

    const [data, total] = await this.customerRepository.findAndCount({
      where,
      order: { companyName: 'ASC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      data,
      total,
      totalPages: Math.ceil(total / perPage),
    };
  }

  /**
   * Find customer by ID
   */
  async findById(id: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { id },
    });
  }

  /**
   * Find customer by code
   */
  async findByCode(code: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { code },
    });
  }

  /**
   * Create a new customer
   */
  async create(customerData: Partial<Customer>): Promise<Customer> {
    // Generate customer code if not provided
    if (!customerData.code) {
      const count = await this.customerRepository.count();
      customerData.code = `CLI-${String(count + 1).padStart(5, '0')}`;
    }

    const customer = this.customerRepository.create(customerData);
    return this.customerRepository.save(customer);
  }

  /**
   * Update an existing customer
   */
  async update(id: string, customerData: Partial<Customer>): Promise<Customer | null> {
    const customer = await this.findById(id);
    if (!customer) {
      return null;
    }

    Object.assign(customer, customerData);
    return this.customerRepository.save(customer);
  }

  /**
   * Deactivate a customer (soft delete)
   */
  async deactivate(id: string): Promise<boolean> {
    const customer = await this.findById(id);
    if (!customer) {
      return false;
    }

    customer.isActive = false;
    await this.customerRepository.save(customer);
    return true;
  }

  /**
   * Reactivate a customer
   */
  async reactivate(id: string): Promise<boolean> {
    const customer = await this.findById(id);
    if (!customer) {
      return false;
    }

    customer.isActive = true;
    await this.customerRepository.save(customer);
    return true;
  }

  /**
   * Get all active customers (for dropdowns)
   */
  async findAllActive(): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { isActive: true },
      order: { companyName: 'ASC' },
    });
  }
}
