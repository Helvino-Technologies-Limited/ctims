const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');
const staffOnly = authorize('admin','superadmin','finance','registrar','lecturer');
const adminOnly = authorize('admin','superadmin','registrar');

router.get('/dashboard', authenticate, staffOnly, ctrl.getInstitutionDashboard);
router.get('/financial', authenticate, authorize('admin','superadmin','finance'), ctrl.getFinancialReport);
router.get('/audit', authenticate, adminOnly, ctrl.getAuditLogs);

module.exports = router;
