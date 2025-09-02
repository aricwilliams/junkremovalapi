const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const config = require('../config/config');

// Helper function to create success response
const createSuccessResponse = (message, data = null) => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString()
});

// Helper function to create error response
const createErrorResponse = (message, errorCode = 'INTERNAL_SERVER_ERROR', statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = errorCode;
  throw error;
};

// Generate JWT token
const generateToken = (userId, email, role) => {
  return jwt.sign(
    { id: userId, email, role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const userSql = 'SELECT * FROM employees WHERE email = ? AND is_active = 1';
    const users = await query(userSql, [email]);

    if (users.length === 0) {
      return createErrorResponse('Invalid credentials', 'INVALID_CREDENTIALS', 401);
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return createErrorResponse('Invalid credentials', 'INVALID_CREDENTIALS', 401);
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Update last login
    const updateSql = 'UPDATE employees SET last_login = NOW() WHERE id = ?';
    await query(updateSql, [user.id]);

    const response = createSuccessResponse('Login successful', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      token
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Register new user
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if user already exists
    const checkSql = 'SELECT id FROM employees WHERE email = ?';
    const existingUsers = await query(checkSql, [email]);

    if (existingUsers.length > 0) {
      return createErrorResponse('User with this email already exists', 'USER_ALREADY_EXISTS', 409);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const userId = uuidv4();
    const insertSql = `
      INSERT INTO employees (
        id, name, email, password, role, phone, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())
    `;

    await query(insertSql, [
      userId,
      name,
      email,
      hashedPassword,
      role || 'crew_member',
      phone || null
    ]);

    // Generate token
    const token = generateToken(userId, email, role || 'crew_member');

    const response = createSuccessResponse('User registered successfully', {
      user: {
        id: userId,
        name,
        email,
        role: role || 'crew_member',
        phone
      },
      token
    });

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// Get user profile
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user details
    const userSql = 'SELECT id, name, email, role, phone, created_at, last_login FROM employees WHERE id = ?';
    const users = await query(userSql, [userId]);

    if (users.length === 0) {
      return createErrorResponse('User not found', 'USER_NOT_FOUND', 404);
    }

    const user = users[0];

    const response = createSuccessResponse('Profile retrieved successfully', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Check if user exists
    const checkSql = 'SELECT id FROM employees WHERE id = ?';
    const existingUser = await query(checkSql, [userId]);

    if (existingUser.length === 0) {
      return createErrorResponse('User not found', 'USER_NOT_FOUND', 404);
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    // Only allow updating certain fields
    const allowedFields = ['name', 'phone'];
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return createErrorResponse('No valid fields to update', 'NO_VALID_FIELDS_TO_UPDATE', 400);
    }

    // Add updated_at timestamp
    updateFields.push('updated_at = NOW()');
    updateValues.push(userId);

    const updateSql = `UPDATE employees SET ${updateFields.join(', ')} WHERE id = ?`;
    await query(updateSql, updateValues);

    const response = createSuccessResponse('Profile updated successfully', {
      updated_fields: Object.keys(updateData).filter(key => allowedFields.includes(key))
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getProfile,
  updateProfile
};
