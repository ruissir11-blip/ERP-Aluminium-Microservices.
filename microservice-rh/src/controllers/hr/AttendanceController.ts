import { Request, Response, NextFunction } from 'express';
import { Between } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Attendance, AttendanceStatus } from '../../models/hr/Attendance';
import { Employee } from '../../models/hr/Employee';

export class AttendanceController {
  private attendanceRepository = AppDataSource.getRepository(Attendance);
  private employeeRepository = AppDataSource.getRepository(Employee);

  listAttendances = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, status, dateFrom, dateTo, startDate, endDate, page = '1', limit = '50' } = req.query;
      console.log('[AttendanceList] Filters received:', { employeeId, status, startDate, endDate });
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

      const queryBuilder = this.attendanceRepository.createQueryBuilder('attendance')
        .leftJoinAndSelect('attendance.employee', 'employee')
        .orderBy('attendance.attendanceDate', 'DESC')
        .skip(skip)
        .take(parseInt(limit as string));

      if (employeeId) {
        queryBuilder.andWhere('attendance.employeeId = :employeeId', { employeeId });
      }

      if (status) {
        queryBuilder.andWhere('attendance.status = :status', { status });
      }

      const from = dateFrom || startDate;
      const to = dateTo || endDate;
      if (from && to) {
        queryBuilder.andWhere('attendance.attendanceDate BETWEEN :from AND :to', { from, to });
      } else if (from) {
        queryBuilder.andWhere('attendance.attendanceDate >= :from', { from });
      } else if (to) {
        queryBuilder.andWhere('attendance.attendanceDate <= :to', { to });
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

  getTodayAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const attendances = await this.attendanceRepository.find({
        where: { attendanceDate: todayStr as any },
        relations: ['employee'],
      });

      res.status(200).json({
        success: true,
        data: attendances,
      });
    } catch (error) {
      next(error);
    }
  };

  getAttendanceReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId, month, year } = req.query;
      const m = String(month || '01').padStart(2, '0');
      const y = String(year || new Date().getFullYear());
      const startDate = `${y}-${m}-01`;
      const endDate = new Date(Number(y), Number(m), 0).toISOString().split('T')[0];

      const attendances = await this.attendanceRepository.find({
        where: {
          employeeId: employeeId as string,
          attendanceDate: Between(startDate, endDate) as any,
        },
        order: { attendanceDate: 'ASC' },
      });

      const totalWorkHours = attendances.reduce((sum, att) => sum + Number(att.workHours || 0), 0);
      const totalOvertimeHours = attendances.reduce((sum, att) => sum + Number(att.overtimeHours || 0), 0);
      const lateCount = attendances.filter(att => att.status === 'LATE').length;
      const absentCount = attendances.filter(att => att.status === 'ABSENT').length;

      res.status(200).json({
        success: true,
        data: {
          attendances,
          summary: {
            totalWorkHours,
            totalOvertimeHours,
            lateCount,
            absentCount,
            totalDays: attendances.length,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  checkIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.body;
      const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });

      if (!employee) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Employee not found' },
        });
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const existing = await this.attendanceRepository.findOne({
        where: { 
          employeeId: employeeId as string, 
          attendanceDate: todayStr as any // TypeORM date column can take string in some drivers
        },
      });

      if (existing) {
        res.status(400).json({
          success: false,
          error: { code: 'ALREADY_CHECKED_IN', message: 'Already checked in today' },
        });
        return;
      }

      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const attendance = this.attendanceRepository.create({
        employeeId,
        attendanceDate: todayStr as any,
        checkIn: timeString,
        status: AttendanceStatus.PRESENT,
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

  checkOut = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { employeeId } = req.body;
      const todayStr = new Date().toISOString().split('T')[0];
      const attendance = await this.attendanceRepository.findOne({
        where: { 
          employeeId: employeeId as string, 
          attendanceDate: todayStr as any 
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

      const now = new Date();
      const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      attendance.checkOut = timeString;
      
      // Calculate work hours (rough approximation from time strings)
      if (attendance.checkIn) {
        const [inH, inM] = attendance.checkIn.split(':').map(Number);
        const [outH, outM] = timeString.split(':').map(Number);
        const workHours = (outH + outM/60) - (inH + inM/60);
        attendance.workHours = Math.max(0, Math.round(workHours * 100) / 100);
        
        const standardHours = 8;
        if (attendance.workHours > standardHours) {
          attendance.overtimeHours = Math.round((attendance.workHours - standardHours) * 100) / 100;
        }
      }

      await this.attendanceRepository.save(attendance);

      res.status(200).json({
        success: true,
        data: attendance,
      });
    } catch (error) {
      next(error);
    }
  };

  createAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('[Attendance] Creating manual record:', req.body);
      const { employeeId, attendanceDate, checkIn, checkOut, workHours, overtimeHours, status, notes } = req.body;
      const employee = await this.employeeRepository.findOne({ where: { id: employeeId } });
      if (!employee) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Employee not found' },
        });
        return;
      }

      const attendance = this.attendanceRepository.create({
        employeeId,
        attendanceDate: attendanceDate as any,
        checkIn,
        checkOut,
        workHours: workHours ? Number(workHours) : undefined,
        overtimeHours: overtimeHours ? Number(overtimeHours) : undefined,
        status: (status as AttendanceStatus) || AttendanceStatus.PRESENT,
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
}

export const attendanceController = new AttendanceController();
