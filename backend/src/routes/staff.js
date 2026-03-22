const router = require('express').Router();
const ctrl = require('../controllers/staffController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('admin','superadmin'), ctrl.createStaff);
router.get('/', authenticate, authorize('admin','superadmin','registrar','finance','lecturer'), ctrl.getStaff);
router.put('/:id', authenticate, authorize('admin','superadmin'), ctrl.updateStaff);

module.exports = router;
