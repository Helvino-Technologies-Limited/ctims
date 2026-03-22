const router = require('express').Router();
const ctrl = require('../controllers/communicationController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/announcements', authenticate, authorize('admin','superadmin','registrar'), ctrl.createAnnouncement);
router.get('/announcements', authenticate, ctrl.getAnnouncements);
router.get('/notifications', authenticate, ctrl.getNotifications);
router.patch('/notifications/:id/read', authenticate, ctrl.markNotificationRead);

module.exports = router;
