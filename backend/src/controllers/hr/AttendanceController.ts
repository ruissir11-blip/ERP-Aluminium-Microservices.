import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../../config/database';
import { Attendance, AttendanceStatus } from '../../models/hr/Attendance';
import { Employee } from '../../models/hr/Employee';

export class AttendanceController {
  private attendanceRepository = AppDataSource.getRepository(Attendance);
  private employeeRepository = AppDataSource.getRepository(Employee);

  /**
   * List attendances with filters
   */
  listAttendances = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { 
        page = '1', 
        limit = '20', 
        status,
        employeeId,
        startDate,
        endDate,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const queryBuilder = this.attendanceRepository.createQueryBuilder('attendance')
        .leftJoinAndSelect('attendance.employee', 'employee')
        .orderBy('attendance.attendanceDate', 'DESC')
        .skip(skip)
        .take(parseInt(limit as string));

      if (status) {
        queryBuilder.andWhere('attendance.status = :status', { status });
      }

      if (employeeId) {
        queryBuilder.andWhere('attendance.employeeId = :employeeId', { employeeId });
      }

      if (startDate) {
        queryBuilder.andWhere('attendance.attendanceDate >= :startDate', { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere('attendance.attendanceDate <= :endDate', { endDate });
      }

      const [attendances, total] = await queryBuilder.getManyAndCount();

      res.status(200).json({
        success: true,
        data: {
          attendances,
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
   * Get attendance by ID
   */
  getAttendanceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const attendance = await this.attendanceRepository.findOne({
        where: { id },
        relations: ['employee'],
      });

      if (!attendance) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Attendance record not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check in (record arrival)
   */
  checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = (req as any).user?.id || req.body.employeeId;
      const { notes } = req.body;

      // Check if already checked in today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingToday = await this.attendanceRepository.findOne({
        where: { 
          employeeId,
          attendanceDate: today,
        },
      });

      if (existingToday) {
        res.status(400).json({
          success: false,
          error: { code: 'ALREADY_CHECKED_IN', message: 'Already checked in today' },
        });
        return;
      }

      const checkInTime = new Date().toTimeString().slice(0, 8); // HH:MM:SS

      const attendance = this.attendanceRepository.create({
        employeeId,
        attendanceDate: today,
        checkIn: checkInTime,
        status: AttendanceStatus.PRESENT,
        notes,
      });

      await this.attendanceRepository.save(attendance);

      res.status(201).json({
        success: true,
        data: attendance,
        message: 'Check-in recorded successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check out (record departure)
   */
  checkOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = (req as any).user?.id || req.body.employeeId;
      const { notes } = req.body;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendance = await this.attendanceRepository.findOne({
        where: { 
          employeeId,
          attendanceDate: today,
        },
      });

      if (!attendance) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'No check-in found for today' },
        });
        return;
      }

      if (attendance.checkOut) {
        res.status(400).json({
          success: false,
          error: { code: 'ALREADY_CHECKED_OUT', message: 'Already checked out today' },
        });
        return;
      }

      const checkOutTime = new Date().toTimeString().slice(0, 8);
      
      // Calculate work hours
      const checkIn = attendance.checkIn ? attendance.checkIn.split(':') : ['0', '0', '0'];
      const checkOutArr = checkOutTime.split(':');
      
      const inSeconds = parseInt(checkIn[0]) * 3600 + parseInt(checkIn[1]) * 60 + parseInt(checkIn[2]);
      const outSeconds = parseInt(checkOutArr[0]) * 3600 + parseInt(checkOutArr[1]) * 60 + parseInt(checkOutArr[2]);
      
      let workHours = (outSeconds - inSeconds) / 3600;
      if (workHours < 0) workHours += 24; // Handle midnight crossing

      // Standard work day is 8 hours
      const standardHours = 8;
      const overtime = Math.max(0, workHours - standardHours);

      attendance.checkOut = checkOutTime;
      attendance.workHours = parseFloat(workHours.toFixed(2));
      attendance.overtimeHours = parseFloat(overtime.toFixed(2));
      if (notes) attendance.notes = notes;

      await this.attendanceRepository.save(attendance);

      res.status(200).json({
        success: true,
        data: attendance,
        message: 'Check-out recorded successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get today's attendance status for employee
   */
  getTodayAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const employeeId = (req as any).user?.id || req.params.employeeId;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendance = await this.attendanceRepository.findOne({
        where: { 
          employeeId,
          attendanceDate: today,
        },
      });

      res.status(200).json({
        success: true,
        data: attendance || null,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create/update attendance record manually
   */
  createAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, attendanceDate, checkIn, checkOut, status, notes } = req.body;

      // Validate employee exists
      const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
      if (!employee) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_EMPLOYEE', message: 'Employee not found' },
        });
        return;
      }

      // Check if record exists for date
      const existing = await this.attendanceRepository.findOne({
        where: { employeeId, attendanceDate },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE', message: 'Attendance record already exists for this date' },
        });
        return;
      }

      const attendance = this.attendanceRepository.create({
        employeeId,
        attendanceDate,
        checkIn,
        checkOut,
        status,
        notes,
      });

      await this.attendanceRepository.save(attendance);

      res.status(201).json({
        success: true,
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get attendance report
   */
  getAttendanceReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startDate, endDate, departmentId } = req.query;

      const queryBuilder = this.attendanceRepository.createQueryBuilder('attendance')
        .leftJoinAndSelect('attendance.employee', 'employee')
        .where('attendance.attendanceDate >= :startDate', { startDate })
        .andWhere('attendance.attendanceDate <= :endDate', { endDate });

      if (departmentId) {
        queryBuilder.andWhere('employee.departmentId = :departmentId', { departmentId });
      }

      const attendances = await queryBuilder
        .orderBy('attendance.attendanceDate', 'ASC')
        .orderBy('employee.lastName', 'ASC')
        .getMany();

      // Calculate summary statistics
      const summary = {
        totalRecords: attendances.length,
        present: attendances.filter(a => a.status === AttendanceStatus.PRESENT).length,
        absent: attendances.filter(a => a.status === AttendanceStatus.ABSENT).length,
        late: attendances.filter(a => a.status === AttendanceStatus.LATE).length,
        onLeave: attendances.filter(a => a.status === AttendanceStatus.ON_LEAVE).length,
        totalWorkHours: attendances.reduce((sum, a) => sum + (a.workHours || 0), 0),
        totalOvertimeHours: attendances.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
      };

      res.status(200).json({
        success: true,
        data: {
          records: attendances,
          summary,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const attendanceController = new AttendanceController();
