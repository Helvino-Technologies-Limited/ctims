const router = require('express').Router();
const ctrl = require('../controllers/admissionController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/apply', ctrl.submitApplication);
router.get('/programs/:institution_id', ctrl.getPublicPrograms);
router.get('/', authenticate, authorize('admin','registrar','superadmin'), ctrl.getApplications);
router.patch('/:id/review', authenticate, authorize('admin','registrar','superadmin'), ctrl.reviewApplication);

module.exports = router;
