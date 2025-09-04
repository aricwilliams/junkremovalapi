const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../config/database');

// Business signup
const signup = async (req, res, next) => {
  try {
    const {
      business_name,
      business_phone,
      business_address,
      business_city,
      business_state,
      business_zip_code,
      owner_first_name,
      owner_last_name,
      owner_email,
      owner_phone,
      username,
      password,
      license_number,
      insurance_number,
      service_radius,
      number_of_trucks,
      years_in_business
    } = req.body;

    // Check if business already exists
    const existingBusiness = await db.query(
      'SELECT id FROM businesses WHERE owner_email = ? OR username = ?',
      [owner_email, username]
    );

    if (existingBusiness.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Business already exists with this email or username',
        error: 'BUSINESS_EXISTS'
      });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new business
    const result = await db.query(
      `INSERT INTO businesses (
        business_name, business_phone, business_address, business_city, 
        business_state, business_zip_code, owner_first_name, owner_last_name, 
        owner_email, owner_phone, username, password_hash, license_number, 
        insurance_number, service_radius, number_of_trucks, years_in_business
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        business_name, business_phone, business_address, business_city,
        business_state, business_zip_code, owner_first_name, owner_last_name,
        owner_email, owner_phone, username, password_hash, 
        license_number || null, insurance_number || null, 
        service_radius || null, number_of_trucks || null, years_in_business || null
      ]
    );

    const businessId = result.insertId;

    // Get the created business (without password)
    const newBusiness = await db.query(
      `SELECT id, business_name, business_phone, business_address, business_city, 
       business_state, business_zip_code, owner_first_name, owner_last_name, 
       owner_email, owner_phone, username, user_type, status, created_at,
       license_number, insurance_number, service_radius, number_of_trucks, 
       years_in_business FROM businesses WHERE id = ?`,
      [businessId]
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        id: businessId,
        username: username,
        email: owner_email,
        user_type: 'business_owner',
        business_name: business_name
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.status(201).json({
      success: true,
      message: 'Business registered successfully',
      data: {
        business: newBusiness[0],
        token: token
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    next(error);
  }
};

// Business login
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find business by username or email
    const business = await db.query(
      `SELECT id, business_name, business_phone, business_address, business_city, 
       business_state, business_zip_code, owner_first_name, owner_last_name, 
       owner_email, owner_phone, username, password_hash, user_type, status, 
       created_at, last_login, license_number, insurance_number, service_radius, 
       number_of_trucks, years_in_business FROM businesses 
       WHERE username = ? OR owner_email = ?`,
      [username, username]
    );

    if (business.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    const businessData = business[0];

    // Check if business is active
    if (businessData.status !== 'active' && businessData.status !== 'pending') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active',
        error: 'ACCOUNT_INACTIVE'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, businessData.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    await db.query(
      'UPDATE businesses SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [businessData.id]
    );

    // Remove password from response
    delete businessData.password_hash;

    // Generate JWT token
    const token = jwt.sign(
      {
        id: businessData.id,
        username: businessData.username,
        email: businessData.owner_email,
        user_type: businessData.user_type,
        business_name: businessData.business_name
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        business: businessData,
        token: token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// Get business profile
const getProfile = async (req, res, next) => {
  try {
    const businessId = req.user.id;

    const business = await db.query(
      `SELECT id, business_name, business_phone, business_address, business_city, 
       business_state, business_zip_code, owner_first_name, owner_last_name, 
       owner_email, owner_phone, username, user_type, status, created_at, 
       last_login, license_number, insurance_number, service_radius, 
       number_of_trucks, years_in_business FROM businesses WHERE id = ?`,
      [businessId]
    );

    if (business.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
        error: 'BUSINESS_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        business: business[0]
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    next(error);
  }
};

// Update business profile
const updateProfile = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password_hash;
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.last_login;

    // Build dynamic update query
    const allowedFields = [
      'business_name', 'business_phone', 'business_address', 'business_city',
      'business_state', 'business_zip_code', 'owner_first_name', 'owner_last_name',
      'owner_phone', 'license_number', 'insurance_number', 'service_radius',
      'number_of_trucks', 'years_in_business'
    ];

    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        error: 'NO_VALID_FIELDS'
      });
    }

    updateValues.push(businessId);

    await db.query(
      `UPDATE businesses SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    // Get updated business data
    const updatedBusiness = await db.query(
      `SELECT id, business_name, business_phone, business_address, business_city, 
       business_state, business_zip_code, owner_first_name, owner_last_name, 
       owner_email, owner_phone, username, user_type, status, created_at, 
       last_login, license_number, insurance_number, service_radius, 
       number_of_trucks, years_in_business FROM businesses WHERE id = ?`,
      [businessId]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        business: updatedBusiness[0]
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile
};
