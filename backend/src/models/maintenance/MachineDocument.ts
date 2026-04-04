import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Machine } from './Machine';

@Entity('machine_documents')
@Index(['machineId'])
export class MachineDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'machine_id' })
  machineId!: string;

  @ManyToOne(() => Machine, (machine) => machine.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'machine_id' })
  machine!: Machine;

  @Column({ type: 'varchar', length: 100, name: 'document_type' })
  documentType!: string;

  @Column({ type: 'varchar', length: 255, name: 'document_name' })
  documentName!: string;

  @Column({ type: 'varchar', length: 500, name: 'file_path' })
  filePath!: string;

  @Column({ type: 'integer', nullable: true, name: 'file_size' })
  fileSize?: number;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'mime_type' })
  mimeType?: string;

  @Column({ type: 'uuid', nullable: true, name: 'uploaded_by' })
  uploadedBy?: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt!: Date;
}
