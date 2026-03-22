const router = require('express').Router();
const ctrl = require('../controllers/institutionController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/register', ctrl.registerInstitution);
router.get('/', authenticate, authorize('superadmin'), ctrl.getAllInstitutions);
router.get('/dashboard', authenticate, authorize('superadmin'), ctrl.getDashboardStats);
router.get('/:id', authenticate, ctrl.getInstitution);
router.put('/:id', authenticate, authorize('superadmin'), ctrl.updateInstitution);
router.patch('/:id/status', authenticate, authorize('superadmin'), ctrl.toggleStatus);

module.exports = router;
