const bcrypt = require('bcryptjs');
const { query, getClient } = require('../config/database');
const { successResponse, errorResponse, paginate, generateStudentNumber } = require('../utils/helpers');

exports.createStudent = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const {
      first_name, last_name, email, phone, gender, date_of_birth,
      program_id, intake_id, guardian_name, guardian_phone, guardian_email,
      guardian_relationship, national_id, year_of_study, semester
    } = req.body;
    const institutionId = req.user.institution_id;

    const studentNumber = await generateStudentNumber(institutionId);
    const tempPassword = `${studentNumber}@CTIMS`;
    const hash = await bcrypt.hash(tempPassword, 12);

    const userResult = await client.query(
      `INSERT INTO users (institution_id, email, password_hash, role, first_name, last_name, phone, gender, date_of_birth)
       VALUES ($1,$2,$3,'student',$4,$5,$6,$7,$8) RETURNING *`,
      [institutionId, email, hash, first_name, last_name, phone, gender, date_of_birth]
    );
    const user = userResult.rows[0];

    const studentResult = await client.query(
      `INSERT INTO students (institution_id, user_id, student_number, program_id, intake_id, guardian_name,
        guardian_phone, guardian_email, guardian_relationship, national_id, year_of_study, semester)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [institutionId, user.id, studentNumber, program_id, intake_id, guardian_name,
       guardian_phone, guardian_email, guardian_relationship, national_id, year_of_study || 1, semester || 1]
    );

    await client.query('COMMIT');
    return successResponse(res, {
      student: studentResult.rows[0],
      user: { ...user, temp_password: tempPassword }
    }, 'Student registered successfully', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    return errorResponse(res, err.message || 'Server error', 500);
  } finally {
    client.release();
  }
};

exports.getStudents = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { search, program_id, status, year_of_study } = req.query;
    const institutionId = req.user.institution_id;

    let conditions = ['s.institution_id = $1'];
    let params = [institutionId];
    let idx = 2;

    if (search) { conditions.push(`(u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx} OR s.student_number ILIKE $${idx} OR u.email ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (program_id) { conditions.push(`s.program_id = $${idx}`); params.push(program_id); idx++; }
    if (status) { conditions.push(`s.status = $${idx}`); params.push(status); idx++; }
    if (year_of_study) { conditions.push(`s.year_of_study = $${idx}`); params.push(year_of_study); idx++; }

    const where = conditions.join(' AND ');
    const result = await query(
      `SELECT s.*, u.first_name, u.last_name, u.email, u.phone, u.gender, u.profile_photo,
              p.name as program_name, p.code as program_code, i.name as intake_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN programs p ON s.program_id = p.id
       LEFT JOIN intakes i ON s.intake_id = i.id
       WHERE ${where}
       ORDER BY s.created_at DESC
       LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, limit, offset]
    );

    const countResult = await query(`SELECT COUNT(*) FROM students s JOIN users u ON s.user_id=u.id WHERE ${where}`, params);
    return successResponse(res, { students: result.rows, total: parseInt(countResult.rows[0].count), page, limit });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error', 500);
  }
};

exports.getStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.institution_id;

    // Students can only view their own record
    if (req.user.role === 'student' && req.user.student_id !== id) {
      return errorResponse(res, 'Access denied', 403);
    }

    const result = await query(
      `SELECT s.*, u.first_name, u.last_name, u.email, u.phone, u.gender, u.date_of_birth, u.profile_photo,
              p.name as program_name, p.code as program_code, p.duration_months,
              d.name as department_name, i.name as intake_name
       FROM students s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN programs p ON s.program_id = p.id
       LEFT JOIN departments d ON p.department_id = d.id
       LEFT JOIN intakes i ON s.intake_id = i.id
       WHERE s.id = $1 AND s.institution_id = $2`,
      [id, institutionId]
    );
    if (!result.rows[0]) return errorResponse(res, 'Student not found', 404);

    const [payments, attendance, results] = await Promise.all([
      query(`SELECT COALESCE(SUM(amount),0) as total_paid FROM payments WHERE student_id=$1`, [id]),
      query(`SELECT COUNT(*) FILTER(WHERE status='present') as present, COUNT(*) as total FROM attendance WHERE student_id=$1`, [id]),
      query(`SELECT COUNT(*) FILTER(WHERE remarks='Fail') as failed, COUNT(*) as total FROM results WHERE student_id=$1`, [id])
    ]);

    return successResponse(res, {
      ...result.rows[0],
      total_paid: payments.rows[0].total_paid,
      attendance_rate: attendance.rows[0].total > 0
        ? Math.round((attendance.rows[0].present / attendance.rows[0].total) * 100) : 0,
      results_summary: results.rows[0]
    });
  } catch (err) {
    return errorResponse(res, 'Server error', 500);
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, gender, date_of_birth, program_id, year_of_study, semester, status,
            guardian_name, guardian_phone, guardian_email, guardian_relationship } = req.body;

    const student = await query('SELECT user_id FROM students WHERE id=$1 AND institution_id=$2', [id, req.user.institution_id]);
    if (!student.rows[0]) return errorResponse(res, 'Student not found', 404);

    await query('UPDATE users SET first_name=$1,last_name=$2,phone=$3,gender=$4,date_of_birth=$5,updated_at=NOW() WHERE id=$6',
      [first_name, last_name, phone, gender, date_of_birth, student.rows[0].user_id]);

    const result = await query(
      `UPDATE students SET program_id=$1,year_of_study=$2,semester=$3,status=$4,
       guardian_name=$5,guardian_phone=$6,guardian_email=$7,guardian_relationship=$8,updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [program_id, year_of_study, semester, status, guardian_name, guardian_phone, guardian_email, guardian_relationship, id]
    );
    return successResponse(res, result.rows[0], 'Student updated');
  } catch (err) {
    return errorResponse(res, 'Server error', 500);
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const id = req.user.institution_id;
    const [total, byProgram, byStatus, recent, feeStats] = await Promise.all([
      query('SELECT COUNT(*) as total FROM students WHERE institution_id=$1', [id]),
      query(`SELECT p.name, COUNT(s.id) as count FROM students s JOIN programs p ON s.program_id=p.id WHERE s.institution_id=$1 GROUP BY p.name ORDER BY count DESC LIMIT 10`, [id]),
      query(`SELECT status, COUNT(*) as count FROM students WHERE institution_id=$1 GROUP BY status`, [id]),
      query(`SELECT s.student_number, u.first_name, u.last_name, p.name as program, s.created_at FROM students s JOIN users u ON s.user_id=u.id LEFT JOIN programs p ON s.program_id=p.id WHERE s.institution_id=$1 ORDER BY s.created_at DESC LIMIT 5`, [id]),
      query(`SELECT COALESCE(SUM(amount),0) as collected FROM payments WHERE institution_id=$1 AND EXTRACT(MONTH FROM payment_date)=EXTRACT(MONTH FROM NOW())`, [id])
    ]);
    return successResponse(res, { total: total.rows[0].total, byProgram: byProgram.rows, byStatus: byStatus.rows, recent: recent.rows, monthlyFees: feeStats.rows[0].collected });
  } catch (err) {
    return errorResponse(res, 'Server error', 500);
  }
};
