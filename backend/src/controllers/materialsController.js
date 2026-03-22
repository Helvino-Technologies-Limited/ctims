const { query } = require('../config/database');
const { successResponse, errorResponse, paginate } = require('../utils/helpers');

exports.uploadMaterial = async (req, res) => {
  try {
    const { title, description, unit_id, material_type, file_name, file_type, file_size, file_data } = req.body;
    if (!title) return errorResponse(res, 'Title is required');
    if (!file_data) return errorResponse(res, 'File data is required');
    // ~60MB base64 limit (~45MB actual file)
    if (file_data.length > 60 * 1024 * 1024) return errorResponse(res, 'File too large. Max 45MB.');

    const result = await query(
      `INSERT INTO learning_materials
         (institution_id, unit_id, uploaded_by, title, description, file_name, file_type, file_size, file_data, material_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id,title,description,unit_id,file_name,file_type,file_size,material_type,download_count,created_at`,
      [req.user.institution_id, unit_id || null, req.user.id,
       title, description, file_name, file_type, file_size, file_data, material_type || 'document']
    );
    return successResponse(res, result.rows[0], 'Material uploaded', 201);
  } catch (err) {
    console.error(err);
    return errorResponse(res, 'Server error', 500);
  }
};

exports.getMaterials = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query.page, req.query.limit || 30);
    const { unit_id, search, material_type } = req.query;

    let cond = ['m.institution_id=$1', 'm.is_active=true'];
    let params = [req.user.institution_id];
    let idx = 2;

    if (unit_id) { cond.push(`m.unit_id=$${idx++}`); params.push(unit_id); }
    if (material_type) { cond.push(`m.material_type=$${idx++}`); params.push(material_type); }
    if (search) {
      cond.push(`(m.title ILIKE $${idx} OR m.description ILIKE $${idx} OR un.name ILIKE $${idx} OR un.code ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const result = await query(
      `SELECT m.id, m.title, m.description, m.file_name, m.file_type, m.file_size,
              m.material_type, m.download_count, m.created_at,
              m.unit_id, un.name as unit_name, un.code as unit_code,
              u.first_name||' '||u.last_name as uploaded_by_name
       FROM learning_materials m
       LEFT JOIN units un ON m.unit_id=un.id
       LEFT JOIN users u ON m.uploaded_by=u.id
       WHERE ${cond.join(' AND ')}
       ORDER BY m.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, limit, offset]
    );
    const countResult = await query(
      `SELECT COUNT(*) FROM learning_materials m LEFT JOIN units un ON m.unit_id=un.id WHERE ${cond.join(' AND ')}`,
      params
    );
    return successResponse(res, { materials: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.getMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT m.*, un.name as unit_name, un.code as unit_code,
              u.first_name||' '||u.last_name as uploaded_by_name
       FROM learning_materials m
       LEFT JOIN units un ON m.unit_id=un.id LEFT JOIN users u ON m.uploaded_by=u.id
       WHERE m.id=$1 AND m.institution_id=$2 AND m.is_active=true`,
      [id, req.user.institution_id]
    );
    if (!result.rows[0]) return errorResponse(res, 'Material not found', 404);
    // Increment download count
    await query('UPDATE learning_materials SET download_count=download_count+1 WHERE id=$1', [id]);
    return successResponse(res, result.rows[0]);
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE learning_materials SET is_active=false WHERE id=$1 AND institution_id=$2
       AND (uploaded_by=$3 OR $4 IN ('admin','superadmin','registrar'))
       RETURNING id`,
      [id, req.user.institution_id, req.user.id, req.user.role]
    );
    if (!result.rows[0]) return errorResponse(res, 'Not found or not authorized', 404);
    return successResponse(res, null, 'Material deleted');
  } catch (err) { return errorResponse(res, 'Server error', 500); }
};
