const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

exports.getUsers = async (req, res) => {
  try {
    const { role, is_active } = req.query;
    let cond = ['institution_id=$1'];
    let params = [req.user.institution_id];
    let idx = 2;
    if (role) { cond.push(`role=$${idx++}`); params.push(role); }
    if (is_active !== undefined) { cond.push(`is_active=$${idx++}`); params.push(is_active); }

    const result = await query(
      `SELECT id,email,role,first_name,last_name,phone,gender,is_active,last_login,created_at FROM users WHERE ${cond.join(' AND ')} ORDER BY first_name`,
      params
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, role, first_name, last_name, phone, gender } = req.body;
    const existing = await query('SELECT id FROM users WHERE email=$1', [email]);
    if (existing.rows[0]) return errorResponse(res, 'Email already in use');

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (institution_id,email,password_hash,role,first_name,last_name,phone,gender)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,email,role,first_name,last_name`,
      [req.user.institution_id, email, hash, role, first_name, last_name, phone, gender]
    );
    return successResponse(res, result.rows[0], 'User created', 201);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    await query('UPDATE users SET is_active=$1,updated_at=NOW() WHERE id=$2 AND institution_id=$3', [is_active, id, req.user.institution_id]);
    return successResponse(res, null, `User ${is_active ? 'activated' : 'deactivated'}`);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;
    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash=$1,updated_at=NOW() WHERE id=$2 AND institution_id=$3', [hash, id, req.user.institution_id]);
    return successResponse(res, null, 'Password reset successfully');
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};
