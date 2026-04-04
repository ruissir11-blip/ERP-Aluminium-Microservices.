import { AppDataSource } from '../../config/database';
import { NonConformity, NCStatus } from '../../models/quality/NonConformity';
import { InspectionRecord, InspectionStatus } from '../../models/quality/InspectionRecord';
import { CorrectiveAction, CorrectiveActionStatus } from '../../models/quality/CorrectiveAction';
import { QualityDecision, DecisionType, DecisionStatus } from '../../models/quality/QualityDecision';
import { Between } from 'typeorm';
import { qualityStatisticsService } from './QualityStatisticsService';

export interface WeeklyReportData {
  weekStart: Date;
  weekEnd: Date;
  generatedAt: Date;
  inspections: {
    total: number;
    completed: number;
    passRate: number;
  };
  nonConformities: {
    total: number;
    opened: number;
    closed: number;
    closureRate: number;
    bySeverity: { critique: number; majeur: number; mineur: number };
  };
  correctiveActions: {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
  };
  qualityDecisions: {
    total: number;
    approved: number;
    rejected: number;
    approvalRate: number;
  };
  kpis: {
    ncRate: number;
    closureRate: number;
    averageClosureTime: number;
  };
}

export interface MonthlyReportData {
  month: number;
  year: number;
  generatedAt: Date;
  inspections: {
    total: number;
    completed: number;
    passRate: number;
    byStage: Record<string, number>;
  };
  nonConformities: {
    total: number;
    opened: number;
    closed: number;
    closureRate: number;
    bySeverity: { critique: number; majeur: number; mineur: number };
    topDefectTypes: { type: string; count: number }[];
  };
  correctiveActions: {
    total: number;
    completed: number;
    pending: number;
    completionRate: number;
    averageCompletionTime: number;
  };
  qualityDecisions: {
    total: number;
    approved: number;
    rejected: number;
    approvalRate: number;
    byType: Record<string, number>;
  };
  kpis: {
    ncRate: number;
    closureRate: number;
    averageClosureTime: number;
    inspectionCompletionRate: number;
    correctiveActionCompletionRate: number;
    decisionApprovalRate: number;
  };
}

export interface CertificateOfConformity {
  id: string;
  certificateNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  productDescription: string;
  quantity: number;
  inspectionDate: Date;
  inspectorName: string;
  results: {
    allConforms: boolean;
    ncNumber?: string;
    notes?: string;
  };
  issuedAt: Date;
  validUntil: Date;
}

export class QualityReportService {
  private ncRepository = AppDataSource.getRepository(NonConformity);
  private inspectionRepository = AppDataSource.getRepository(InspectionRecord);
  private correctiveActionRepository = AppDataSource.getRepository(CorrectiveAction);
  private qualityDecisionRepository = AppDataSource.getRepository(QualityDecision);

  /**
   * Generate weekly quality report
   */
  async generateWeeklyReport(weekStart: Date): Promise<WeeklyReportData> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const [
      inspections,
      ncRecords,
      correctiveActions,
      decisions,
      kpis,
    ] = await Promise.all([
      this.inspectionRepository.find({
        where: { created_at: Between(weekStart, weekEnd) },
      }),
      this.ncRepository.find({
        where: { detected_at: Between(weekStart, weekEnd) },
      }),
      this.correctiveActionRepository.find({
        where: { created_at: Between(weekStart, weekEnd) },
      }),
      this.qualityDecisionRepository.find({
        where: { created_at: Between(weekStart, weekEnd) },
      }),
      qualityStatisticsService.getQualityKPIs(weekStart, weekEnd),
    ]);

    const completedInspections = inspections.filter(i => i.status === InspectionStatus.COMPLETED);
    const passCount = completedInspections.filter(i => i.result === 'conforme').length;
    const passRate = completedInspections.length > 0 
      ? (passCount / completedInspections.length) * 100 
      : 0;

    const openedNCs = ncRecords.filter(nc => nc.status !== NCStatus.CLOTUREE);
    const closedNCs = ncRecords.filter(nc => nc.status === NCStatus.CLOTUREE);
    const closureRate = ncRecords.length > 0 
      ? (closedNCs.length / ncRecords.length) * 100 
      : 0;

    const completedActions = correctiveActions.filter(a => 
      a.status === CorrectiveActionStatus.TERMINE || a.status === CorrectiveActionStatus.VERIFIE
    );
    const actionCompletionRate = correctiveActions.length > 0
      ? (completedActions.length / correctiveActions.length) * 100
      : 0;

