CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  county VARCHAR(100),
  website VARCHAR(255),
  logo_url TEXT,
  status VARCHAR(20) DEFAULT 'active',
  subscription_status VARCHAR(20) DEFAULT 'trial',
  subscription_expires_at TIMESTAMP,
  setup_fee_paid BOOLEAN DEFAULT FALSE,
  annual_fee_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  gender VARCHAR(10),
  date_of_birth DATE,
  profile_photo TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50),
  head_id UUID REFERENCES users(id),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  level VARCHAR(100),
  duration_months INTEGER,
  description TEXT,
  requirements TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  credit_hours INTEGER DEFAULT 3,
  semester INTEGER DEFAULT 1,
  year_of_study INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id),
  name VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  capacity INTEGER,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  student_number VARCHAR(50) UNIQUE NOT NULL,
  program_id UUID REFERENCES programs(id),
  intake_id UUID REFERENCES intakes(id),
  year_of_study INTEGER DEFAULT 1,
  semester INTEGER DEFAULT 1,
  guardian_name VARCHAR(255),
  guardian_phone VARCHAR(20),
  guardian_email VARCHAR(255),
  guardian_relationship VARCHAR(100),
  national_id VARCHAR(50),
  admission_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  staff_number VARCHAR(50),
  department_id UUID REFERENCES departments(id),
  designation VARCHAR(100),
  employment_type VARCHAR(50) DEFAULT 'full-time',
  joining_date DATE,
  salary DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lecturer_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  lecturer_id UUID REFERENCES staff(id),
  unit_id UUID REFERENCES units(id),
  academic_year VARCHAR(20),
  semester INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timetable (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id),
  lecturer_id UUID REFERENCES staff(id),
  program_id UUID REFERENCES programs(id),
  day_of_week VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(100),
  academic_year VARCHAR(20),
  semester INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id),
  intake_id UUID REFERENCES intakes(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  gender VARCHAR(10),
  date_of_birth DATE,
  national_id VARCHAR(50),
  address TEXT,
  previous_school VARCHAR(255),
  qualifications TEXT,
  documents JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  application_number VARCHAR(50) UNIQUE,
  converted_to_student BOOLEAN DEFAULT FALSE,
  student_id UUID REFERENCES students(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id),
  name VARCHAR(255) NOT NULL,
  academic_year VARCHAR(20),
  semester INTEGER,
  total_amount DECIMAL(10,2) NOT NULL,
  installments_allowed BOOLEAN DEFAULT TRUE,
  installment_count INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fee_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id),
  fee_structure_id UUID REFERENCES fee_structures(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  transaction_code VARCHAR(255),
  mpesa_receipt VARCHAR(255),
  bank_reference VARCHAR(255),
  payment_date TIMESTAMP DEFAULT NOW(),
  academic_year VARCHAR(20),
  semester INTEGER,
  received_by UUID REFERENCES users(id),
  receipt_number VARCHAR(50) UNIQUE,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id),
  student_id UUID REFERENCES students(id),
  timetable_id UUID REFERENCES timetable(id),
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'present',
  marked_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(unit_id, student_id, date)
);

CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id),
  program_id UUID REFERENCES programs(id),
  name VARCHAR(255) NOT NULL,
  exam_type VARCHAR(50) DEFAULT 'end_of_semester',
  exam_date DATE,
  start_time TIME,
  end_time TIME,
  venue VARCHAR(255),
  total_marks INTEGER DEFAULT 100,
  pass_mark INTEGER DEFAULT 40,
  academic_year VARCHAR(20),
  semester INTEGER,
  created_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES exams(id),
  student_id UUID REFERENCES students(id),
  unit_id UUID REFERENCES units(id),
  cat_marks DECIMAL(5,2) DEFAULT 0,
  exam_marks DECIMAL(5,2) DEFAULT 0,
  total_marks DECIMAL(5,2) DEFAULT 0,
  grade VARCHAR(5),
  grade_points DECIMAL(3,1),
  remarks VARCHAR(50),
  entered_by UUID REFERENCES users(id),
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  target_audience VARCHAR(50) DEFAULT 'all',
  program_id UUID REFERENCES programs(id),
  priority VARCHAR(20) DEFAULT 'normal',
  is_published BOOLEAN DEFAULT TRUE,
  published_by UUID REFERENCES users(id),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id),
  type VARCHAR(50) NOT NULL,
  file_url TEXT,
  generated_at TIMESTAMP DEFAULT NOW(),
  generated_by UUID REFERENCES users(id),
  is_valid BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_type VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50),
  transaction_code VARCHAR(255),
  payment_date TIMESTAMP DEFAULT NOW(),
  recorded_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_institution ON students(institution_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_institution ON payments(institution_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_institution ON audit_logs(institution_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
