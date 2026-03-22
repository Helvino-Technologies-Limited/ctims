const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.get('/dashboard', authenticate, ctrl.getInstitutionDashboard);
router.get('/financial', authenticate, ctrl.getFinancialReport);
router.get('/audit', authenticate, ctrl.getAuditLogs);

module.exports = router;
