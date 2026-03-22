const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

exports.getInstitutionDashboard = async (req, res) => {
  try {
    const id = req.user.institution_id;
    const [students, staff, payments, attendance, results, announcements] = await Promise.all([
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER(WHERE status='active') as active, COUNT(*) FILTER(WHERE created_at >= NOW()-INTERVAL '30 days') as new_this_month FROM students WHERE institution_id=$1`, [id]),
      query(`SELECT COUNT(*) as total, COUNT(*) FILTER(WHERE is_active=true) as active FROM staff WHERE institution_id=$1`, [id]),
      query(`SELECT COALESCE(SUM(amount),0) as total_collected, COALESCE(SUM(amount) FILTER(WHERE payment_date >= NOW()-INTERVAL '30 days'),0) as this_month, COUNT(*) as transaction_count FROM payments WHERE institution_id=$1`, [id]),
      query(`SELECT ROUND(AVG(CASE WHEN status='present' THEN 100.0 ELSE 0 END),1) as avg_rate FROM attendance WHERE institution_id=$1 AND date >= NOW()-INTERVAL '30 days'`, [id]),
      query(`SELECT COUNT(*) FILTER(WHERE remarks='Fail') as fail_count, COUNT(*) as total FROM results WHERE institution_id=$1`, [id]),
      query(`SELECT COUNT(*) as pending FROM applications WHERE institution_id=$1 AND status='pending'`, [id])
    ]);

    const monthlyPayments = await query(
      `SELECT TO_CHAR(payment_date,'Mon YYYY') as month, SUM(amount) as amount, COUNT(*) as count
       FROM payments WHERE institution_id=$1 AND payment_date >= NOW()-INTERVAL '6 months'
       GROUP BY TO_CHAR(payment_date,'Mon YYYY'), DATE_TRUNC('month',payment_date)
       ORDER BY DATE_TRUNC('month',payment_date)`,
      [id]
    );

    const enrollmentByProgram = await query(
      `SELECT p.name, COUNT(s.id) as count FROM students s JOIN programs p ON s.program_id=p.id
       WHERE s.institution_id=$1 AND s.status='active' GROUP BY p.name ORDER BY count DESC LIMIT 10`,
      [id]
    );

    const recentPayments = await query(
      `SELECT p.receipt_number, p.amount, p.payment_method, p.payment_date,
              s.student_number, u.first_name||' '||u.last_name as student_name
       FROM payments p JOIN students s ON p.student_id=s.id JOIN users u ON s.user_id=u.id
       WHERE p.institution_id=$1 ORDER BY p.payment_date DESC LIMIT 5`,
      [id]
    );

    const feeDefaulters = await query(
      `SELECT COUNT(*) as count FROM (
         SELECT s.id FROM students s
         LEFT JOIN fee_structures fs ON fs.program_id=s.program_id AND fs.institution_id=$1
         LEFT JOIN payments pay ON pay.student_id=s.id
         WHERE s.institution_id=$1 AND s.status='active'
         GROUP BY s.id, fs.total_amount
         HAVING fs.total_amount > COALESCE(SUM(pay.amount),0)
       ) t`,
      [id]
    );

    return successResponse(res, {
      students: students.rows[0],
      staff: staff.rows[0],
      payments: payments.rows[0],
      attendance: attendance.rows[0],
      results: results.rows[0],
      pendingApplications: announcements.rows[0].pending,
      feeDefaulters: feeDefaulters.rows[0].count,
      monthlyPayments: monthlyPayments.rows,
      enrollmentByProgram: enrollmentByProgram.rows,
      recentPayments: recentPayments.rows
    });
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error', 500);
  }
};

exports.getFinancialReport = async (req, res) => {
  try {
    const { academic_year, semester, date_from, date_to } = req.query;
    const id = req.user.institution_id;

    let dateFilter = '';
    let params = [id];
    let idx = 2;
    if (date_from) { dateFilter += ` AND payment_date >= $${idx++}`; params.push(date_from); }
    if (date_to) { dateFilter += ` AND payment_date <= $${idx++}`; params.push(date_to); }
    if (academic_year) { dateFilter += ` AND academic_year = $${idx++}`; params.push(academic_year); }

    const [summary, byMethod, byProgram, trend] = await Promise.all([
      query(`SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as transactions FROM payments WHERE institution_id=$1${dateFilter}`, params),
      query(`SELECT payment_method, SUM(amount) as total, COUNT(*) as count FROM payments WHERE institution_id=$1${dateFilter} GROUP BY payment_method`, params),
      query(`SELECT p.name as program, SUM(pay.amount) as total, COUNT(DISTINCT pay.student_id) as students FROM payments pay JOIN students s ON pay.student_id=s.id JOIN programs p ON s.program_id=p.id WHERE pay.institution_id=$1${dateFilter} GROUP BY p.name ORDER BY total DESC`, params),
      query(`SELECT DATE(payment_date) as date, SUM(amount) as amount FROM payments WHERE institution_id=$1${dateFilter} GROUP BY DATE(payment_date) ORDER BY date DESC LIMIT 30`, params)
    ]);

    return successResponse(res, { summary: summary.rows[0], byMethod: byMethod.rows, byProgram: byProgram.rows, trend: trend.rows });
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const id = req.user.institution_id || null;

    const result = await query(
      `SELECT al.*, u.first_name||' '||u.last_name as user_name, u.email, u.role,
              i.name as institution_name
       FROM audit_logs al LEFT JOIN users u ON al.user_id=u.id LEFT JOIN institutions i ON al.institution_id=i.id
       WHERE ($1::uuid IS NULL OR al.institution_id=$1)
       ORDER BY al.created_at DESC LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};
