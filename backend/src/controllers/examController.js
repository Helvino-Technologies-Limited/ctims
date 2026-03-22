const { query } = require('../config/database');
const { successResponse, errorResponse, paginate, calculateGrade } = require('../utils/helpers');

exports.createExam = async (req, res) => {
  try {
    const { unit_id, program_id, name, exam_type, exam_date, start_time, end_time, venue, total_marks, pass_mark, academic_year, semester } = req.body;
    const result = await query(
      `INSERT INTO exams (institution_id,unit_id,program_id,name,exam_type,exam_date,start_time,end_time,venue,total_marks,pass_mark,academic_year,semester,created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [req.user.institution_id, unit_id, program_id, name, exam_type, exam_date, start_time, end_time, venue, total_marks || 100, pass_mark || 40, academic_year, semester, req.user.id]
    );
    return successResponse(res, result.rows[0], 'Exam created', 201);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.getExams = async (req, res) => {
  try {
    const { program_id, unit_id, academic_year, semester, status } = req.query;
    let cond = ['e.institution_id=$1'];
    let params = [req.user.institution_id];
    let idx = 2;
    if (program_id) { cond.push(`e.program_id=$${idx++}`); params.push(program_id); }
    if (unit_id) { cond.push(`e.unit_id=$${idx++}`); params.push(unit_id); }
    if (academic_year) { cond.push(`e.academic_year=$${idx++}`); params.push(academic_year); }
    if (status) { cond.push(`e.status=$${idx++}`); params.push(status); }

    const result = await query(
      `SELECT e.*, u.name as unit_name, u.code as unit_code, p.name as program_name,
              COUNT(r.id) as results_count
       FROM exams e LEFT JOIN units u ON e.unit_id=u.id LEFT JOIN programs p ON e.program_id=p.id
       LEFT JOIN results r ON r.exam_id=e.id
       WHERE ${cond.join(' AND ')} GROUP BY e.id,u.name,u.code,p.name ORDER BY e.exam_date DESC`,
      params
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.enterResults = async (req, res) => {
  try {
    const { exam_id, results } = req.body;
    const exam = await query('SELECT * FROM exams WHERE id=$1 AND institution_id=$2', [exam_id, req.user.institution_id]);
    if (!exam.rows[0]) return errorResponse(res, 'Exam not found', 404);

    const saved = [];
    for (const r of results) {
      const total = parseFloat(r.cat_marks || 0) + parseFloat(r.exam_marks || 0);
      const gradeInfo = calculateGrade(total);

      const result = await query(
        `INSERT INTO results (institution_id,exam_id,student_id,unit_id,cat_marks,exam_marks,total_marks,grade,grade_points,remarks,entered_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (exam_id,student_id) DO UPDATE SET cat_marks=$5,exam_marks=$6,total_marks=$7,grade=$8,grade_points=$9,remarks=$10,entered_by=$11,updated_at=NOW()
         RETURNING *`,
        [req.user.institution_id, exam_id, r.student_id, exam.rows[0].unit_id, r.cat_marks || 0, r.exam_marks || 0, total, gradeInfo.grade, gradeInfo.points, gradeInfo.remarks, req.user.id]
      );
      saved.push(result.rows[0]);
    }
    await query('UPDATE exams SET status=$1 WHERE id=$2', ['completed', exam_id]);
    return successResponse(res, saved, 'Results entered');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error', 500);
  }
};

exports.getResults = async (req, res) => {
  try {
    const { exam_id, student_id, unit_id, program_id, academic_year } = req.query;
    let cond = ['r.institution_id=$1'];
    let params = [req.user.institution_id];
    let idx = 2;
    if (exam_id) { cond.push(`r.exam_id=$${idx++}`); params.push(exam_id); }
    if (student_id) { cond.push(`r.student_id=$${idx++}`); params.push(student_id); }
    if (unit_id) { cond.push(`r.unit_id=$${idx++}`); params.push(unit_id); }

    const result = await query(
      `SELECT r.*, s.student_number, u.first_name||' '||u.last_name as student_name,
              un.name as unit_name, un.code as unit_code,
              e.name as exam_name, e.exam_type, e.academic_year, e.semester
       FROM results r
       JOIN students s ON r.student_id=s.id JOIN users u ON s.user_id=u.id
       LEFT JOIN units un ON r.unit_id=un.id LEFT JOIN exams e ON r.exam_id=e.id
       WHERE ${cond.join(' AND ')} ORDER BY r.created_at DESC`,
      params
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.getStudentTranscript = async (req, res) => {
  try {
    const { student_id } = req.params;
    const student = await query(
      `SELECT s.*, u.first_name, u.last_name, u.email, p.name as program_name, p.code as program_code
       FROM students s JOIN users u ON s.user_id=u.id JOIN programs p ON s.program_id=p.id
       WHERE s.id=$1 AND s.institution_id=$2`,
      [student_id, req.user.institution_id]
    );
    if (!student.rows[0]) return errorResponse(res, 'Student not found', 404);

    const results = await query(
      `SELECT r.*, un.name as unit_name, un.code as unit_code, un.credit_hours,
              e.exam_type, e.academic_year, e.semester
       FROM results r
       JOIN units un ON r.unit_id=un.id JOIN exams e ON r.exam_id=e.id
       WHERE r.student_id=$1 ORDER BY e.academic_year, e.semester, un.name`,
      [student_id]
    );

    const gpa = results.rows.length > 0
      ? (results.rows.reduce((acc, r) => acc + parseFloat(r.grade_points), 0) / results.rows.length).toFixed(2)
      : 0;

    return successResponse(res, { student: student.rows[0], results: results.rows, gpa });
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};
