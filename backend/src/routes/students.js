const router = require('express').Router();
const ctrl = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');
const allow = authenticate, admin = authorize('admin','registrar','superadmin');

router.get('/dashboard', allow, ctrl.getDashboardStats);
router.post('/', allow, admin, ctrl.createStudent);
router.get('/', allow, ctrl.getStudents);
router.get('/:id', allow, ctrl.getStudent);
router.put('/:id', allow, admin, ctrl.updateStudent);

module.exports = router;
