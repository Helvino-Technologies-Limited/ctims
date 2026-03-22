const router = require('express').Router();
const ctrl = require('../controllers/feeController');
const { authenticate, authorize } = require('../middleware/auth');
const fin = authorize('admin','finance','superadmin');
const finOrStudent = authorize('admin','finance','superadmin','student','registrar','lecturer');

router.post('/structures', authenticate, fin, ctrl.createFeeStructure);
router.get('/structures', authenticate, ctrl.getFeeStructures);
router.post('/payments', authenticate, fin, ctrl.recordPayment);
router.get('/payments', authenticate, finOrStudent, ctrl.getPayments);
router.get('/balance/:student_id', authenticate, finOrStudent, ctrl.getStudentBalance);
router.get('/defaulters', authenticate, fin, ctrl.getFeeDefaulters);

module.exports = router;
