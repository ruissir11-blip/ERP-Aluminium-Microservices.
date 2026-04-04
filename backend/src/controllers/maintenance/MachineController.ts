import { Request, Response } from 'express';
import { MachineService } from '../../services/maintenance/MachineService';
import { MachineStatus } from '../../models/maintenance/Machine';
import { isValidUUID } from '../../utils/validators';

export class MachineController {
  private machineService: MachineService;

  constructor() {
    this.machineService = new MachineService();
  }

  /**
   * GET /api/v1/maintenance/machines
   * List all machines with optional filtering
   */
  async listMachines(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as MachineStatus,
        workshop: req.query.workshop as string,
        search: req.query.search as string,
      };

      const machines = await this.machineService.findAll(filters);
      res.json({ data: machines });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch machines', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/maintenance/machines/active
   * Get active machines only
   */
  async listActiveMachines(req: Request, res: Response): Promise<void> {
    try {
      const machines = await this.machineService.findActive();
      res.json({ data: machines });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch active machines', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/maintenance/machines/broken-down
   * Get broken down machines
   */
  async listBrokenDownMachines(req: Request, res: Response): Promise<void> {
    try {
      const machines = await this.machineService.findBrokenDown();
      res.json({ data: machines });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch broken down machines', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/maintenance/machines/needing-maintenance
   * Get machines needing maintenance soon
   */
  async listNeedingMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const daysAhead = req.query.days ? parseInt(req.query.days as string, 10) : 7;
      const machines = await this.machineService.findMachinesNeedingMaintenance(daysAhead);
      res.json({ data: machines });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch machines needing maintenance', details: (error as Error).message });
    }
  }

  /**
   * GET /api/v1/maintenance/machines/:id
   * Get machine by ID
   */
  async getMachine(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid machine ID format' });
        return;
      }

      const machine = await this.machineService.findById(id);

      if (!machine) {
        res.status(404).json({ error: 'Machine not found' });
        return;
      }

      res.json({ data: machine });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch machine', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/machines
   * Create new machine
   */
  async createMachine(req: Request, res: Response): Promise<void> {
    try {
      const { designation, brand, model, serialNumber, purchaseDate, acquisitionValue, residualValue, workshop, locationDetails, installationDate, notes } = req.body;

      // Basic validation
      if (!designation || typeof designation !== 'string' || designation.trim().length === 0) {
        res.status(400).json({ error: 'Designation is required and must be a non-empty string' });
        return;
      }

      const machine = await this.machineService.create({
        designation,
        brand,
        model,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        acquisitionValue,
        residualValue,
        workshop,
        locationDetails,
        installationDate: installationDate ? new Date(installationDate) : undefined,
        notes,
      });

      res.status(201).json({ data: machine });
    } catch (error) {
      if ((error as Error).message.includes('already exists')) {
        res.status(409).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to create machine', details: (error as Error).message });
    }
  }

  /**
   * PUT /api/v1/maintenance/machines/:id
   * Update machine
   */
  async updateMachine(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid machine ID format' });
        return;
      }

      const machine = await this.machineService.update(id, req.body);
      res.json({ data: machine });
    } catch (error) {
      if ((error as Error).message === 'Machine not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      if ((error as Error).message.includes('already exists')) {
        res.status(409).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to update machine', details: (error as Error).message });
    }
  }

  /**
   * PATCH /api/v1/maintenance/machines/:id/status
   * Update machine status
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid machine ID format' });
        return;
      }

      if (!status || !Object.values(MachineStatus).includes(status)) {
        res.status(400).json({ error: `Status must be one of: ${Object.values(MachineStatus).join(', ')}` });
        return;
      }

      const machine = await this.machineService.updateStatus(id, status);
      res.json({ data: machine });
    } catch (error) {
      if ((error as Error).message === 'Machine not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to update machine status', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/machines/:id/archive
   * Archive machine
   */
  async archiveMachine(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid machine ID format' });
        return;
      }

      const machine = await this.machineService.archive(id);
      res.json({ data: machine });
    } catch (error) {
      if ((error as Error).message === 'Machine not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to archive machine', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/machines/:id/reactivate
   * Reactivate machine
   */
  async reactivateMachine(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid machine ID format' });
        return;
      }

      const machine = await this.machineService.reactivate(id);
      res.json({ data: machine });
    } catch (error) {
      if ((error as Error).message === 'Machine not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to reactivate machine', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/machines/:id/hours
   * Update operational hours
   */
  async updateOperationalHours(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { hours } = req.body;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid machine ID format' });
        return;
      }

      if (typeof hours !== 'number' || hours < 0) {
        res.status(400).json({ error: 'Hours must be a non-negative number' });
        return;
      }

      const machine = await this.machineService.updateOperationalHours(id, hours);
      res.json({ data: machine });
    } catch (error) {
      if ((error as Error).message === 'Machine not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to update operational hours', details: (error as Error).message });
    }
  }

  /**
   * POST /api/v1/maintenance/machines/:id/documents
   * Add document to machine
   */
  async addDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { documentType, documentName, filePath, fileSize, mimeType, uploadedBy } = req.body;

      if (!isValidUUID(id)) {
        res.status(400).json({ error: 'Invalid machine ID format' });
        return;
      }

      if (!documentType || !documentName || !filePath) {
        res.status(400).json({ error: 'documentType, documentName, and filePath are required' });
        return;
      }

      const document = await this.machineService.addDocument(id, {
        documentType,
        documentName,
        filePath,
        fileSize,
        mimeType,
        uploadedBy,
      });

      res.status(201).json({ data: document });
    } catch (error) {
      if ((error as Error).message === 'Machine not found') {
        res.status(404).json({ error: (error as Error).message });
        return;
      }
      res.status(400).json({ error: 'Failed to add document', details: (error as Error).message });
    }
  }
}
