import { Request, Response } from 'express';
import { CustomerService } from '../../services/aluminium/CustomerService';
import { isValidUUID } from '../../utils/validators';
import { Customer } from '../../models/aluminium/Customer';

/**
 * DTO for creating a customer
 */
export interface CreateCustomerDTO {
  code?: string;
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  billingStreet?: string;
  billingCity?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  paymentTerms?: string;
  vatNumber?: string;
}

/**
 * DTO for updating a customer
 */
export interface UpdateCustomerDTO {
  code?: string;
  companyName?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  billingStreet?: string;
  billingCity?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  paymentTerms?: string;
  vatNumber?: string;
}

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  /**
   * GET /api/customers
   * List all customers with optional filtering and pagination
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const perPage = Math.min(100, Math.max(1, parseInt(req.query.perPage as string) || 10));
      
      const filters = {
        search: req.query.search as string,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      };

      const result = await this.customerService.findAllPaginated(filters, page, perPage);
      res.json({ 
        success: true,
        data: {
          data: result.data,
          total: result.total,
          totalPages: result.totalPages,
          currentPage: page,
          perPage: perPage
        }
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('Database unavailable')) {
        res.status(503).json({ error: 'Service temporarily unavailable', details: errorMessage });
        return;
      }
      res.status(500).json({ error: 'Failed to fetch customers', details: errorMessage });
    }
  }

  /**
   * GET /api/customers/active
   * Get all active customers (for dropdowns)
   */
  async getActive(req: Request, res: Response): Promise<void> {
    try {
      const customers = await this.customerService.findAllActive();
      res.json({ 
        success: true,
        data: customers
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      res.status(500).json({ error: 'Failed to fetch active customers', details: errorMessage });
    }
  }

  /**
   * GET /api/customers/:id
   * Get customer by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid customer ID format' });
        return;
      }
      
      const customer = await this.customerService.findById(id);

      if (!customer) {
        res.status(404).json({ 
          success: false,
          error: { 
            code: 'NOT_FOUND',
            message: 'Customer not found' 
          } 
        });
        return;
      }

      res.json({ 
        success: true,
        data: customer
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      res.status(500).json({ error: 'Failed to fetch customer', details: errorMessage });
    }
  }

  /**
   * POST /api/customers
   * Create a new customer
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const customerData = req.body as CreateCustomerDTO;
      
      // Validate required fields
      if (!customerData.companyName) {
        res.status(400).json({ error: 'Company name is required' });
        return;
      }

      // Check if customer code already exists
      if (customerData.code) {
        const existingCustomer = await this.customerService.findByCode(customerData.code);
        if (existingCustomer) {
          res.status(400).json({ error: 'Customer code already exists' });
          return;
        }
      }

      const customer = await this.customerService.create(customerData as Partial<Customer>);
      res.status(201).json({ 
        success: true,
        data: customer
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      res.status(500).json({ error: 'Failed to create customer', details: errorMessage });
    }
  }

  /**
   * PUT /api/customers/:id
   * Update an existing customer
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid customer ID format' });
        return;
      }

      const customerData = req.body as UpdateCustomerDTO;
      
      // Check if customer exists
      const existingCustomer = await this.customerService.findById(id);
      if (!existingCustomer) {
        res.status(404).json({ 
          success: false,
          error: { 
            code: 'NOT_FOUND',
            message: 'Customer not found' 
          } 
        });
        return;
      }

      // Check if customer code is being changed and if it already exists
      if (customerData.code && customerData.code !== existingCustomer.code) {
        const duplicateCustomer = await this.customerService.findByCode(customerData.code);
        if (duplicateCustomer) {
          res.status(400).json({ error: 'Customer code already exists' });
          return;
        }
      }

      const customer = await this.customerService.update(id, customerData as Partial<Customer>);
      res.json({ 
        success: true,
        data: customer
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      res.status(500).json({ error: 'Failed to update customer', details: errorMessage });
    }
  }

  /**
   * DELETE /api/customers/:id
   * Deactivate a customer (soft delete)
   */
  async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid customer ID format' });
        return;
      }

      const success = await this.customerService.deactivate(id);
      
      if (!success) {
        res.status(404).json({ 
          success: false,
          error: { 
            code: 'NOT_FOUND',
            message: 'Customer not found' 
          } 
        });
        return;
      }

      res.json({ 
        success: true,
        message: 'Customer deactivated successfully'
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      res.status(500).json({ error: 'Failed to deactivate customer', details: errorMessage });
    }
  }

  /**
   * POST /api/customers/:id/reactivate
   * Reactivate a customer
   */
  async reactivate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid customer ID format' });
        return;
      }

      const success = await this.customerService.reactivate(id);
      
      if (!success) {
        res.status(404).json({ 
          success: false,
          error: { 
            code: 'NOT_FOUND',
            message: 'Customer not found' 
          } 
        });
        return;
      }

      res.json({ 
        success: true,
        message: 'Customer reactivated successfully'
      });
    } catch (error) {
      const errorMessage = (error as Error).message;
      res.status(500).json({ error: 'Failed to reactivate customer', details: errorMessage });
    }
  }
}
