const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      'SELECT u.*, i.name as institution_name, i.status as institution_status FROM users u LEFT JOIN institutions i ON u.institution_id = i.id WHERE u.id = $1 AND u.is_active = true',
      [decoded.userId]
    );
    if (!result.rows[0]) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};

const tenantGuard = (req, res, next) => {
  if (req.user.role === 'superadmin') return next();
  const tid = req.params.institutionId || req.body.institution_id || req.query.institution_id;
  if (tid && tid !== req.user.institution_id) {
    return res.status(403).json({ success: false, message: 'Cross-tenant access denied' });
  }
  next();
};

module.exports = { authenticate, authorize, tenantGuard };
