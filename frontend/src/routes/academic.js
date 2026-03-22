
router.put('/units/:id', authenticate, admin, async (req, res) => {
  const { query } = require('../config/database');
  const { successResponse, errorResponse } = require('../utils/helpers');
  try {
    const { id } = req.params;
    const { name, code, program_id, credit_hours, semester, year_of_study, is_active } = req.body;
    const result = await query(
      'UPDATE units SET name=$1,code=$2,program_id=$3,credit_hours=$4,semester=$5,year_of_study=$6,is_active=$7 WHERE id=$8 AND institution_id=$9 RETURNING *',
      [name, code, program_id, credit_hours, semester, year_of_study, is_active, id, req.user.institution_id]
    );
    return successResponse(res, result.rows[0], 'Unit updated');
  } catch (err) { return errorResponse(res, 'Server error', 500); }
});
