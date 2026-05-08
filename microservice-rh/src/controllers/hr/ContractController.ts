import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/database';
import { EmployeeContract, ContractStatus } from '../../models/hr/EmployeeContract';
import { Employee } from '../../models/hr/Employee';

export class ContractController {
  private contractRepository = AppDataSource.getRepository(EmployeeContract);
  private employeeRepository = AppDataSource.getRepository(Employee);

  /**
   * List contracts with filters
   */
  listContracts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { 
        page = '1', 
        limit = '20', 
        status,
        employeeId,
        contractType,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const queryBuilder = this.contractRepository.createQueryBuilder('contract')
        .leftJoinAndSelect('contract.employee', 'employee')
        .orderBy('contract.startDate', 'DESC')
        .skip(skip)
        .take(parseInt(limit as string));

      if (status) {
        queryBuilder.andWhere('contract.status = :status', { status });
      }

      if (employeeId) {
        queryBuilder.andWhere('contract.employeeId = :employeeId', { employeeId });
      }

      if (contractType) {
        queryBuilder.andWhere('contract.contractType = :contractType', { contractType });
      }

      const [contracts, total] = await queryBuilder.getManyAndCount();

      res.status(200).json({
        success: true,
        data: {
          contracts,
          total,
          page: parseInt(page as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get contract by ID
   */
  getContractById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const contract = await this.contractRepository.findOne({
        where: { id },
        relations: ['employee'],
      });

      if (!contract) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Contract not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get contracts for an employee
   */
  getEmployeeContracts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.params;

      const contracts = await this.contractRepository.find({
        where: { employeeId },
        order: { startDate: 'DESC' },
      });

      res.status(200).json({
        success: true,
        data: contracts,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new contract
   */
  createContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { 
        employeeId, 
        contractType, 
        startDate, 
        endDate, 
        baseSalary, 
        workSchedule,
        weeklyHours,
        terms,
      } = req.body;

      // Validate employee exists
      const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
      if (!employee) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_EMPLOYEE', message: 'Employee not found' },
        });
        return;
      }

      // Check if employee already has active contract
      const existingActive = await this.contractRepository.findOne({
        where: { employeeId, status: ContractStatus.ACTIVE },
      });

      if (existingActive) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'ACTIVE_CONTRACT_EXISTS', 
            message: 'Employee already has an active contract' 
          },
        });
        return;
      }

      const contract = this.contractRepository.create({
        employeeId,
        employee,
        contractType,
        startDate,
        endDate,
        baseSalary,
        workSchedule,
        weeklyHours,
        terms,
        status: ContractStatus.ACTIVE,
      });

      await this.contractRepository.save(contract);

      res.status(201).json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a contract
   */
  updateContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const contract = await this.contractRepository.findOne({ 
        where: { id },
        relations: ['employee'],
      });

      if (!contract) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Contract not found' },
        });
        return;
      }

      if (contract.status !== ContractStatus.ACTIVE) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Can only update active contracts' },
        });
        return;
      }

      Object.assign(contract, updateData);
      await this.contractRepository.save(contract);

      res.status(200).json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Renew a contract
   */
  renewContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { newEndDate, newBaseSalary, newTerms } = req.body;

      const contract = await this.contractRepository.findOne({ 
        where: { id },
        relations: ['employee'],
      });

      if (!contract) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Contract not found' },
        });
        return;
      }

      if (contract.status !== ContractStatus.ACTIVE) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Can only renew active contracts' },
        });
        return;
      }

      // Mark old contract as expired
      contract.status = ContractStatus.EXPIRED;
      await this.contractRepository.save(contract);

      // Create new contract
      const newContract = this.contractRepository.create({
        employeeId: contract.employeeId,
        employee: contract.employee,
        contractType: contract.contractType,
        startDate: new Date(),
        endDate: newEndDate,
        baseSalary: newBaseSalary || contract.baseSalary,
        workSchedule: contract.workSchedule,
        weeklyHours: contract.weeklyHours,
        terms: newTerms || contract.terms,
        status: ContractStatus.ACTIVE,
        renewalDate: new Date(),
      });

      await this.contractRepository.save(newContract);

      res.status(201).json({
        success: true,
        data: newContract,
        message: 'Contract renewed successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Terminate a contract
   */
  terminateContract = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { terminationDate, reason } = req.body;

      const contract = await this.contractRepository.findOne({ where: { id } });

      if (!contract) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Contract not found' },
        });
        return;
      }

      if (contract.status !== ContractStatus.ACTIVE) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: 'Can only terminate active contracts' },
        });
        return;
      }

      contract.status = ContractStatus.TERMINATED;
      contract.endDate = terminationDate || new Date();
      contract.terms = reason ? `${contract.terms || ''}\n\nTermination reason: ${reason}` : contract.terms;

      await this.contractRepository.save(contract);

      res.status(200).json({
        success: true,
        data: contract,
        message: 'Contract terminated successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const contractController = new ContractController();