    const approvedDecisions = decisions.filter(d => d.status === DecisionStatus.APPROUVE);
    const decisionApprovalRate = decisions.length > 0
      ? (approvedDecisions.length / decisions.length) * 100
      : 0;

    return {
      weekStart,
      weekEnd,
      generatedAt: new Date(),
      inspections: {
        total: inspections.length,
        completed: completedInspections.length,
        passRate,
      },
      nonConformities: {
        total: ncRecords.length,
        opened: openedNCs.length,
        closed: closedNCs.length,
        closureRate,
        bySeverity: {
          critique: ncRecords.filter(nc => nc.severity === 'critique').length,
          majeur: ncRecords.filter(nc => nc.severity === 'majeur').length,
          mineur: ncRecords.filter(nc => nc.severity === 'mineur').length,
        },
      },
      correctiveActions: {
        total: correctiveActions.length,
        completed: completedActions.length,
        pending: correctiveActions.filter(a => a.status === CorrectiveActionStatus.A_FAIRE).length,
        completionRate: actionCompletionRate,
      },
      qualityDecisions: {
        total: decisions.length,
        approved: approvedDecisions.length,
        rejected: decisions.filter(d => d.status === DecisionStatus.REJETE).length,
        approvalRate: decisionApprovalRate,
      },
      kpis: {
        ncRate: kpis.ncRate,
        closureRate: kpis.closureRate,
        averageClosureTime: kpis.averageClosureTime,
      },
    };
  }

  /**
   * Generate monthly quality report
   */
  async generateMonthlyReport(month: number, year: number): Promise<MonthlyReportData> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    const [
      inspections,
      ncRecords,
      correctiveActions,
      decisions,
      kpis,
    ] = await Promise.all([
      this.inspectionRepository.find({
        where: { created_at: Between(monthStart, monthEnd) },
      }),
      this.ncRepository.find({
        where: { detected_at: Between(monthStart, monthEnd) },
      }),
      this.correctiveActionRepository.find({
        where: { created_at: Between(monthStart, monthEnd) },
      }),
      this.qualityDecisionRepository.find({
        where: { created_at: Between(monthStart, monthEnd) },
      }),
      qualityStatisticsService.getQualityKPIs(monthStart, monthEnd),
    ]);

    const completedInspections = inspections.filter(i => i.status === InspectionStatus.COMPLETED);
    const passCount = completedInspections.filter(i => i.result === 'conforme').length;
    const passRate = completedInspections.length > 0 
      ? (passCount / completedInspections.length) * 100 
      : 0;

    const openedNCs = ncRecords.filter(nc => nc.status !== NCStatus.CLOTUREE);
    const closedNCs = ncRecords.filter(nc => nc.status === NCStatus.CLOTUREE);
    const closureRate = ncRecords.length > 0 
      ? (closedNCs.length / ncRecords.length) * 100 
      : 0;

    const completedActions = correctiveActions.filter(a => 
      a.status === CorrectiveActionStatus.TERMINE || a.status === CorrectiveActionStatus.VERIFIE
    );
    const actionCompletionRate = correctiveActions.length > 0
      ? (completedActions.length / correctiveActions.length) * 100
      : 0;

    // Calculate average completion time for corrective actions
    const completedWithTime = correctiveActions.filter(a => a.completed_at);
    const avgCompletionTime = completedWithTime.length > 0
      ? completedWithTime.reduce((acc, a) => {
          const diff = new Date(a.completed_at).getTime() - new Date(a.created_at).getTime();
          return acc + diff;
        }, 0) / completedWithTime.length / (1000 * 60 * 60 * 24)
      : 0;

    const approvedDecisions = decisions.filter(d => d.status === DecisionStatus.APPROUVE);
    const decisionApprovalRate = decisions.length > 0
      ? (approvedDecisions.length / decisions.length) * 100
      : 0;

    return {
      month,
      year,
      generatedAt: new Date(),
      inspections: {
        total: inspections.length,
        completed: completedInspections.length,
        passRate,
        byStage: {}, // Would need to join with inspection_points to get this
      },
      nonConformities: {
        total: ncRecords.length,
        opened: openedNCs.length,
        closed: closedNCs.length,
        closureRate,
        bySeverity: {
          critique: ncRecords.filter(nc => nc.severity === 'critique').length,
          majeur: ncRecords.filter(nc => nc.severity === 'majeur').length,
          mineur: ncRecords.filter(nc => nc.severity === 'mineur').length,
        },
        topDefectTypes: [], // Would need proper categorization
      },
      correctiveActions: {
        total: correctiveActions.length,
        completed: completedActions.length,
        pending: correctiveActions.filter(a => a.status === CorrectiveActionStatus.A_FAIRE).length,
        completionRate: actionCompletionRate,
        averageCompletionTime: avgCompletionTime,
      },
      qualityDecisions: {
        total: decisions.length,
        approved: approvedDecisions.length,
        rejected: decisions.filter(d => d.status === DecisionStatus.REJETE).length,
        approvalRate: decisionApprovalRate,
        byType: {
          conforme: decisions.filter(d => d.decision_type === DecisionType.CONFORME).length,
          non_conforme: decisions.filter(d => d.decision_type === DecisionType.NON_CONFORME).length,
          a_retravailler: decisions.filter(d => d.decision_type === DecisionType.A_RETRAVAILLER).length,
          rebut: decisions.filter(d => d.decision_type === DecisionType.REBUT).length,
          derogation: decisions.filter(d => d.decision_type === DecisionType.DEROGATION).length,
        },
      },
      kpis: {
        ncRate: kpis.ncRate,
        closureRate: kpis.closureRate,
        averageClosureTime: kpis.averageClosureTime,
        inspectionCompletionRate: kpis.inspectionCompletionRate,
        correctiveActionCompletionRate: kpis.correctiveActionCompletionRate,
        decisionApprovalRate: kpis.decisionApprovalRate,
      },
    };
  }

  /**
   * Generate certificate of conformity for an order
   */
  async generateCertificate(orderId: string): Promise<CertificateOfConformity | null> {
    // Get all inspection records for the order
    const inspections = await this.inspectionRepository.find({
      where: { production_order_id: orderId },
      relations: ['inspectionPoint', 'inspector'],
    });

    if (inspections.length === 0) {
      return null;
    }

    // Check if all inspections are completed and conform
    const allCompleted = inspections.every(i => i.status === InspectionStatus.COMPLETED);
    const allConforms = inspections.every(i => i.result === 'conforme');

    // Get any NCs associated with this order
    const ncs = await this.ncRepository.find({
      where: { production_order_id: orderId },
    });
    const openNC = ncs.find(nc => nc.status !== NCStatus.CLOTUREE);

    // Generate certificate number
    const year = new Date().getFullYear();
    const certCount = await this.ncRepository.count() + 1;
    const certificateNumber = `COC-${year}-${String(certCount).padStart(6, '0')}`;

    const lastInspection = inspections.reduce((latest, insp) => {
      const inspDate = new Date(insp.created_at);
      return inspDate > latest ? inspDate : latest;
    }, new Date(0));

    return {
      id: crypto.randomUUID(),
      certificateNumber,
      orderId,
      orderNumber: '', // Would need to join with orders table
      customerName: '', // Would need to join with orders table
      productDescription: '', // Would need to join with orders table
      quantity: 0, // Would need to join with orders table
      inspectionDate: lastInspection,
      inspectorName: inspections[0]?.inspector?.firstName 
        ? `${inspections[0].inspector.firstName} ${inspections[0].inspector.lastName}`
        : 'N/A',
      results: {
        allConforms: allConforms && !openNC,
        ncNumber: openNC?.nc_number,
        notes: !allConforms ? 'Some inspections showed non-conformities' : undefined,
      },
      issuedAt: new Date(),
      validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    };
  }

  /**
   * Get scheduled report recipients
   */
  async getScheduledRecipients(reportType: 'weekly' | 'monthly'): Promise<string[]> {
    // In a real implementation, this would fetch from a configuration table
    // For now, return empty array
    return [];
  }

  /**
   * Send scheduled report via email
   */
  async sendScheduledReport(
    reportType: 'weekly' | 'monthly',
    reportData: WeeklyReportData | MonthlyReportData,
    recipients: string[]
  ): Promise<boolean> {
    // In a real implementation, this would use nodemailer to send emails
    console.log(`Sending ${reportType} report to:`, recipients);
    console.log('Report data:', JSON.stringify(reportData, null, 2));
    return true;
  }
}

export const qualityReportService = new QualityReportService();
