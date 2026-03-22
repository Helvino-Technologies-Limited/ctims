const bcrypt = require('bcryptjs');
const { query, getClient } = require('../config/database');
const { successResponse, errorResponse, paginate, generateApplicationNumber, generateStudentNumber } = require('../utils/helpers');

exports.submitApplication = async (req, res) => {
  try {
    const {
      institution_id, program_id, intake_id,
      first_name, last_name, email, phone, gender, date_of_birth,
      national_id, address, previous_school, qualifications
    } = req.body;

    const appNumber = await generateApplicationNumber();
    const result = await query(
      `INSERT INTO applications (institution_id,program_id,intake_id,first_name,last_name,email,phone,gender,
        date_of_birth,national_id,address,previous_school,qualifications,application_number)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [institution_id, program_id, intake_id, first_name, last_name, email, phone, gender,
       date_of_birth, national_id, address, previous_school, qualifications, appNumber]
    );
    return successResponse(res, result.rows[0], 'Application submitted successfully', 201);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error', 500);
  }
};

exports.getApplications = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { status, program_id, search } = req.query;
    let cond = ['a.institution_id=$1'];
    let params = [req.user.institution_id];
    let idx = 2;
    if (status) { cond.push(`a.status=$${idx++}`); params.push(status); }
    if (program_id) { cond.push(`a.program_id=$${idx++}`); params.push(program_id); }
    if (search) { cond.push(`(a.first_name ILIKE $${idx} OR a.last_name ILIKE $${idx} OR a.application_number ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

    const result = await query(
      `SELECT a.*, p.name as program_name, i.name as intake_name
       FROM applications a LEFT JOIN programs p ON a.program_id=p.id LEFT JOIN intakes i ON a.intake_id=i.id
       WHERE ${cond.join(' AND ')} ORDER BY a.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, limit, offset]
    );
    const countResult = await query(`SELECT COUNT(*) FROM applications a WHERE ${cond.join(' AND ')}`, params);
    return successResponse(res, { applications: result.rows, total: parseInt(countResult.rows[0].count), page, limit });
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.reviewApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;
    const result = await query(
      `UPDATE applications SET status=$1,rejection_reason=$2,reviewed_by=$3,reviewed_at=NOW(),updated_at=NOW()
       WHERE id=$4 AND institution_id=$5 RETURNING *`,
      [status, rejection_reason, req.user.id, id, req.user.institution_id]
    );
    if (!result.rows[0]) return errorResponse(res, 'Application not found', 404);
    return successResponse(res, result.rows[0], `Application ${status}`);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.getStats = async (req, res) => {
  try {
    const id = req.user.institution_id;
    const result = await query(
      `SELECT status, COUNT(*) as count FROM applications WHERE institution_id=$1 GROUP BY status`,
      [id]
    );
    const counts = { total: 0, pending: 0, reviewing: 0, approved: 0, rejected: 0 };
    result.rows.forEach(r => { counts[r.status] = parseInt(r.count); counts.total += parseInt(r.count); });
    return successResponse(res, counts);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.submitManualApplication = async (req, res) => {
  try {
    const {
      program_id, intake_id,
      first_name, last_name, email, phone, gender, date_of_birth,
      national_id, address, previous_school, qualifications
    } = req.body;
    const institution_id = req.user.institution_id;
    const appNumber = await generateApplicationNumber();
    const result = await query(
      `INSERT INTO applications (institution_id,program_id,intake_id,first_name,last_name,email,phone,gender,
        date_of_birth,national_id,address,previous_school,qualifications,application_number,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'reviewing') RETURNING *`,
      [institution_id, program_id, intake_id, first_name, last_name, email, phone, gender,
       date_of_birth, national_id, address, previous_school, qualifications, appNumber]
    );
    return successResponse(res, result.rows[0], 'Application created', 201);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error', 500);
  }
};

exports.convertToStudent = async (req, res) => {
  const client = await getClient();
  try {
    const { id } = req.params;
    const { program_id, intake_id, year_of_study, semester, guardian_name, guardian_phone, guardian_email, guardian_relationship } = req.body;

    const appResult = await client.query(
      `SELECT * FROM applications WHERE id=$1 AND institution_id=$2`,
      [id, req.user.institution_id]
    );
    const app = appResult.rows[0];
    if (!app) return errorResponse(res, 'Application not found', 404);
    if (app.status !== 'approved') return errorResponse(res, 'Application must be approved first', 400);
    if (app.converted_to_student) return errorResponse(res, 'Already converted to student', 400);

    await client.query('BEGIN');

    const studentNumber = await generateStudentNumber(req.user.institution_id);
    const tempPassword = `${studentNumber}@CTIMS`;
    const hash = await bcrypt.hash(tempPassword, 12);

    const userResult = await client.query(
      `INSERT INTO users (institution_id, email, password_hash, role, first_name, last_name, phone, gender, date_of_birth)
       VALUES ($1,$2,$3,'student',$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.institution_id, app.email, hash, app.first_name, app.last_name, app.phone, app.gender, app.date_of_birth]
    );
    const user = userResult.rows[0];

    const studentResult = await client.query(
      `INSERT INTO students (institution_id, user_id, student_number, program_id, intake_id, national_id,
        guardian_name, guardian_phone, guardian_email, guardian_relationship, year_of_study, semester)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [req.user.institution_id, user.id, studentNumber,
       program_id || app.program_id, intake_id || app.intake_id, app.national_id,
       guardian_name||null, guardian_phone||null, guardian_email||null, guardian_relationship||null,
       year_of_study||1, semester||1]
    );

    await client.query(
      `UPDATE applications SET converted_to_student=true, student_id=$1, updated_at=NOW() WHERE id=$2`,
      [studentResult.rows[0].id, id]
    );

    await client.query('COMMIT');
    return successResponse(res, {
      student: studentResult.rows[0],
      student_number: studentNumber,
      temp_password: tempPassword
    }, 'Student registered successfully', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return errorResponse(res, err.message || 'Server error', 500);
  } finally {
    client.release();
  }
};

exports.getPublicPrograms = async (req, res) => {
  try {
    const { institution_id } = req.params;
    const result = await query(
      `SELECT p.*, d.name as department_name, COUNT(i.id) as open_intakes
       FROM programs p LEFT JOIN departments d ON p.department_id=d.id
       LEFT JOIN intakes i ON i.program_id=p.id AND i.status='open'
       WHERE p.institution_id=$1 AND p.is_active=true
       GROUP BY p.id,d.name ORDER BY p.name`,
      [institution_id]
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};
