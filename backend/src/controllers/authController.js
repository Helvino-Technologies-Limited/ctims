const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

const generateToken = (userId, role, institutionId) =>
  jwt.sign({ userId, role, institutionId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return errorResponse(res, 'Email and password required');

    const result = await query(
      `SELECT u.*, i.name as institution_name, i.status as inst_status, i.subscription_status,
              s.id as student_id
       FROM users u
       LEFT JOIN institutions i ON u.institution_id = i.id
       LEFT JOIN students s ON s.user_id = u.id
       WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];
    if (!user) return errorResponse(res, 'Invalid credentials', 401);
    if (!user.is_active) return errorResponse(res, 'Account is deactivated', 401);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return errorResponse(res, 'Invalid credentials', 401);

    if (user.role !== 'superadmin' && user.inst_status === 'suspended') {
      return errorResponse(res, 'Institution is suspended. Contact support.', 403);
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = generateToken(user.id, user.role, user.institution_id);
    const { password_hash, ...safeUser } = user;

    return successResponse(res, { token, user: safeUser }, 'Login successful');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error', 500);
  }
};

exports.getMe = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.profile_photo,
              u.institution_id, u.last_login, u.created_at,
              i.name as institution_name, i.type as institution_type, i.logo_url,
              i.status as institution_status, i.subscription_status,
              s.id as student_id
       FROM users u
       LEFT JOIN institutions i ON u.institution_id = i.id
       LEFT JOIN students s ON s.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    return successResponse(res, result.rows[0]);
  } catch (err) {
    return errorResponse(res, 'Server error', 500);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, result.rows[0].password_hash);
    if (!valid) return errorResponse(res, 'Current password is incorrect');
    const hash = await bcrypt.hash(new_password, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);
    return successResponse(res, null, 'Password changed successfully');
  } catch (err) {
    return errorResponse(res, 'Server error', 500);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone } = req.body;
    const result = await query(
      'UPDATE users SET first_name=$1, last_name=$2, phone=$3, updated_at=NOW() WHERE id=$4 RETURNING id,first_name,last_name,phone,email,role',
      [first_name, last_name, phone, req.user.id]
    );
    return successResponse(res, result.rows[0], 'Profile updated');
  } catch (err) {
    return errorResponse(res, 'Server error', 500);
  }
};
