const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const admin = authorize('admin','superadmin');

router.get('/', authenticate, admin, ctrl.getUsers);
router.post('/', authenticate, admin, ctrl.createUser);
router.patch('/:id/status', authenticate, admin, ctrl.toggleUserStatus);
router.patch('/:id/reset-password', authenticate, admin, ctrl.resetUserPassword);

module.exports = router;
