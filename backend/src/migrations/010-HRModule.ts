import { MigrationInterface, QueryRunner } from 'typeorm';

export class HRModule1705000000000 implements MigrationInterface {
  name = 'HRModule1705000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE employee_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED', 'ON_LEAVE');
    `);
    await queryRunner.query(`
      CREATE TYPE contract_type_enum AS ENUM ('CDI', 'CDD', 'STAGE', 'APPRENTICE', 'INTERIM');
    `);
    await queryRunner.query(`
      CREATE TYPE contract_status_enum AS ENUM ('ACTIVE', 'EXPIRED', 'TERMINATED');
    `);
    await queryRunner.query(`
      CREATE TYPE leave_type_enum AS ENUM ('ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER');
    `);
    await queryRunner.query(`
      CREATE TYPE leave_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
    `);
    await queryRunner.query(`
      CREATE TYPE attendance_status_enum AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE');
    `);
    await queryRunner.query(`
      CREATE TYPE payslip_status_enum AS ENUM ('DRAFT', 'VALIDATED', 'PAID');
    `);
    await queryRunner.query(`
      CREATE TYPE training_session_status_enum AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
    `);
    await queryRunner.query(`
      CREATE TYPE enrollment_status_enum AS ENUM ('ENROLLED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
    `);
    await queryRunner.query(`
      CREATE TYPE review_status_enum AS ENUM ('DRAFT', 'SUBMITTED', 'COMPLETED');
    `);
    await queryRunner.query(`
      CREATE TYPE recruitment_job_status_enum AS ENUM ('DRAFT', 'OPEN', 'CLOSED', 'CANCELLED');
    `);
    await queryRunner.query(`
      CREATE TYPE candidate_status_enum AS ENUM ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED');
    `);

    // Create departments table
    await queryRunner.query(`
      CREATE TABLE departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        manager_id UUID,
        parent_department_id UUID,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Create postes table
    await queryRunner.query(`
      CREATE TABLE postes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(20) UNIQUE NOT NULL,
        title VARCHAR(100) NOT NULL,
        description TEXT,
        department_id UUID,
        job_level VARCHAR(50),
        min_salary DECIMAL(12,2),
        max_salary DECIMAL(12,2),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Create employees table
    await queryRunner.query(`
      CREATE TABLE employees (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_number VARCHAR(20) UNIQUE NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        birth_date DATE,
        address VARCHAR(255),
        city VARCHAR(100),
        postal_code VARCHAR(20),
        country VARCHAR(100) DEFAULT 'Tunisie',
        emergency_contact VARCHAR(200),
        emergency_phone VARCHAR(20),
        national_id VARCHAR(50),
        bank_account VARCHAR(255),
        social_security_number VARCHAR(50),
        user_id UUID,
        department_id UUID,
        hire_date DATE,
        termination_date DATE,
        status employee_status_enum DEFAULT 'ACTIVE',
        photo_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Create employee_postes table
    await queryRunner.query(`
      CREATE TABLE employee_postes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL,
        poste_id UUID NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        is_primary BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now()
      )
    `);

    // Create employee_contracts table
    await queryRunner.query(`
      CREATE TABLE employee_contracts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL,
        contract_type contract_type_enum NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        base_salary DECIMAL(12,2) NOT NULL,
        work_schedule VARCHAR(50),
        weekly_hours INTEGER NOT NULL,
        renewal_date DATE,
        status contract_status_enum DEFAULT 'ACTIVE',
        terms TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Create leave_requests table
    await queryRunner.query(`
      CREATE TABLE leave_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL,
        leave_type leave_type_enum NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_days DECIMAL(3,1) NOT NULL,
        reason TEXT,
        status leave_status_enum DEFAULT 'PENDING',
        approver_id UUID,
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Create attendances table
    await queryRunner.query(`
      CREATE TABLE attendances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL,
        attendance_date DATE NOT NULL,
        check_in TIME,
        check_out TIME,
        work_hours DECIMAL(5,2),
        overtime_hours DECIMAL(5,2),
        status attendance_status_enum DEFAULT 'PRESENT',
        notes TEXT,
        created_at TIMESTAMP DEFAULT now()
      )
    `);

    // Create payslips table
    await queryRunner.query(`
      CREATE TABLE payslips (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL,
        period_month INTEGER NOT NULL,
        period_year INTEGER NOT NULL,
        base_salary DECIMAL(12,2) NOT NULL,
        overtime_pay DECIMAL(12,2) DEFAULT 0,
        bonuses DECIMAL(12,2) DEFAULT 0,
        deductions DECIMAL(12,2) DEFAULT 0,
        net_salary DECIMAL(12,2) NOT NULL,
        status payslip_status_enum DEFAULT 'DRAFT',
        created_at TIMESTAMP DEFAULT now()
      )
    `);

    // Create trainings table
    await queryRunner.query(`
      CREATE TABLE trainings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        description TEXT,
        provider VARCHAR(200),
        duration_hours INTEGER,
        certification_type VARCHAR(100),
        is_mandatory BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Create training_sessions table
    await queryRunner.query(`
      CREATE TABLE training_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        training_id UUID NOT NULL,
        scheduled_date DATE NOT NULL,
        end_date DATE,
        location VARCHAR(200),
        max_participants INTEGER,
        status training_session_status_enum DEFAULT 'SCHEDULED',
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Create training_enrollments table
    await queryRunner.query(`
      CREATE TABLE training_enrollments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL,
        session_id UUID NOT NULL,
        status enrollment_status_enum DEFAULT 'ENROLLED',
        enrolled_at TIMESTAMP,
        completed_at TIMESTAMP,
        certificate_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT now()
      )
    `);

    // Create performance_reviews table
    await queryRunner.query(`
      CREATE TABLE performance_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID NOT NULL,
        reviewer_id UUID,
        review_date DATE NOT NULL,
        review_period VARCHAR(50),
        rating_overall INTEGER,
        strengths TEXT,
        areas_for_improvement TEXT,
        goals TEXT,
        status review_status_enum DEFAULT 'DRAFT',
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Create recruitment_jobs table
    await queryRunner.query(`
      CREATE TABLE recruitment_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        department_id UUID,
        job_type VARCHAR(50),
        location VARCHAR(100),
        salary_range_min DECIMAL(12,2),
        salary_range_max DECIMAL(12,2),
        publish_date DATE,
        close_date DATE,
        status recruitment_job_status_enum DEFAULT 'DRAFT',
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Create recruitment_candidates table
    await queryRunner.query(`
      CREATE TABLE recruitment_candidates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        resume_url VARCHAR(500),
        cover_letter TEXT,
        status candidate_status_enum DEFAULT 'APPLIED',
        application_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `);

    // Create indexes for performance
    await queryRunner.query(`CREATE INDEX idx_employees_status ON employees(status)`);
    await queryRunner.query(`CREATE INDEX idx_employees_department ON employees(department_id)`);
    await queryRunner.query(`CREATE INDEX idx_employees_hire_date ON employees(hire_date)`);
    await queryRunner.query(`CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id)`);
    await queryRunner.query(`CREATE INDEX idx_leave_requests_status ON leave_requests(status)`);
    await queryRunner.query(`CREATE INDEX idx_attendances_employee_date ON attendances(employee_id, attendance_date)`);
    await queryRunner.query(`CREATE INDEX idx_payslips_employee_period ON payslips(employee_id, period_year, period_month)`);
    await queryRunner.query(`CREATE INDEX idx_performance_reviews_employee ON performance_reviews(employee_id)`);
    await queryRunner.query(`CREATE INDEX idx_recruitment_candidates_job ON recruitment_candidates(job_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_recruitment_candidates_job`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_performance_reviews_employee`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_payslips_employee_period`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_attendances_employee_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_leave_requests_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_leave_requests_employee`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_employees_hire_date`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_employees_department`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_employees_status`);

    await queryRunner.query(`DROP TABLE IF EXISTS recruitment_candidates`);
    await queryRunner.query(`DROP TABLE IF EXISTS recruitment_jobs`);
    await queryRunner.query(`DROP TABLE IF EXISTS performance_reviews`);
    await queryRunner.query(`DROP TABLE IF EXISTS training_enrollments`);
    await queryRunner.query(`DROP TABLE IF EXISTS training_sessions`);
    await queryRunner.query(`DROP TABLE IF EXISTS trainings`);
    await queryRunner.query(`DROP TABLE IF EXISTS payslips`);
    await queryRunner.query(`DROP TABLE IF EXISTS attendances`);
    await queryRunner.query(`DROP TABLE IF EXISTS leave_requests`);
    await queryRunner.query(`DROP TABLE IF EXISTS employee_contracts`);
    await queryRunner.query(`DROP TABLE IF EXISTS employee_postes`);
    await queryRunner.query(`DROP TABLE IF EXISTS employees`);
    await queryRunner.query(`DROP TABLE IF EXISTS postes`);
    await queryRunner.query(`DROP TABLE IF EXISTS departments`);

    await queryRunner.query(`DROP TYPE IF EXISTS candidate_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS recruitment_job_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS review_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS enrollment_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS training_session_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS payslip_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS attendance_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS leave_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS leave_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS contract_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS contract_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS employee_status_enum`);
  }
}
