const router = require('express').Router();
const ctrl = require('../controllers/examController');
const onlineCtrl = require('../controllers/onlineExamController');
const { authenticate, authorize } = require('../middleware/auth');

const staff = authorize('admin', 'lecturer', 'registrar', 'superadmin');

router.post('/', authenticate, staff, ctrl.createExam);
router.get('/', authenticate, ctrl.getExams);
router.post('/results', authenticate, staff, ctrl.enterResults);
router.get('/results', authenticate, ctrl.getResults);
router.get('/transcript/:student_id', authenticate, ctrl.getStudentTranscript);

// Online exam routes
router.post('/:id/questions', authenticate, staff, onlineCtrl.saveQuestions);
router.get('/:id/questions', authenticate, onlineCtrl.getQuestions);
router.post('/:id/start', authenticate, onlineCtrl.startExam);
router.post('/:id/submit', authenticate, onlineCtrl.submitExam);
router.get('/:id/my-submission', authenticate, onlineCtrl.getMySubmission);
router.get('/:id/submissions', authenticate, staff, onlineCtrl.getSubmissions);

module.exports = router;
