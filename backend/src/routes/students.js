const router = require('express').Router();
const ctrl = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');
const admin = authorize('admin','registrar','superadmin');
const staffOnly = authorize('admin','registrar','superadmin','finance','lecturer');

router.get('/dashboard', authenticate, staffOnly, ctrl.getDashboardStats);
router.post('/', authenticate, admin, ctrl.createStudent);
router.get('/', authenticate, staffOnly, ctrl.getStudents);
router.get('/:id', authenticate, ctrl.getStudent);
router.put('/:id', authenticate, admin, ctrl.updateStudent);

module.exports = router;
