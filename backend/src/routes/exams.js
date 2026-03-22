const router = require('express').Router();
const ctrl = require('../controllers/examController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('admin','lecturer','registrar','superadmin'), ctrl.createExam);
router.get('/', authenticate, ctrl.getExams);
router.post('/results', authenticate, authorize('admin','lecturer','registrar'), ctrl.enterResults);
router.get('/results', authenticate, ctrl.getResults);
router.get('/transcript/:student_id', authenticate, ctrl.getStudentTranscript);

module.exports = router;
