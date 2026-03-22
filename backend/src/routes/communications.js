const router = require('express').Router();
const ctrl = require('../controllers/communicationController');
const { authenticate } = require('../middleware/auth');

router.post('/announcements', authenticate, ctrl.createAnnouncement);
router.get('/announcements', authenticate, ctrl.getAnnouncements);
router.get('/notifications', authenticate, ctrl.getNotifications);
router.patch('/notifications/:id/read', authenticate, ctrl.markNotificationRead);

module.exports = router;
