const express = require('express');
const router = express.Router();
const { signup, login, getProfile, updateProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { validateSignup, validateLogin } = require('../middleware/businessValidation');

// Business signup endpoint
router.post('/signup', validateSignup, signup);

// Business login endpoint
router.post('/login', validateLogin, login);

// Get business profile (protected route)
router.get('/profile', auth, getProfile);

// Update business profile (protected route)
router.put('/profile', auth, updateProfile);

module.exports = router;
