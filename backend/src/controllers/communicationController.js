const { query } = require('../config/database');
const { successResponse, errorResponse, paginate } = require('../utils/helpers');

exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, target_audience, program_id, priority, expires_at } = req.body;
    const result = await query(
      `INSERT INTO announcements (institution_id,title,content,target_audience,program_id,priority,published_by,expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.institution_id, title, content, target_audience, program_id, priority, req.user.id, expires_at]
    );

    // Create notifications for target audience
    let userQuery = `SELECT id FROM users WHERE institution_id=$1 AND is_active=true`;
    if (target_audience === 'students') userQuery += ` AND role='student'`;
    if (target_audience === 'staff') userQuery += ` AND role IN ('lecturer','admin','finance','registrar')`;

    const users = await query(userQuery, [req.user.institution_id]);
    for (const u of users.rows) {
      await query(
        'INSERT INTO notifications (institution_id,user_id,title,message,type) VALUES ($1,$2,$3,$4,$5)',
        [req.user.institution_id, u.id, title, content.substring(0, 200), 'info']
      );
    }

    return successResponse(res, result.rows[0], 'Announcement created', 201);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error', 500);
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);

    // Students only see announcements targeted to 'all' or 'students'
    const audienceFilter = req.user.role === 'student'
      ? `AND a.target_audience IN ('all', 'students')`
      : '';

    const result = await query(
      `SELECT a.*, u.first_name||' '||u.last_name as published_by_name, p.name as program_name
       FROM announcements a LEFT JOIN users u ON a.published_by=u.id LEFT JOIN programs p ON a.program_id=p.id
       WHERE a.institution_id=$1 AND a.is_published=true ${audienceFilter}
       ORDER BY a.created_at DESC LIMIT $2 OFFSET $3`,
      [req.user.institution_id, limit, offset]
    );
    const count = await query(
      `SELECT COUNT(*) FROM announcements WHERE institution_id=$1 AND is_published=true ${audienceFilter}`,
      [req.user.institution_id]
    );
    return successResponse(res, { announcements: result.rows, total: parseInt(count.rows[0].count), page, limit });
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.getNotifications = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const unread = await query('SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=false', [req.user.id]);
    return successResponse(res, { notifications: result.rows, unread_count: parseInt(unread.rows[0].count) });
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await query('UPDATE notifications SET is_read=true WHERE user_id=$1', [req.user.id]);
    } else {
      await query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [id, req.user.id]);
    }
    return successResponse(res, null, 'Marked as read');
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};
