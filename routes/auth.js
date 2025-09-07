const express = require('express');
const router = express.Router();
const { signup, login, getProfile, updateProfile, resetPassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validateSignup, validateLogin, validateResetPassword } = require('../middleware/businessValidation');

// Business signup endpoint
router.post('/signup', validateSignup, signup);

// Business login endpoint
router.post('/login', validateLogin, login);

// Password reset endpoint (no authentication required)
router.post('/reset-password', validateResetPassword, resetPassword);

// Get business profile (protected route)
router.get('/profile', auth, getProfile);

// Update business profile (protected route)
router.put('/profile', auth, updateProfile);

module.exports = router;
