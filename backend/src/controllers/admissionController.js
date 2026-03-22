const { query } = require('../config/database');
const { successResponse, errorResponse, paginate, generateApplicationNumber } = require('../utils/helpers');

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
