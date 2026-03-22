const router = require('express').Router();
const ctrl = require('../controllers/materialsController');
const { authenticate, authorize } = require('../middleware/auth');

const canUpload = authorize('admin', 'lecturer', 'registrar', 'superadmin');

router.post('/', authenticate, canUpload, ctrl.uploadMaterial);
router.get('/', authenticate, ctrl.getMaterials);
router.get('/:id', authenticate, ctrl.getMaterial);
router.delete('/:id', authenticate, ctrl.deleteMaterial);

module.exports = router;
