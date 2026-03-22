const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { successResponse, errorResponse, paginate } = require('../utils/helpers');

exports.registerInstitution = async (req, res) => {
  try {
    const {
      name, type, email, phone, address, county, website,
      admin_first_name, admin_last_name, admin_email, admin_password, admin_phone
    } = req.body;

    const existing = await query('SELECT id FROM institutions WHERE email = $1', [email]);
    if (existing.rows.length > 0) return errorResponse(res, 'Institution email already registered');

    const userExists = await query('SELECT id FROM users WHERE email = $1', [admin_email]);
    if (userExists.rows.length > 0) return errorResponse(res, 'Admin email already in use');

    const client = await require('../config/database').getClient();
    try {
      await client.query('BEGIN');

      const instResult = await client.query(
        `INSERT INTO institutions (name, type, email, phone, address, county, website, status, subscription_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'active','trial') RETURNING *`,
        [name, type, email, phone, address, county, website]
      );
      const institution = instResult.rows[0];

      const hash = await bcrypt.hash(admin_password, 12);
      const userResult = await client.query(
        `INSERT INTO users (institution_id, email, password_hash, role, first_name, last_name, phone)
         VALUES ($1,$2,$3,'admin',$4,$5,$6) RETURNING id,email,role,first_name,last_name`,
        [institution.id, admin_email, hash, admin_first_name, admin_last_name, admin_phone]
      );

      await client.query('COMMIT');
      return successResponse(res, { institution, admin: userResult.rows[0] }, 'Institution registered successfully', 201);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    return errorResponse(res, err.message || 'Server error', 500);
  }
};

exports.getAllInstitutions = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const search = req.query.search ? `%${req.query.search}%` : '%';
    const result = await query(
      `SELECT i.*, COUNT(u.id) FILTER (WHERE u.role='admin') as admin_count,
              COUNT(s.id) as student_count
       FROM institutions i
       LEFT JOIN users u ON u.institution_id = i.id
       LEFT JOIN students s ON s.institution_id = i.id
       WHERE (i.name ILIKE $1 OR i.email ILIKE $1)
       GROUP BY i.id
       ORDER BY i.created_at DESC
       LIMIT $2 OFFSET $3`,
      [search, limit, offset]
    );
    const count = await query(`SELECT COUNT(*) FROM institutions WHERE (name ILIKE $1 OR email ILIKE $1)`, [search]);
    return successResponse(res, {
      institutions: result.rows,
      total: parseInt(count.rows[0].count),
      page, limit
    });
  } catch (err) {
    return errorResponse(res, 'Server error', 500);
  }
};

exports.getInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT i.*,
              COUNT(DISTINCT s.id) as total_students,
              COUNT(DISTINCT st.id) as total_staff,
              COUNT(DISTINCT p.id) as total_programs
       FROM institutions i
       LEFT JOIN students s ON s.institution_id = i.id
       LEFT JOIN staff st ON st.institution_id = i.id
       LEFT JOIN programs p ON p.institution_id = i.id
       WHERE i.id = $1 GROUP BY i.id`,
      [id]
    );
    if (!result.rows[0]) return errorResponse(res, 'Institution not found', 404);
    return successResponse(res, result.rows[0]);
  } catch (err) {
    return errorResponse(res, 'Server error', 500);
  }
};

exports.updateInstitution = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, phone, address, county, website, status, subscription_status, subscription_expires_at } = req.body;
    const result = await query(
      `UPDATE institutions SET name=$1,type=$2,phone=$3,address=$4,county=$5,website=$6,
       status=$7,subscription_status=$8,subscription_expires_at=$9,updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [name, type, phone, address, county, website, status, subscription_status, subscription_expires_at, id]
    );
    return successResponse(res, result.rows[0], 'Institution updated');
  } catch (err) {
    return errorResponse(res, 'Server error', 500);
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await query('UPDATE institutions SET status=$1, updated_at=NOW() WHERE id=$2', [status, id]);
    return successResponse(res, null, `Institution ${status}`);
  } catch (err) {
    return errorResponse(res, 'Server error', 500);
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const [institutions, students, staff, revenue] = await Promise.all([
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status=\'active\') as active, COUNT(*) FILTER (WHERE status=\'suspended\') as suspended FROM institutions'),
      query('SELECT COUNT(*) as total FROM students'),
      query('SELECT COUNT(*) as total FROM staff'),
      query('SELECT COALESCE(SUM(amount),0) as total FROM subscription_payments')
    ]);
    return successResponse(res, {
      institutions: institutions.rows[0],
      students: students.rows[0],
      staff: staff.rows[0],
      revenue: revenue.rows[0],
    });
  } catch (err) {
    return errorResponse(res, 'Server error', 500);
  }
};
