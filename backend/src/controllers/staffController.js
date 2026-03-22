const bcrypt = require('bcryptjs');
const { query, getClient } = require('../config/database');
const { successResponse, errorResponse, paginate } = require('../utils/helpers');

exports.createStaff = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const {
      first_name, last_name, email, phone, gender, date_of_birth,
      role, department_id, designation, employment_type, joining_date, salary
    } = req.body;
    const institutionId = req.user.institution_id;

    const count = await client.query('SELECT COUNT(*) FROM staff WHERE institution_id=$1', [institutionId]);
    const staffNumber = `STAFF${String(parseInt(count.rows[0].count)+1).padStart(4,'0')}`;
    const tempPassword = `${staffNumber}@CTIMS`;
    const hash = await bcrypt.hash(tempPassword, 12);

    const userResult = await client.query(
      `INSERT INTO users (institution_id,email,password_hash,role,first_name,last_name,phone,gender,date_of_birth)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [institutionId, email, hash, role || 'lecturer', first_name, last_name, phone, gender, date_of_birth]
    );

    const staffResult = await client.query(
      `INSERT INTO staff (institution_id,user_id,staff_number,department_id,designation,employment_type,joining_date,salary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [institutionId, userResult.rows[0].id, staffNumber, department_id, designation, employment_type, joining_date, salary]
    );

    await client.query('COMMIT');
    return successResponse(res, { staff: staffResult.rows[0], temp_password: tempPassword }, 'Staff created', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    return errorResponse(res, err.message || 'Server error', 500);
  } finally {
    client.release();
  }
};

exports.getStaff = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { search, department_id, role } = req.query;
    const institutionId = req.user.institution_id;

    let conditions = ['s.institution_id = $1'];
    let params = [institutionId];
    let idx = 2;

    if (search) { conditions.push(`(u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx} OR s.staff_number ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (department_id) { conditions.push(`s.department_id = $${idx}`); params.push(department_id); idx++; }
    if (role) { conditions.push(`u.role = $${idx}`); params.push(role); idx++; }

    const where = conditions.join(' AND ');
    const result = await query(
      `SELECT s.*, u.first_name, u.last_name, u.email, u.phone, u.gender, u.role, u.profile_photo, u.is_active,
              d.name as department_name
       FROM staff s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN departments d ON s.department_id = d.id
       WHERE ${where}
       ORDER BY s.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, limit, offset]
    );
    const countResult = await query(`SELECT COUNT(*) FROM staff s JOIN users u ON s.user_id=u.id WHERE ${where}`, params);
    return successResponse(res, { staff: result.rows, total: parseInt(countResult.rows[0].count), page, limit });
  } catch (err) {
    return errorResponse(res, 'Server error', 500);
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone, gender, department_id, designation, employment_type, salary, is_active } = req.body;

    const staff = await query('SELECT user_id FROM staff WHERE id=$1 AND institution_id=$2', [id, req.user.institution_id]);
    if (!staff.rows[0]) return errorResponse(res, 'Staff not found', 404);

    await query('UPDATE users SET first_name=$1,last_name=$2,phone=$3,gender=$4,is_active=$5,updated_at=NOW() WHERE id=$6',
      [first_name, last_name, phone, gender, is_active, staff.rows[0].user_id]);

    const result = await query(
      'UPDATE staff SET department_id=$1,designation=$2,employment_type=$3,salary=$4 WHERE id=$5 RETURNING *',
      [department_id, designation, employment_type, salary, id]
    );
    return successResponse(res, result.rows[0], 'Staff updated');
  } catch (err) {
    return errorResponse(res, 'Server error', 500);
  }
};
