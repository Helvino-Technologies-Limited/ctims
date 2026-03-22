const { query, getClient } = require('../config/database');
const { successResponse, errorResponse, paginate, generateReceiptNumber } = require('../utils/helpers');

exports.createFeeStructure = async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const { name, program_id, academic_year, semester, total_amount, installments_allowed, installment_count, items } = req.body;

    const result = await client.query(
      `INSERT INTO fee_structures (institution_id,name,program_id,academic_year,semester,total_amount,installments_allowed,installment_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.institution_id, name, program_id, academic_year, semester, total_amount, installments_allowed, installment_count]
    );
    const feeStructure = result.rows[0];

    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(
          'INSERT INTO fee_items (fee_structure_id,name,amount,is_mandatory) VALUES ($1,$2,$3,$4)',
          [feeStructure.id, item.name, item.amount, item.is_mandatory !== false]
        );
      }
    }
    await client.query('COMMIT');
    return successResponse(res, feeStructure, 'Fee structure created', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    return errorResponse(res, 'Server error', 500);
  } finally { client.release(); }
};

exports.getFeeStructures = async (req, res) => {
  try {
    const result = await query(
      `SELECT fs.*, p.name as program_name,
              json_agg(json_build_object('id',fi.id,'name',fi.name,'amount',fi.amount,'is_mandatory',fi.is_mandatory)) as items
       FROM fee_structures fs
       LEFT JOIN programs p ON fs.program_id=p.id
       LEFT JOIN fee_items fi ON fi.fee_structure_id=fs.id
       WHERE fs.institution_id=$1
       GROUP BY fs.id,p.name ORDER BY fs.created_at DESC`,
      [req.user.institution_id]
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.recordPayment = async (req, res) => {
  try {
    const { student_id, fee_structure_id, amount, payment_method, transaction_code, bank_reference, academic_year, semester, notes } = req.body;
    const receiptNumber = await generateReceiptNumber();

    const result = await query(
      `INSERT INTO payments (institution_id,student_id,fee_structure_id,amount,payment_method,transaction_code,
        bank_reference,academic_year,semester,received_by,receipt_number,notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [req.user.institution_id, student_id, fee_structure_id, amount, payment_method, transaction_code,
       bank_reference, academic_year, semester, req.user.id, receiptNumber, notes]
    );

    // Create notification
    await query(
      `INSERT INTO notifications (institution_id,user_id,title,message,type)
       SELECT $1, u.id, 'Payment Received', $2, 'success'
       FROM students s JOIN users u ON s.user_id=u.id WHERE s.id=$3`,
      [req.user.institution_id, `Payment of KES ${amount} received. Receipt: ${receiptNumber}`, student_id]
    );

    return successResponse(res, result.rows[0], 'Payment recorded', 201);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error', 500);
  }
};

