const router = require('express').Router();
const ctrl = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, ctrl.markAttendance);
router.get('/', authenticate, ctrl.getAttendance);
router.get('/summary', authenticate, ctrl.getAttendanceSummary);
router.get('/students', authenticate, ctrl.getStudentsForAttendance);

module.exports = router;
