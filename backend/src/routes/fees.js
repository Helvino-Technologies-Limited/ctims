const router = require('express').Router();
const ctrl = require('../controllers/feeController');
const { authenticate, authorize } = require('../middleware/auth');
const fin = authorize('admin','finance','superadmin');

router.post('/structures', authenticate, fin, ctrl.createFeeStructure);
router.get('/structures', authenticate, ctrl.getFeeStructures);
router.post('/payments', authenticate, fin, ctrl.recordPayment);
router.get('/payments', authenticate, ctrl.getPayments);
router.get('/balance/:student_id', authenticate, ctrl.getStudentBalance);
router.get('/defaulters', authenticate, ctrl.getFeeDefaulters);

module.exports = router;