exports.getPayments = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit);
    const { student_id, payment_method, academic_year, semester, search } = req.query;

    let cond = ['p.institution_id=$1'];
    let params = [req.user.institution_id];
    let idx = 2;

    // Students can only see their own payments
    if (req.user.role === 'student') {
      cond.push(`p.student_id=$${idx++}`);
      params.push(req.user.student_id);
    } else if (student_id) { cond.push(`p.student_id=$${idx++}`); params.push(student_id); }
    if (payment_method) { cond.push(`p.payment_method=$${idx++}`); params.push(payment_method); }
    if (academic_year) { cond.push(`p.academic_year=$${idx++}`); params.push(academic_year); }
    if (semester) { cond.push(`p.semester=$${idx++}`); params.push(semester); }
    if (search) { cond.push(`(s.student_number ILIKE $${idx} OR p.receipt_number ILIKE $${idx} OR p.transaction_code ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

    const result = await query(
      `SELECT p.*, s.student_number, u.first_name||' '||u.last_name as student_name,
              fs.name as fee_structure_name,
              rb.first_name||' '||rb.last_name as received_by_name
       FROM payments p
       JOIN students s ON p.student_id=s.id JOIN users u ON s.user_id=u.id
       LEFT JOIN fee_structures fs ON p.fee_structure_id=fs.id
       LEFT JOIN users rb ON p.received_by=rb.id
       WHERE ${cond.join(' AND ')}
       ORDER BY p.payment_date DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, limit, offset]
    );
    const countResult = await query(`SELECT COUNT(*) FROM payments p JOIN students s ON p.student_id=s.id JOIN users u ON s.user_id=u.id WHERE ${cond.join(' AND ')}`, params);

    const summary = await query(
      `SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count,
              COALESCE(SUM(amount) FILTER(WHERE payment_method='mpesa'),0) as mpesa_total,
              COALESCE(SUM(amount) FILTER(WHERE payment_method='cash'),0) as cash_total,
              COALESCE(SUM(amount) FILTER(WHERE payment_method='bank'),0) as bank_total
       FROM payments WHERE institution_id=$1`,
      [req.user.institution_id]
    );

    return successResponse(res, { payments: result.rows, total: parseInt(countResult.rows[0].count), page, limit, summary: summary.rows[0] });
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.getStudentBalance = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { academic_year, semester } = req.query;

    // Students can only view their own balance
    if (req.user.role === 'student' && req.user.student_id !== student_id) {
      return errorResponse(res, 'Access denied', 403);
    }

    const student = await query(`SELECT s.*, p.name as program_name FROM students s JOIN programs p ON s.program_id=p.id WHERE s.id=$1 AND s.institution_id=$2`, [student_id, req.user.institution_id]);
    if (!student.rows[0]) return errorResponse(res, 'Student not found', 404);

    const feeStructure = await query(
      `SELECT fs.*, COALESCE(SUM(fi.amount),0) as computed_total FROM fee_structures fs LEFT JOIN fee_items fi ON fi.fee_structure_id=fs.id WHERE fs.program_id=$1 AND fs.academic_year=$2 AND fs.semester=$3 AND fs.institution_id=$4 GROUP BY fs.id LIMIT 1`,
      [student.rows[0].program_id, academic_year, semester, req.user.institution_id]
    );

    const paid = await query(
      `SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE student_id=$1 AND academic_year=$2 AND semester=$3`,
      [student_id, academic_year, semester]
    );

    const totalDue = feeStructure.rows[0]?.total_amount || 0;
    const totalPaid = parseFloat(paid.rows[0].total);
    const balance = totalDue - totalPaid;

    return successResponse(res, {
      student: student.rows[0],
      fee_structure: feeStructure.rows[0],
      total_due: totalDue,
      total_paid: totalPaid,
      balance,
      status: balance <= 0 ? 'cleared' : balance < totalDue ? 'partial' : 'unpaid'
    });
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.getFeeDefaulters = async (req, res) => {
  try {
    const { academic_year, semester } = req.query;
    const result = await query(
      `SELECT s.id, s.student_number, u.first_name||' '||u.last_name as name, u.phone,
              p.name as program_name, fs.total_amount as fee_due,
              COALESCE(SUM(pay.amount),0) as paid,
              fs.total_amount - COALESCE(SUM(pay.amount),0) as balance
       FROM students s
       JOIN users u ON s.user_id=u.id
       LEFT JOIN programs p ON s.program_id=p.id
       LEFT JOIN fee_structures fs ON fs.program_id=s.program_id AND fs.academic_year=$2 AND fs.semester=$3 AND fs.institution_id=$4
       LEFT JOIN payments pay ON pay.student_id=s.id AND pay.academic_year=$2 AND pay.semester=$3
       WHERE s.institution_id=$1 AND s.status='active'
       GROUP BY s.id,s.student_number,u.first_name,u.last_name,u.phone,p.name,fs.total_amount
       HAVING fs.total_amount - COALESCE(SUM(pay.amount),0) > 0
       ORDER BY balance DESC`,
      [req.user.institution_id, academic_year, semester, req.user.institution_id]
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};
