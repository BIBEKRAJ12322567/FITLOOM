const express = require('express');
const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const authRateLimiter = require('../middleware/authRateLimiter');
const {
  registerValidators,
  loginValidators,
  refreshValidators,
  profileUpdateValidators,
} = require('../validators/authValidators');

const router = express.Router();

router.post('/register', authRateLimiter, registerValidators, authController.register);
router.post('/login', authRateLimiter, loginValidators, authController.login);
router.post('/refresh', refreshValidators, authController.refresh);
router.post('/logout', authController.logout); // refreshToken revoked; no access-token check needed to log out
router.post('/logout-all', authenticate, authController.logoutAll);
router.get('/me', authenticate, authController.me);
router.patch('/me/profile', authenticate, profileUpdateValidators, authController.updateProfile);

module.exports = router;