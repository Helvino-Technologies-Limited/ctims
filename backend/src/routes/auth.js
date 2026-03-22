const router = require('express').Router();
const { login, getMe, changePassword, updateProfile, uploadPhoto } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, changePassword);
router.put('/profile', authenticate, updateProfile);
router.post('/upload-photo', authenticate, uploadPhoto);

module.exports = router;
