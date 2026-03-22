const { query } = require('../config/database');
const { successResponse, errorResponse, calculateGrade } = require('../utils/helpers');

// Lecturer: save questions for an online exam (replaces all existing)
exports.saveQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const { questions } = req.body;

    const exam = await query(
      'SELECT * FROM exams WHERE id=$1 AND institution_id=$2',
      [id, req.user.institution_id]
    );
    if (!exam.rows[0]) return errorResponse(res, 'Exam not found', 404);

    await query('DELETE FROM exam_questions WHERE exam_id=$1', [id]);
    const saved = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const r = await query(
        `INSERT INTO exam_questions (exam_id, institution_id, question_text, question_type, options, correct_answer, marks, order_num)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [id, req.user.institution_id, q.question_text, q.question_type || 'mcq',
         JSON.stringify(q.options || []), q.correct_answer, q.marks || 1, i + 1]
      );
      saved.push(r.rows[0]);
    }
    // update exam to mark as online and set total marks from questions
    const totalMarks = questions.reduce((s, q) => s + parseFloat(q.marks || 1), 0);
    await query('UPDATE exams SET is_online=true, total_marks=$1 WHERE id=$2', [totalMarks, id]);

    return successResponse(res, saved, 'Questions saved');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error', 500);
  }
};

// Get questions — lecturers/admin see correct answers, students don't
exports.getQuestions = async (req, res) => {
  try {
    const { id } = req.params;
    const isStaff = ['admin', 'lecturer', 'registrar', 'superadmin'].includes(req.user.role);

    const result = await query(
      `SELECT id, question_text, question_type, options, marks, order_num
       ${isStaff ? ', correct_answer' : ''}
       FROM exam_questions WHERE exam_id=$1 ORDER BY order_num`,
      [id]
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

// Student: start the exam — creates submission record
exports.startExam = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user.student_id) return errorResponse(res, 'Only students can take exams', 403);

    const exam = await query(
      'SELECT * FROM exams WHERE id=$1 AND institution_id=$2',
      [id, req.user.institution_id]
    );
    if (!exam.rows[0]) return errorResponse(res, 'Exam not found', 404);
    if (!exam.rows[0].is_online) return errorResponse(res, 'Not an online exam', 400);

    // Check if already submitted
    const existing = await query(
      'SELECT * FROM exam_submissions WHERE exam_id=$1 AND student_id=$2',
      [id, req.user.student_id]
    );
    if (existing.rows[0]) {
      return successResponse(res, existing.rows[0]);
    }

    const qCount = await query('SELECT COUNT(*) FROM exam_questions WHERE exam_id=$1', [id]);
    const maxScore = await query('SELECT COALESCE(SUM(marks),0) as total FROM exam_questions WHERE exam_id=$1', [id]);

    const submission = await query(
      `INSERT INTO exam_submissions (exam_id, student_id, institution_id, max_score)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [id, req.user.student_id, req.user.institution_id, maxScore.rows[0].total]
    );
    return successResponse(res, { ...submission.rows[0], question_count: qCount.rows[0].count }, 'Exam started', 201);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error', 500);
  }
};

// Student: submit answers
exports.submitExam = async (req, res) => {
  try {
    const { id } = req.params; // exam_id
    const { answers } = req.body; // [{ question_id, answer }]
    if (!req.user.student_id) return errorResponse(res, 'Only students can submit exams', 403);

    const submission = await query(
      'SELECT * FROM exam_submissions WHERE exam_id=$1 AND student_id=$2',
      [id, req.user.student_id]
    );
    if (!submission.rows[0]) return errorResponse(res, 'Submission not found — start the exam first', 404);
    if (submission.rows[0].status === 'submitted') return errorResponse(res, 'Already submitted', 400);

    const questions = await query(
      'SELECT * FROM exam_questions WHERE exam_id=$1',
      [id]
    );
    const qMap = {};
    questions.rows.forEach((q) => { qMap[q.id] = q; });

    let totalScore = 0;
    for (const ans of answers) {
      const q = qMap[ans.question_id];
      if (!q) continue;
      let isCorrect = null;
      let score = 0;
      if (q.question_type !== 'essay' && q.correct_answer) {
        isCorrect = ans.answer?.toLowerCase() === q.correct_answer.toLowerCase();
        score = isCorrect ? parseFloat(q.marks) : 0;
        totalScore += score;
      }
      await query(
        `INSERT INTO exam_answers (submission_id, question_id, answer, is_correct, score)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT DO NOTHING`,
        [submission.rows[0].id, ans.question_id, ans.answer, isCorrect, score]
      );
    }

    const maxScore = parseFloat(submission.rows[0].max_score);
    const hasEssay = questions.rows.some((q: any) => q.question_type === 'essay');

    await query(
      `UPDATE exam_submissions SET status=$1, submitted_at=NOW(), total_score=$2 WHERE id=$3`,
      [hasEssay ? 'pending_grading' : 'submitted', totalScore, submission.rows[0].id]
    );

    // Auto-save to results table for non-essay exams
    if (!hasEssay) {
      const exam = await query('SELECT * FROM exams WHERE id=$1', [id]);
      const ex = exam.rows[0];
      const pct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
      const examMarks = Math.round(pct * (ex.total_marks || 100) / 100);
      const gradeInfo = calculateGrade(examMarks, ex.total_marks || 100);
      await query(
        `INSERT INTO results (institution_id, exam_id, student_id, unit_id, cat_marks, exam_marks, total_marks, grade, grade_points, remarks, entered_by)
         VALUES ($1,$2,$3,$4,0,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (exam_id, student_id) DO UPDATE SET exam_marks=$5, total_marks=$6, grade=$7, grade_points=$8, remarks=$9, updated_at=NOW()`,
        [req.user.institution_id, id, req.user.student_id, ex.unit_id,
         examMarks, examMarks, gradeInfo.grade, gradeInfo.points, gradeInfo.remarks, req.user.id]
      );
    }

    return successResponse(res, {
      total_score: totalScore,
      max_score: maxScore,
      percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
      pending_grading: hasEssay
    }, 'Exam submitted');
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error', 500);
  }
};

// Get student's submission for an exam
exports.getMySubmission = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.user.student_id) return errorResponse(res, 'Students only', 403);
    const sub = await query(
      `SELECT s.*,
              json_agg(json_build_object('question_id', a.question_id, 'answer', a.answer, 'is_correct', a.is_correct, 'score', a.score) ORDER BY a.created_at) FILTER (WHERE a.id IS NOT NULL) as answers
       FROM exam_submissions s LEFT JOIN exam_answers a ON a.submission_id=s.id
       WHERE s.exam_id=$1 AND s.student_id=$2 GROUP BY s.id`,
      [id, req.user.student_id]
    );
    return successResponse(res, sub.rows[0] || null);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

// Lecturer: get all submissions for an exam
exports.getSubmissions = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT es.*, u.first_name||' '||u.last_name as student_name, s.student_number
       FROM exam_submissions es
       JOIN students s ON es.student_id=s.id JOIN users u ON s.user_id=u.id
       WHERE es.exam_id=$1 AND es.institution_id=$2
       ORDER BY es.submitted_at DESC`,
      [id, req.user.institution_id]
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};
