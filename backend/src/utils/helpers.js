const { query } = require('../config/database');

const generateStudentNumber = async (institutionId) => {
  const year = new Date().getFullYear().toString().slice(-2);
  const result = await query(
    'SELECT COUNT(*) FROM students WHERE institution_id = $1',
    [institutionId]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `STU${year}${String(count).padStart(5, '0')}`;
};

const generateReceiptNumber = async () => {
  const result = await query('SELECT COUNT(*) FROM payments');
  const count = parseInt(result.rows[0].count) + 1;
  return `RCP${Date.now().toString().slice(-6)}${String(count).padStart(4, '0')}`;
};

const generateApplicationNumber = async () => {
  const result = await query('SELECT COUNT(*) FROM applications');
  const count = parseInt(result.rows[0].count) + 1;
  return `APP${Date.now().toString().slice(-6)}${String(count).padStart(4, '0')}`;
};

const calculateGrade = (totalMarks, totalPossible = 100) => {
  const pct = (totalMarks / totalPossible) * 100;
  if (pct >= 70) return { grade: 'A', points: 4.0, remarks: 'Distinction' };
  if (pct >= 60) return { grade: 'B', points: 3.0, remarks: 'Credit' };
  if (pct >= 50) return { grade: 'C', points: 2.0, remarks: 'Pass' };
  if (pct >= 40) return { grade: 'D', points: 1.0, remarks: 'Pass' };
  return { grade: 'E', points: 0.0, remarks: 'Fail' };
};

const paginate = (page = 1, limit = 20) => {
  const p = parseInt(page);
  const l = parseInt(limit);
  return { limit: l, offset: (p - 1) * l, page: p };
};

const successResponse = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

const errorResponse = (res, message = 'Error', statusCode = 400, errors = null) =>
  res.status(statusCode).json({ success: false, message, errors });

module.exports = {
  generateStudentNumber, generateReceiptNumber, generateApplicationNumber,
  calculateGrade, paginate, successResponse, errorResponse
};
