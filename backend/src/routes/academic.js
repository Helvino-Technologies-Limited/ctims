const router = require('express').Router();
const ctrl = require('../controllers/academicController');
const { authenticate, authorize } = require('../middleware/auth');
const admin = authorize('admin','registrar','superadmin');

router.post('/departments', authenticate, admin, ctrl.createDepartment);
router.get('/departments', authenticate, ctrl.getDepartments);
router.put('/departments/:id', authenticate, admin, ctrl.updateDepartment);

router.post('/programs', authenticate, admin, ctrl.createProgram);
router.get('/programs', authenticate, ctrl.getPrograms);
router.put('/programs/:id', authenticate, admin, ctrl.updateProgram);

router.post('/units', authenticate, admin, ctrl.createUnit);
router.get('/units', authenticate, ctrl.getUnits);

router.post('/intakes', authenticate, admin, ctrl.createIntake);
router.get('/intakes', authenticate, ctrl.getIntakes);

router.post('/timetable', authenticate, admin, ctrl.createTimetable);
router.get('/timetable', authenticate, ctrl.getTimetable);

module.exports = router;
