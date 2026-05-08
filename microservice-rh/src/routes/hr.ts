import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'RH Microservice API',
    version: '1.0.0',
    endpoints: {
      employees: '/employees',
      departments: '/departments',
      postes: '/postes',
      contracts: '/contracts',
      leaveRequests: '/leave-requests',
      attendances: '/attendances',
      payslips: '/payslips',
      training: '/training',
      performance: '/performance',
      recruitment: '/recruitment',
    },
  });
});

router.get('/employees', async (req, res) => {
  try {
    const { dataSource } = await import('./config/database');
    const { Employee } = await import('./models/hr/Employee');
    const employees = await dataSource.getRepository(Employee).find({
      relations: ['department', 'poste'],
    });
    res.json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees', message: String(error) });
  }
});

router.get('/departments', async (req, res) => {
  try {
    const { dataSource } = await import('./config/database');
    const { Department } = await import('./models/hr/Department');
    const departments = await dataSource.getRepository(Department).find();
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments', message: String(error) });
  }
});

router.get('/postes', async (req, res) => {
  try {
    const { dataSource } = await import('./config/database');
    const { Poste } = await import('./models/hr/Poste');
    const postes = await dataSource.getRepository(Poste).find({ relations: ['department'] });
    res.json({ success: true, data: postes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch postes', message: String(error) });
  }
});

router.get('/contracts', async (req, res) => {
  try {
    const { dataSource } = await import('./config/database');
    const { EmployeeContract } = await import('./models/hr/EmployeeContract');
    const contracts = await dataSource.getRepository(EmployeeContract).find({
      relations: ['employee'],
    });
    res.json({ success: true, data: contracts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contracts', message: String(error) });
  }
});

router.get('/leave-requests', async (req, res) => {
  try {
    const { dataSource } = await import('./config/database');
    const { LeaveRequest } = await import('./models/hr/LeaveRequest');
    const requests = await dataSource.getRepository(LeaveRequest).find({
      relations: ['employee'],
    });
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leave requests', message: String(error) });
  }
});

router.get('/attendances', async (req, res) => {
  try {
    const { dataSource } = await import('./config/database');
    const { Attendance } = await import('./models/hr/Attendance');
    const attendances = await dataSource.getRepository(Attendance).find({
      relations: ['employee'],
    });
    res.json({ success: true, data: attendances });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendances', message: String(error) });
  }
});

router.get('/payslips', async (req, res) => {
  try {
    const { dataSource } = await import('./config/database');
    const { Payslip } = await import('./models/hr/Payslip');
    const payslips = await dataSource.getRepository(Payslip).find({
      relations: ['employee'],
    });
    res.json({ success: true, data: payslips });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payslips', message: String(error) });
  }
});

export default router;