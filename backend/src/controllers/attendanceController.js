const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

exports.markAttendance = async (req, res) => {
  try {
    const { unit_id, date, attendance_records, timetable_id } = req.body;
    const institutionId = req.user.institution_id;

    const results = [];
    for (const record of attendance_records) {
      const { student_id, status, notes } = record;
      const result = await query(
        `INSERT INTO attendance (institution_id, unit_id, student_id, timetable_id, date, status, marked_by, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (unit_id, student_id, date) DO UPDATE SET status=$6, notes=$8, marked_by=$7
         RETURNING *`,
        [institutionId, unit_id, student_id, timetable_id, date, status, req.user.id, notes]
      );
      results.push(result.rows[0]);
    }
    return successResponse(res, results, 'Attendance marked');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error', 500);
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const { unit_id, student_id, date_from, date_to, program_id } = req.query;
    const institutionId = req.user.institution_id;

    let cond = ['a.institution_id=$1'];
    let params = [institutionId];
    let idx = 2;

    if (unit_id) { cond.push(`a.unit_id=$${idx++}`); params.push(unit_id); }

    // Students can only see their own attendance
    if (req.user.role === 'student') {
      cond.push(`a.student_id=$${idx++}`);
      params.push(req.user.student_id);
    } else if (student_id) { cond.push(`a.student_id=$${idx++}`); params.push(student_id); }
    if (date_from) { cond.push(`a.date >= $${idx++}`); params.push(date_from); }
    if (date_to) { cond.push(`a.date <= $${idx++}`); params.push(date_to); }

    const result = await query(
      `SELECT a.*, u.first_name||' '||u.last_name as student_name, s.student_number,
              un.name as unit_name, un.code as unit_code
       FROM attendance a
       JOIN students st ON a.student_id=st.id JOIN users u ON st.user_id=u.id
       LEFT JOIN units un ON a.unit_id=un.id
       LEFT JOIN students s ON a.student_id=s.id
       WHERE ${cond.join(' AND ')} ORDER BY a.date DESC, u.first_name`,
      params
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { unit_id, program_id, academic_year } = req.query;
    const institutionId = req.user.institution_id;

    const result = await query(
      `SELECT s.id as student_id, s.student_number, u.first_name||' '||u.last_name as name,
              COUNT(*) as total_classes,
              COUNT(*) FILTER(WHERE a.status='present') as present,
              COUNT(*) FILTER(WHERE a.status='absent') as absent,
              COUNT(*) FILTER(WHERE a.status='late') as late,
              ROUND(COUNT(*) FILTER(WHERE a.status='present') * 100.0 / NULLIF(COUNT(*),0),1) as attendance_rate
       FROM attendance a
       JOIN students s ON a.student_id=s.id JOIN users u ON s.user_id=u.id
       WHERE a.institution_id=$1 ${unit_id ? 'AND a.unit_id=$2' : ''}
       GROUP BY s.id,s.student_number,u.first_name,u.last_name
       ORDER BY attendance_rate ASC`,
      unit_id ? [institutionId, unit_id] : [institutionId]
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.getStudentsForAttendance = async (req, res) => {
  try {
    const { unit_id, date } = req.query;
    const institutionId = req.user.institution_id;

    const result = await query(
      `SELECT s.id as student_id, s.student_number, u.first_name||' '||u.last_name as name,
              a.status as today_status
       FROM students s
       JOIN users u ON s.user_id=u.id
       LEFT JOIN attendance a ON a.student_id=s.id AND a.unit_id=$2 AND a.date=$3
       WHERE s.institution_id=$1 AND s.status='active'
       ORDER BY u.first_name`,
      [institutionId, unit_id, date]
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};
