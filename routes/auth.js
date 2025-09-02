const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { loginSchema, registerSchema } = require('../validations/authValidation');
const { login, register, getProfile, updateProfile } = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/login', validateRequest(loginSchema), login);
router.post('/register', validateRequest(registerSchema), register);

// Protected routes
router.use(auth);
router.get('/profile', getProfile);
router.put('/profile', validateRequest(registerSchema), updateProfile);

module.exports = router;
