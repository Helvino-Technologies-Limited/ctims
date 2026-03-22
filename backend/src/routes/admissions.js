const router = require('express').Router();
const ctrl = require('../controllers/admissionController');
const { authenticate, authorize } = require('../middleware/auth');

const staff = ['admin', 'registrar', 'superadmin'];

router.post('/apply', ctrl.submitApplication);
router.get('/programs/:institution_id', ctrl.getPublicPrograms);
router.get('/stats', authenticate, authorize(...staff), ctrl.getStats);
router.get('/', authenticate, authorize(...staff), ctrl.getApplications);
router.post('/', authenticate, authorize(...staff), ctrl.submitManualApplication);
router.patch('/:id/review', authenticate, authorize(...staff), ctrl.reviewApplication);
router.post('/:id/convert', authenticate, authorize(...staff), ctrl.convertToStudent);

module.exports = router;
