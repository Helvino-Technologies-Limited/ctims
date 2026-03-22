require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run(sql, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Setting up CTIMS database...');

    await run('SELECT NOW()');
    console.log('✅ Database connection successful');

    // Run each CREATE TABLE statement one at a time
    const statements = [
      `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

      `CREATE TABLE IF NOT EXISTS institutions (
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
      )`,

      `CREATE TABLE IF NOT EXISTS users (
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
      )`,

      `CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50),
        head_id UUID REFERENCES users(id),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS programs (
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
      )`,

      `CREATE TABLE IF NOT EXISTS units (
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
      )`,

      `CREATE TABLE IF NOT EXISTS intakes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
        program_id UUID REFERENCES programs(id),
        name VARCHAR(255) NOT NULL,
        start_date DATE,
        end_date DATE,
        capacity INTEGER,
        status VARCHAR(20) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS students (
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
      )`,

      `CREATE TABLE IF NOT EXISTS staff (
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
      )`,

      `CREATE TABLE IF NOT EXISTS lecturer_units (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
        lecturer_id UUID REFERENCES staff(id),
        unit_id UUID REFERENCES units(id),
        academic_year VARCHAR(20),
        semester INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS timetable (
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
      )`,

      `CREATE TABLE IF NOT EXISTS applications (
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS fee_structures (
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
      )`,

      `CREATE TABLE IF NOT EXISTS fee_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        is_mandatory BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS payments (
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
      )`,

      `CREATE TABLE IF NOT EXISTS attendance (
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
      )`,

      `CREATE TABLE IF NOT EXISTS exams (
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
      )`,

      `CREATE TABLE IF NOT EXISTS results (
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
      )`,

      `CREATE TABLE IF NOT EXISTS announcements (
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
      )`,

      `CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id),
        type VARCHAR(50) NOT NULL,
        file_url TEXT,
        generated_at TIMESTAMP DEFAULT NOW(),
        generated_by UUID REFERENCES users(id),
        is_valid BOOLEAN DEFAULT TRUE
      )`,

      `CREATE TABLE IF NOT EXISTS audit_logs (
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
      )`,

      `CREATE TABLE IF NOT EXISTS subscription_payments (
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
      )`,

      `CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution_id)`,
      `CREATE INDEX IF NOT EXISTS idx_students_institution ON students(institution_id)`,
      `CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id)`,
      `CREATE INDEX IF NOT EXISTS idx_payments_institution ON payments(institution_id)`,
      `CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id)`,
      `CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_institution ON audit_logs(institution_id)`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`,
    ];

    for (const stmt of statements) {
      try {
        await run(stmt);
      } catch (err) {
        const msg = err.message || '';
        if (!msg.includes('already exists')) {
          console.warn('⚠️ ', msg.substring(0, 100));
        }
      }
    }
    console.log('✅ All tables created');

    // ── Superadmin ──────────────────────────────────────
    const saEmail = process.env.SUPERADMIN_EMAIL;
    const saPass  = process.env.SUPERADMIN_PASSWORD;
    if (!saEmail || !saPass) {
      throw new Error('SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD missing in .env');
    }
    const saHash = await bcrypt.hash(saPass, 12);
    const saExists = await run('SELECT id FROM users WHERE email=$1', [saEmail]);
    if (saExists.rows.length === 0) {
      await run(
        `INSERT INTO users (email,password_hash,role,first_name,last_name)
         VALUES ($1,$2,'superadmin','Super','Admin')`,
        [saEmail, saHash]
      );
      console.log('✅ Superadmin created:', saEmail);
    } else {
      await run('UPDATE users SET password_hash=$1 WHERE email=$2', [saHash, saEmail]);
      console.log('ℹ️  Superadmin password refreshed');
    }

    // ── Demo Institution ─────────────────────────────────
    let demoInst = await run(
      `SELECT id FROM institutions WHERE email='demo@kenyatechcollege.ac.ke'`
    );

    let institutionId;
    if (demoInst.rows.length === 0) {
      const inst = await run(
        `INSERT INTO institutions
           (name,type,email,phone,address,county,website,status,subscription_status,setup_fee_paid,annual_fee_paid)
         VALUES
           ('Kenya Technical College','TVET','demo@kenyatechcollege.ac.ke',
            '0712000001','P.O Box 1234, Nairobi','Nairobi',
            'https://kenyatechcollege.ac.ke','active','active',TRUE,TRUE)
         RETURNING id`,
        []
      );
      institutionId = inst.rows[0].id;
      console.log('✅ Demo institution created');
    } else {
      institutionId = demoInst.rows[0].id;
      console.log('ℹ️  Demo institution already exists');
    }

    // ── Demo Users ───────────────────────────────────────
    const demoUsers = [
      { email:'admin@kenyatechcollege.ac.ke',  pass:'Admin@2024',    role:'admin',     first:'Alice',  last:'Kamau',    phone:'0712000002' },
      { email:'finance@kenyatechcollege.ac.ke', pass:'Finance@2024',  role:'finance',   first:'Brian',  last:'Otieno',   phone:'0712000003' },
      { email:'registrar@kenyatechcollege.ac.ke',pass:'Registrar@2024',role:'registrar',first:'Carol',  last:'Mwangi',   phone:'0712000004' },
      { email:'lecturer@kenyatechcollege.ac.ke', pass:'Lecturer@2024', role:'lecturer',  first:'David',  last:'Kipchoge', phone:'0712000005' },
      { email:'student@kenyatechcollege.ac.ke',  pass:'Student@2024',  role:'student',   first:'Eve',    last:'Achieng',  phone:'0712000006' },
    ];

    const createdUsers = {};
    for (const u of demoUsers) {
      const exists = await run('SELECT id FROM users WHERE email=$1', [u.email]);
      let uid;
      if (exists.rows.length === 0) {
        const hash = await bcrypt.hash(u.pass, 12);
        const res = await run(
          `INSERT INTO users (institution_id,email,password_hash,role,first_name,last_name,phone)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
          [institutionId, u.email, hash, u.role, u.first, u.last, u.phone]
        );
        uid = res.rows[0].id;
        console.log(`✅ Demo user created: ${u.email}`);
      } else {
        uid = exists.rows[0].id;
      }
      createdUsers[u.role] = uid;
    }

    // ── Departments ──────────────────────────────────────
    const deptData = [
      { name:'Business & Commerce',      code:'BUS', desc:'Business, accounting and entrepreneurship programs' },
      { name:'Information Technology',   code:'ICT', desc:'Computing, networking and software development' },
      { name:'Engineering & Technology', code:'ENG', desc:'Electrical, mechanical and civil engineering' },
      { name:'Health Sciences',          code:'HLS', desc:'Nursing, clinical medicine and public health' },
    ];
    const deptIds = {};
    for (const d of deptData) {
      const ex = await run(
        'SELECT id FROM departments WHERE institution_id=$1 AND code=$2',
        [institutionId, d.code]
      );
      if (ex.rows.length === 0) {
        const r = await run(
          `INSERT INTO departments (institution_id,name,code,description)
           VALUES ($1,$2,$3,$4) RETURNING id`,
          [institutionId, d.name, d.code, d.desc]
        );
        deptIds[d.code] = r.rows[0].id;
      } else {
        deptIds[d.code] = ex.rows[0].id;
      }
    }
    console.log('✅ Departments seeded');

    // ── Programs ─────────────────────────────────────────
    const progData = [
      { name:'Diploma in Business Management',       code:'DBM',  dept:'BUS', level:'Diploma',     months:24 },
      { name:'Certificate in Accounting',            code:'CA',   dept:'BUS', level:'Certificate',  months:12 },
      { name:'Diploma in Information Technology',    code:'DIT',  dept:'ICT', level:'Diploma',     months:24 },
      { name:'Certificate in Computer Applications', code:'CCA',  dept:'ICT', level:'Certificate',  months:12 },
      { name:'Diploma in Electrical Engineering',    code:'DEE',  dept:'ENG', level:'Diploma',     months:24 },
      { name:'Diploma in Clinical Medicine',         code:'DCM',  dept:'HLS', level:'Diploma',     months:36 },
    ];
    const progIds = {};
    for (const p of progData) {
      const ex = await run(
        'SELECT id FROM programs WHERE institution_id=$1 AND code=$2',
        [institutionId, p.code]
      );
      if (ex.rows.length === 0) {
        const r = await run(
          `INSERT INTO programs (institution_id,department_id,name,code,level,duration_months,is_active)
           VALUES ($1,$2,$3,$4,$5,$6,TRUE) RETURNING id`,
          [institutionId, deptIds[p.dept], p.name, p.code, p.level, p.months]
        );
        progIds[p.code] = r.rows[0].id;
      } else {
        progIds[p.code] = ex.rows[0].id;
      }
    }
    console.log('✅ Programs seeded');

    // ── Units ────────────────────────────────────────────
    const unitData = [
      { name:'Business Communication',         code:'BUS101', prog:'DBM', yr:1, sem:1, ch:3 },
      { name:'Principles of Management',       code:'BUS102', prog:'DBM', yr:1, sem:1, ch:3 },
      { name:'Financial Accounting I',         code:'BUS103', prog:'DBM', yr:1, sem:2, ch:4 },
      { name:'Entrepreneurship',               code:'BUS201', prog:'DBM', yr:2, sem:1, ch:3 },
      { name:'Introduction to Computers',      code:'ICT101', prog:'DIT', yr:1, sem:1, ch:3 },
      { name:'Programming Fundamentals',       code:'ICT102', prog:'DIT', yr:1, sem:1, ch:4 },
      { name:'Database Management Systems',    code:'ICT201', prog:'DIT', yr:1, sem:2, ch:4 },
      { name:'Web Development',                code:'ICT202', prog:'DIT', yr:2, sem:1, ch:3 },
      { name:'Basic Accounting',               code:'ACC101', prog:'CA',  yr:1, sem:1, ch:4 },
      { name:'Bookkeeping',                    code:'ACC102', prog:'CA',  yr:1, sem:2, ch:3 },
    ];
    const unitIds = {};
    for (const u of unitData) {
      const ex = await run(
        'SELECT id FROM units WHERE institution_id=$1 AND code=$2',
        [institutionId, u.code]
      );
      if (ex.rows.length === 0) {
        const r = await run(
          `INSERT INTO units (institution_id,program_id,name,code,credit_hours,semester,year_of_study)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
          [institutionId, progIds[u.prog], u.name, u.code, u.ch, u.sem, u.yr]
        );
        unitIds[u.code] = r.rows[0].id;
      } else {
        unitIds[u.code] = ex.rows[0].id;
      }
    }
    console.log('✅ Units seeded');

    // ── Staff record for demo lecturer ───────────────────
    const lStaff = await run(
      'SELECT id FROM staff WHERE user_id=$1', [createdUsers['lecturer']]
    );
    let lecturerStaffId;
    if (lStaff.rows.length === 0) {
      const r = await run(
        `INSERT INTO staff (institution_id,user_id,staff_number,department_id,designation,employment_type,joining_date)
         VALUES ($1,$2,'STAFF0001',$3,'Senior Lecturer','full-time','2023-01-15') RETURNING id`,
        [institutionId, createdUsers['lecturer'], deptIds['ICT']]
      );
      lecturerStaffId = r.rows[0].id;
    } else {
      lecturerStaffId = lStaff.rows[0].id;
    }

    // ── Intake ───────────────────────────────────────────
    let intakeId;
    const exIntake = await run(
      'SELECT id FROM intakes WHERE institution_id=$1 AND name=$2',
      [institutionId, 'January 2024 Intake']
    );
    if (exIntake.rows.length === 0) {
      const r = await run(
        `INSERT INTO intakes (institution_id,program_id,name,start_date,end_date,capacity,status)
         VALUES ($1,$2,'January 2024 Intake','2024-01-15','2024-01-31',200,'open') RETURNING id`,
        [institutionId, progIds['DIT']]
      );
      intakeId = r.rows[0].id;
    } else {
      intakeId = exIntake.rows[0].id;
    }

    // ── Demo Students ────────────────────────────────────
    const studentData = [
      { first:'James',    last:'Mwangi',   email:'james.mwangi@student.ktc.ac.ke',   phone:'0721001001', gender:'male',   prog:'DIT', num:'STU240001' },
      { first:'Mary',     last:'Atieno',   email:'mary.atieno@student.ktc.ac.ke',    phone:'0721001002', gender:'female', prog:'DIT', num:'STU240002' },
      { first:'Peter',    last:'Njoroge',  email:'peter.njoroge@student.ktc.ac.ke',  phone:'0721001003', gender:'male',   prog:'DBM', num:'STU240003' },
      { first:'Grace',    last:'Wanjiru',  email:'grace.wanjiru@student.ktc.ac.ke',  phone:'0721001004', gender:'female', prog:'DBM', num:'STU240004' },
      { first:'Kevin',    last:'Ochieng',  email:'kevin.ochieng@student.ktc.ac.ke',  phone:'0721001005', gender:'male',   prog:'CA',  num:'STU240005' },
      { first:'Faith',    last:'Mutua',    email:'faith.mutua@student.ktc.ac.ke',    phone:'0721001006', gender:'female', prog:'DIT', num:'STU240006' },
      { first:'Samuel',   last:'Kariuki',  email:'samuel.kariuki@student.ktc.ac.ke', phone:'0721001007', gender:'male',   prog:'DEE', num:'STU240007' },
      { first:'Lydia',    last:'Chebet',   email:'lydia.chebet@student.ktc.ac.ke',   phone:'0721001008', gender:'female', prog:'DBM', num:'STU240008' },
      { first:'Daniel',   last:'Onyango',  email:'daniel.onyango@student.ktc.ac.ke', phone:'0721001009', gender:'male',   prog:'DCM', num:'STU240009' },
      { first:'Esther',   last:'Ndungu',   email:'esther.ndungu@student.ktc.ac.ke',  phone:'0721001010', gender:'female', prog:'DIT', num:'STU240010' },
    ];

    const studentIds = [];
    for (const s of studentData) {
      const ex = await run('SELECT id FROM users WHERE email=$1', [s.email]);
      let userId;
      if (ex.rows.length === 0) {
        const hash = await bcrypt.hash('Student@2024', 12);
        const ur = await run(
          `INSERT INTO users (institution_id,email,password_hash,role,first_name,last_name,phone,gender)
           VALUES ($1,$2,$3,'student',$4,$5,$6,$7) RETURNING id`,
          [institutionId, s.email, hash, s.first, s.last, s.phone, s.gender]
        );
        userId = ur.rows[0].id;
      } else {
        userId = ex.rows[0].id;
      }

      const exStu = await run(
        'SELECT id FROM students WHERE student_number=$1', [s.num]
      );
      let stuId;
      if (exStu.rows.length === 0) {
        const sr = await run(
          `INSERT INTO students
             (institution_id,user_id,student_number,program_id,intake_id,year_of_study,semester,
              guardian_name,guardian_phone,status)
           VALUES ($1,$2,$3,$4,$5,1,1,'Parent/Guardian','0700000000','active') RETURNING id`,
          [institutionId, userId, s.num, progIds[s.prog], intakeId]
        );
        stuId = sr.rows[0].id;
      } else {
        stuId = exStu.rows[0].id;
      }
      studentIds.push(stuId);
    }
    console.log('✅ Demo students seeded (10)');

    // ── Fee Structures ───────────────────────────────────
    let feeStructureId;
    const exFS = await run(
      `SELECT id FROM fee_structures WHERE institution_id=$1 AND name='DIT Year 1 - 2024/2025'`,
      [institutionId]
    );
    if (exFS.rows.length === 0) {
      const fsr = await run(
        `INSERT INTO fee_structures
           (institution_id,program_id,name,academic_year,semester,total_amount,installments_allowed,installment_count)
         VALUES ($1,$2,'DIT Year 1 - 2024/2025','2024/2025',1,45000,TRUE,3) RETURNING id`,
        [institutionId, progIds['DIT']]
      );
      feeStructureId = fsr.rows[0].id;
      await run(`INSERT INTO fee_items (fee_structure_id,name,amount,is_mandatory) VALUES ($1,'Tuition Fee',35000,TRUE)`, [feeStructureId]);
      await run(`INSERT INTO fee_items (fee_structure_id,name,amount,is_mandatory) VALUES ($1,'Exam Fee',5000,TRUE)`,    [feeStructureId]);
      await run(`INSERT INTO fee_items (fee_structure_id,name,amount,is_mandatory) VALUES ($1,'Library Fee',2000,TRUE)`, [feeStructureId]);
      await run(`INSERT INTO fee_items (fee_structure_id,name,amount,is_mandatory) VALUES ($1,'ID Card',500,TRUE)`,      [feeStructureId]);
      await run(`INSERT INTO fee_items (fee_structure_id,name,amount,is_mandatory) VALUES ($1,'Sports Fee',1500,FALSE)`, [feeStructureId]);
      await run(`INSERT INTO fee_items (fee_structure_id,name,amount,is_mandatory) VALUES ($1,'Caution Money',1000,FALSE)`,[feeStructureId]);
    } else {
      feeStructureId = exFS.rows[0].id;
    }
    console.log('✅ Fee structures seeded');

    // ── Sample Payments ──────────────────────────────────
    const adminUserId = createdUsers['finance'];
    const paymentMethods = ['mpesa','cash','bank','mpesa','mpesa','cash','mpesa','bank','mpesa','cash'];
    const amounts       = [45000,30000,45000,15000,45000,20000,45000,45000,10000,45000];
    const txCodes       = ['QHF7ABC123','','BANK-REF-001','QHF7DEF456','QHF7GHI789','','QHF7JKL012','BANK-REF-002','QHF7MNO345',''];

    for (let i = 0; i < studentIds.length; i++) {
      const exPay = await run(
        'SELECT id FROM payments WHERE student_id=$1 AND institution_id=$2 LIMIT 1',
        [studentIds[i], institutionId]
      );
      if (exPay.rows.length === 0) {
        const rn = `RCP${Date.now().toString().slice(-6)}${String(i+1).padStart(4,'0')}`;
        await run(
          `INSERT INTO payments
             (institution_id,student_id,fee_structure_id,amount,payment_method,
              transaction_code,academic_year,semester,received_by,receipt_number,status)
           VALUES ($1,$2,$3,$4,$5,$6,'2024/2025',1,$7,$8,'completed')`,
          [institutionId, studentIds[i], feeStructureId, amounts[i],
           paymentMethods[i], txCodes[i] || null, adminUserId, rn]
        );
        await new Promise(r => setTimeout(r, 5)); // avoid duplicate timestamps
      }
    }
    console.log('✅ Sample payments seeded');

    // ── Timetable ────────────────────────────────────────
    const ttEntries = [
      { unit:'ICT101', day:'Monday',    st:'08:00', et:'10:00', room:'Lab 1'   },
      { unit:'ICT102', day:'Tuesday',   st:'10:00', et:'12:00', room:'Lab 2'   },
      { unit:'ICT201', day:'Wednesday', st:'08:00', et:'10:00', room:'Lab 1'   },
      { unit:'ICT202', day:'Thursday',  st:'14:00', et:'16:00', room:'Lab 3'   },
      { unit:'BUS101', day:'Monday',    st:'14:00', et:'16:00', room:'Room 101' },
      { unit:'BUS102', day:'Wednesday', st:'10:00', et:'12:00', room:'Room 102' },
    ];
    for (const t of ttEntries) {
      const ex = await run(
        'SELECT id FROM timetable WHERE institution_id=$1 AND unit_id=$2 AND day_of_week=$3',
        [institutionId, unitIds[t.unit], t.day]
      );
      if (ex.rows.length === 0 && unitIds[t.unit]) {
        await run(
          `INSERT INTO timetable
             (institution_id,unit_id,lecturer_id,program_id,day_of_week,start_time,end_time,room,academic_year,semester)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'2024/2025',1)`,
          [institutionId, unitIds[t.unit], lecturerStaffId,
           progIds[t.unit.startsWith('ICT') ? 'DIT' : 'DBM'], t.day, t.st, t.et, t.room]
        );
      }
    }
    console.log('✅ Timetable seeded');

    // ── Attendance (last 7 days) ──────────────────────────
    for (let d = 6; d >= 0; d--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - d);
      const dateStr = dt.toISOString().split('T')[0];
      for (const stuId of studentIds.slice(0, 6)) {
        const statuses = ['present','present','present','present','absent','late'];
        const st = statuses[Math.floor(Math.random() * statuses.length)];
        if (unitIds['ICT101']) {
          try {
            await run(
              `INSERT INTO attendance (institution_id,unit_id,student_id,date,status,marked_by)
               VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (unit_id,student_id,date) DO NOTHING`,
              [institutionId, unitIds['ICT101'], stuId, dateStr, st, createdUsers['lecturer']]
            );
          } catch (_) {}
        }
      }
    }
    console.log('✅ Attendance records seeded');

    // ── Exams ────────────────────────────────────────────
    let examId;
    const exExam = await run(
      `SELECT id FROM exams WHERE institution_id=$1 AND name='ICT101 End of Semester Exam'`,
      [institutionId]
    );
    if (exExam.rows.length === 0 && unitIds['ICT101']) {
      const er = await run(
        `INSERT INTO exams
           (institution_id,unit_id,program_id,name,exam_type,exam_date,start_time,
            end_time,venue,total_marks,pass_mark,academic_year,semester,created_by,status)
         VALUES ($1,$2,$3,'ICT101 End of Semester Exam','end_of_semester',
                 CURRENT_DATE,'09:00','12:00','Main Hall',100,40,'2024/2025',1,$4,'completed')
         RETURNING id`,
        [institutionId, unitIds['ICT101'], progIds['DIT'], createdUsers['admin']]
      );
      examId = er.rows[0].id;
    } else if (exExam.rows.length > 0) {
      examId = exExam.rows[0].id;
    }

    // ── Results ──────────────────────────────────────────
    if (examId) {
      const markSets = [
        {cat:28,exam:65},{cat:25,exam:58},{cat:30,exam:72},{cat:22,exam:50},
        {cat:18,exam:35},{cat:27,exam:68},{cat:15,exam:28},{cat:29,exam:71},
        {cat:20,exam:42},{cat:26,exam:60},
      ];
      for (let i = 0; i < studentIds.length; i++) {
        const ex2 = await run(
          'SELECT id FROM results WHERE exam_id=$1 AND student_id=$2',
          [examId, studentIds[i]]
        );
        if (ex2.rows.length === 0) {
          const ms = markSets[i] || {cat:20,exam:50};
          const total = ms.cat + ms.exam;
          const pct = total;
          const grade = pct>=70?'A':pct>=60?'B':pct>=50?'C':pct>=40?'D':'E';
          const pts   = pct>=70?4.0:pct>=60?3.0:pct>=50?2.0:pct>=40?1.0:0.0;
          const rmk   = pct>=70?'Distinction':pct>=60?'Credit':pct>=40?'Pass':'Fail';
          await run(
            `INSERT INTO results
               (institution_id,exam_id,student_id,unit_id,cat_marks,exam_marks,
                total_marks,grade,grade_points,remarks,entered_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
             ON CONFLICT (exam_id,student_id) DO NOTHING`,
            [institutionId, examId, studentIds[i], unitIds['ICT101'],
             ms.cat, ms.exam, total, grade, pts, rmk, createdUsers['lecturer']]
          );
        }
      }
      console.log('✅ Exam results seeded');
    }

    // ── Announcements ────────────────────────────────────
    const ann = await run(
      'SELECT id FROM announcements WHERE institution_id=$1 LIMIT 1', [institutionId]
    );
    if (ann.rows.length === 0) {
      await run(
        `INSERT INTO announcements (institution_id,title,content,target_audience,priority,published_by)
         VALUES ($1,'Welcome to Kenya Technical College 2024',
           'Dear students and staff, welcome to the 2024/2025 academic year. All students are required to complete registration by January 31st. Fee payment deadline is February 15th.',
           'all','high',$2)`,
        [institutionId, createdUsers['admin']]
      );
      await run(
        `INSERT INTO announcements (institution_id,title,content,target_audience,priority,published_by)
         VALUES ($1,'End of Semester Exams Schedule',
           'End of semester examinations will commence on March 1st, 2024. Students are advised to check the timetable on the notice board. No mobile phones allowed in the exam room.',
           'students','normal',$2)`,
        [institutionId, createdUsers['admin']]
      );
      await run(
        `INSERT INTO announcements (institution_id,title,content,target_audience,priority,published_by)
         VALUES ($1,'Staff Meeting — Academic Calendar Review',
           'All teaching staff are required to attend the academic calendar review meeting on Friday at 2:00 PM in the boardroom. Attendance is mandatory.',
           'staff','normal',$2)`,
        [institutionId, createdUsers['admin']]
      );
    }
    console.log('✅ Announcements seeded');

    // ── Notifications ────────────────────────────────────
    const notifCheck = await run(
      'SELECT id FROM notifications WHERE institution_id=$1 LIMIT 1', [institutionId]
    );
    if (notifCheck.rows.length === 0) {
      for (const [role, uid] of Object.entries(createdUsers)) {
        if (role === 'student') continue;
        await run(
          `INSERT INTO notifications (institution_id,user_id,title,message,type)
           VALUES ($1,$2,'System Ready','CTIMS has been set up successfully. Explore your dashboard.','success')`,
          [institutionId, uid]
        );
      }
    }
    console.log('✅ Notifications seeded');

    console.log('\n🎉 ══════════════════════════════════════════════');
    console.log('   CTIMS Database Setup Complete!');
    console.log('══════════════════════════════════════════════');
    console.log('\n📋 DEMO CREDENTIALS (Kenya Technical College):');
    console.log('   Admin      → admin@kenyatechcollege.ac.ke    / Admin@2024');
    console.log('   Finance    → finance@kenyatechcollege.ac.ke  / Finance@2024');
    console.log('   Registrar  → registrar@kenyatechcollege.ac.ke/ Registrar@2024');
    console.log('   Lecturer   → lecturer@kenyatechcollege.ac.ke / Lecturer@2024');
    console.log('   Student    → student@kenyatechcollege.ac.ke  / Student@2024');
    console.log('══════════════════════════════════════════════\n');

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Setup error:', err.message);
    console.error(err.stack);
    await pool.end();
    process.exit(1);
  }
}

setupDatabase();
