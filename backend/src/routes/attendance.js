const router = require('express').Router();
const ctrl = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');
const staffOnly = authorize('admin','lecturer','superadmin','registrar');

router.post('/', authenticate, staffOnly, ctrl.markAttendance);
router.get('/', authenticate, ctrl.getAttendance);
router.get('/summary', authenticate, staffOnly, ctrl.getAttendanceSummary);
router.get('/students', authenticate, staffOnly, ctrl.getStudentsForAttendance);

module.exports = router;
