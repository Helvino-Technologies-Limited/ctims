const { query } = require('../config/database');

const auditLog = (action, entityType) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (data) => {
    if (data.success && req.user) {
      try {
        await query(
          `INSERT INTO audit_logs (institution_id, user_id, action, entity_type, entity_id, new_values, ip_address, user_agent)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            req.user.institution_id,
            req.user.id,
            action,
            entityType,
            data.data?.id || null,
            JSON.stringify(req.body),
            req.ip,
            req.headers['user-agent']
          ]
        );
      } catch (e) { /* non-blocking */ }
    }
    return originalJson(data);
  };
  next();
};

module.exports = { auditLog };
