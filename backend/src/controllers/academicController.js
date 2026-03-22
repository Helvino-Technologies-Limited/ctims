const { query } = require('../config/database');
const { successResponse, errorResponse } = require('../utils/helpers');

// DEPARTMENTS
exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const result = await query(
      'INSERT INTO departments (institution_id,name,code,description) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.user.institution_id, name, code, description]
    );
    return successResponse(res, result.rows[0], 'Department created', 201);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.getDepartments = async (req, res) => {
  try {
    const result = await query(
      `SELECT d.*, u.first_name||' '||u.last_name as head_name, COUNT(DISTINCT p.id) as program_count
       FROM departments d LEFT JOIN users u ON d.head_id=u.id LEFT JOIN programs p ON p.department_id=d.id
       WHERE d.institution_id=$1 GROUP BY d.id,u.first_name,u.last_name ORDER BY d.name`,
      [req.user.institution_id]
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, head_id } = req.body;
    const result = await query(
      'UPDATE departments SET name=$1,code=$2,description=$3,head_id=$4 WHERE id=$5 AND institution_id=$6 RETURNING *',
      [name, code, description, head_id, id, req.user.institution_id]
    );
    return successResponse(res, result.rows[0], 'Department updated');
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

// PROGRAMS
exports.createProgram = async (req, res) => {
  try {
    const { name, code, department_id, level, duration_months, description, requirements } = req.body;
    const result = await query(
      'INSERT INTO programs (institution_id,name,code,department_id,level,duration_months,description,requirements) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [req.user.institution_id, name, code, department_id, level, duration_months, description, requirements]
    );
    return successResponse(res, result.rows[0], 'Program created', 201);
  } catch (err) { return errorResponse(res, err.message, 500); }
};

exports.getPrograms = async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, d.name as department_name, COUNT(DISTINCT s.id) as student_count, COUNT(DISTINCT u.id) as unit_count
       FROM programs p LEFT JOIN departments d ON p.department_id=d.id
       LEFT JOIN students s ON s.program_id=p.id AND s.status='active'
       LEFT JOIN units u ON u.program_id=p.id
       WHERE p.institution_id=$1 GROUP BY p.id,d.name ORDER BY p.name`,
      [req.user.institution_id]
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, department_id, level, duration_months, description, requirements, is_active } = req.body;
    const result = await query(
      'UPDATE programs SET name=$1,code=$2,department_id=$3,level=$4,duration_months=$5,description=$6,requirements=$7,is_active=$8 WHERE id=$9 AND institution_id=$10 RETURNING *',
      [name, code, department_id, level, duration_months, description, requirements, is_active, id, req.user.institution_id]
    );
    return successResponse(res, result.rows[0], 'Program updated');
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

// UNITS
exports.createUnit = async (req, res) => {
  try {
    const { name, code, program_id, credit_hours, semester, year_of_study } = req.body;
    const result = await query(
      'INSERT INTO units (institution_id,name,code,program_id,credit_hours,semester,year_of_study) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [req.user.institution_id, name, code, program_id, credit_hours, semester, year_of_study]
    );
    return successResponse(res, result.rows[0], 'Unit created', 201);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.getUnits = async (req, res) => {
  try {
    const { program_id } = req.query;
    let cond = 'u.institution_id=$1';
    let params = [req.user.institution_id];
    if (program_id) { cond += ' AND u.program_id=$2'; params.push(program_id); }
    const result = await query(
      `SELECT u.*, p.name as program_name FROM units u LEFT JOIN programs p ON u.program_id=p.id WHERE ${cond} ORDER BY u.year_of_study,u.semester,u.name`,
      params
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

// INTAKES
exports.createIntake = async (req, res) => {
  try {
    const { name, program_id, start_date, end_date, capacity } = req.body;
    const result = await query(
      'INSERT INTO intakes (institution_id,name,program_id,start_date,end_date,capacity) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.user.institution_id, name, program_id, start_date, end_date, capacity]
    );
    return successResponse(res, result.rows[0], 'Intake created', 201);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.getIntakes = async (req, res) => {
  try {
    const { program_id } = req.query;
    const cond = ['i.institution_id=$1'];
    const params = [req.user.institution_id];
    if (program_id) { cond.push('i.program_id=$2'); params.push(program_id); }
    const result = await query(
      `SELECT i.*, p.name as program_name, COUNT(s.id) as enrolled_count
       FROM intakes i LEFT JOIN programs p ON i.program_id=p.id LEFT JOIN students s ON s.intake_id=i.id
       WHERE ${cond.join(' AND ')} GROUP BY i.id,p.name ORDER BY i.start_date DESC`,
      params
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.updateIntake = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, program_id, start_date, end_date, capacity, status } = req.body;
    const result = await query(
      `UPDATE intakes SET name=$1,program_id=$2,start_date=$3,end_date=$4,capacity=$5,status=$6
       WHERE id=$7 AND institution_id=$8 RETURNING *`,
      [name, program_id, start_date, end_date, capacity, status || 'open', id, req.user.institution_id]
    );
    if (!result.rows[0]) return errorResponse(res, 'Intake not found', 404);
    return successResponse(res, result.rows[0], 'Intake updated');
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

// TIMETABLE
exports.createTimetable = async (req, res) => {
  try {
    const { unit_id, lecturer_id, program_id, day_of_week, start_time, end_time, room, academic_year, semester } = req.body;
    const result = await query(
      'INSERT INTO timetable (institution_id,unit_id,lecturer_id,program_id,day_of_week,start_time,end_time,room,academic_year,semester) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [req.user.institution_id, unit_id, lecturer_id, program_id, day_of_week, start_time, end_time, room, academic_year, semester]
    );
    return successResponse(res, result.rows[0], 'Timetable entry created', 201);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.getTimetable = async (req, res) => {
  try {
    const { program_id, lecturer_id, academic_year, semester } = req.query;
    let cond = ['t.institution_id=$1'];
    let params = [req.user.institution_id];
    let idx = 2;
    if (program_id) { cond.push(`t.program_id=$${idx++}`); params.push(program_id); }
    if (lecturer_id) { cond.push(`t.lecturer_id=$${idx++}`); params.push(lecturer_id); }
    if (academic_year) { cond.push(`t.academic_year=$${idx++}`); params.push(academic_year); }
    if (semester) { cond.push(`t.semester=$${idx++}`); params.push(semester); }

    const result = await query(
      `SELECT t.*, u.name as unit_name, u.code as unit_code,
              usr.first_name||' '||usr.last_name as lecturer_name, p.name as program_name
       FROM timetable t
       LEFT JOIN units u ON t.unit_id=u.id
       LEFT JOIN staff s ON t.lecturer_id=s.id LEFT JOIN users usr ON s.user_id=usr.id
       LEFT JOIN programs p ON t.program_id=p.id
       WHERE ${cond.join(' AND ')}
       ORDER BY CASE day_of_week WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 ELSE 6 END, t.start_time`,
      params
    );
    return successResponse(res, result.rows);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};
