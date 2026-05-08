        import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Machine, MachineStatus } from '../../models/maintenance/Machine';
import { MachineDocument } from '../../models/maintenance/MachineDocument';

export interface CreateMachineInput {
  designation: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  acquisitionValue?: number;
  residualValue?: number;
  workshop?: string;
  locationDetails?: string;
  installationDate?: Date;
  notes?: string;
}

export interface UpdateMachineInput extends Partial<CreateMachineInput> {
  status?: MachineStatus;
  operationalHours?: number;
}

export interface MachineFilters {
  status?: MachineStatus;
  workshop?: string;
  search?: string;
}

export class MachineService {
  private machineRepository: Repository<Machine>;
  private documentRepository: Repository<MachineDocument>;

  constructor() {
    this.machineRepository = AppDataSource.getRepository(Machine);
    this.documentRepository = AppDataSource.getRepository(MachineDocument);
  }

  /**
   * Get all machines with optional filtering
   */
  async findAll(filters: MachineFilters = {}): Promise<Machine[]> {
    const query = this.machineRepository.createQueryBuilder('machine')
      .leftJoinAndSelect('machine.documents', 'documents');

    if (filters.status) {
      query.andWhere('machine.status = :status', { status: filters.status });
    }

    if (filters.workshop) {
      query.andWhere('machine.workshop = :workshop', { workshop: filters.workshop });
    }

    if (filters.search) {
      query.andWhere(
        '(machine.designation ILIKE :search OR machine.brand ILIKE :search OR machine.model ILIKE :search OR machine.serialNumber ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return query.orderBy('machine.designation', 'ASC').getMany();
  }

  /**
   * Get machine by ID
   */
  async findById(id: string): Promise<Machine | null> {
    return this.machineRepository.findOne({
      where: { id },
      relations: ['documents', 'workOrders'],
    });
  }

  /**
   * Get machine by serial number
   */
  async findBySerialNumber(serialNumber: string): Promise<Machine | null> {
    return this.machineRepository.findOneBy({ serialNumber });
  }

  /**
   * Create new machine
   */
  async create(input: CreateMachineInput): Promise<Machine> {
    // Check for duplicate serial number
    if (input.serialNumber) {
      const existing = await this.findBySerialNumber(input.serialNumber);
      if (existing) {
        throw new Error(`Machine with serial number '${input.serialNumber}' already exists`);
      }
    }

    const machine = this.machineRepository.create({
      ...input,
      status: MachineStatus.ACTIVE,
      operationalHours: 0,
    });

    return this.machineRepository.save(machine);
  }

  /**
   * Update existing machine
   */
  async update(id: string, input: UpdateMachineInput): Promise<Machine> {
    const machine = await this.findById(id);
    if (!machine) {
      throw new Error('Machine not found');
    }

    // Check for duplicate serial number if changing
    if (input.serialNumber && input.serialNumber !== machine.serialNumber) {
      const existing = await this.findBySerialNumber(input.serialNumber);
      if (existing) {
        throw new Error(`Machine with serial number '${input.serialNumber}' already exists`);
      }
    }

    Object.assign(machine, input);
    return this.machineRepository.save(machine);
  }

  /**
   * Archive machine (soft delete)
   */
  async archive(id: string): Promise<Machine> {
    const machine = await this.findById(id);
    if (!machine) {
      throw new Error('Machine not found');
    }

    machine.status = MachineStatus.ARCHIVED;
    return this.machineRepository.save(machine);
  }

  /**
   * Reactivate machine
   */
  async reactivate(id: string): Promise<Machine> {
    const machine = await this.findById(id);
    if (!machine) {
      throw new Error('Machine not found');
    }

    machine.status = MachineStatus.ACTIVE;
    return this.machineRepository.save(machine);
  }

  /**
   * Update machine status
   */
  async updateStatus(id: string, status: MachineStatus): Promise<Machine> {
    const machine = await this.findById(id);
    if (!machine) {
      throw new Error('Machine not found');
    }

    machine.status = status;
    return this.machineRepository.save(machine);
  }

  /**
   * Update operational hours
   */
  async updateOperationalHours(id: string, hours: number): Promise<Machine> {
    const machine = await this.findById(id);
    if (!machine) {
      throw new Error('Machine not found');
    }

    machine.operationalHours = machine.operationalHours + hours;
    return this.machineRepository.save(machine);
  }

  /**
   * Get active machines only
   */
  async findActive(): Promise<Machine[]> {
    return this.machineRepository.find({
      where: { status: MachineStatus.ACTIVE },
      order: { designation: 'ASC' },
    });
  }

  /**
   * Get machines by workshop
   */
  async findByWorkshop(workshop: string): Promise<Machine[]> {
    return this.machineRepository.find({
      where: { workshop },
      order: { designation: 'ASC' },
    });
  }

  /**
   * Add document to machine
   */
  async addDocument(machineId: string, document: Partial<MachineDocument>): Promise<MachineDocument> {
    const machine = await this.findById(machineId);
    if (!machine) {
      throw new Error('Machine not found');
    }

    const newDocument = this.documentRepository.create({
      ...document,
      machineId,
    });

    return this.documentRepository.save(newDocument);
  }

  /**
   * Get machines that require attention in the near term
   * (fallback logic now based on machine status only)
   */
  async findMachinesNeedingMaintenance(_daysAhead: number = 7): Promise<Machine[]> {
    return this.machineRepository.find({
      where: [
        { status: MachineStatus.MAINTENANCE },
        { status: MachineStatus.BROKEN_DOWN },
      ],
      order: { designation: 'ASC' },
    });
  }

  /**
   * Get broken down machines
   */
  async findBrokenDown(): Promise<Machine[]> {
    return this.machineRepository.find({
      where: { status: MachineStatus.BROKEN_DOWN },
      order: { designation: 'ASC' },
    });
  }
}
