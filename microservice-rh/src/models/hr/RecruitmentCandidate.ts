import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RecruitmentJob } from './RecruitmentJob';

export enum CandidateStatus {
  APPLIED = 'APPLIED',
  SCREENING = 'SCREENING',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
}

@Entity('recruitment_candidates')
@Index(['jobId'])
@Index(['status'])
@Index(['applicationDate'])
export class RecruitmentCandidate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'job_id' })
  jobId: string;

  @ManyToOne(() => RecruitmentJob, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: RecruitmentJob;

  @Column({ type: 'varchar', length: 100, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 100, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'resume_url' })
  resumeUrl: string | null;

  @Column({ type: 'text', nullable: true, name: 'cover_letter' })
  coverLetter: string | null;

  @Column({
    type: 'enum',
    enum: CandidateStatus,
    default: CandidateStatus.APPLIED,
    name: 'status',
  })
  status: CandidateStatus;

  @Column({ type: 'date', name: 'application_date' })
  applicationDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
