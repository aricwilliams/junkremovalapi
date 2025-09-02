const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// JWT secret (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '24h';

// User login
async function login(req, res) {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username && !email) {
      return res.status(400).json({
        success: false,
        message: 'Username or email is required',
        error: 'MISSING_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
        error: 'MISSING_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    // Find user by username or email
    const userQuery = `
      SELECT 
        pu.*,
        c.first_name,
        c.last_name,
        c.customer_type,
        c.company_name
      FROM portal_users pu
      JOIN customers c ON pu.customer_id = c.id
      WHERE (pu.username = ? OR pu.email = ?) AND pu.is_active = TRUE
    `;

    const [users] = await mysql.execute(userQuery, [username || email, username || email]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    const user = users[0];

    // Check if account is locked
    if (user.is_locked) {
      if (user.lock_expiry && new Date() > new Date(user.lock_expiry)) {
        // Unlock account if lock has expired
        await mysql.execute(`
          UPDATE portal_users 
          SET is_locked = FALSE, lock_expiry = NULL, login_attempts = 0 
          WHERE id = ?
        `, [user.id]);
      } else {
        return res.status(423).json({
          success: false,
          message: 'Account is locked due to too many failed login attempts',
          error: 'ACCOUNT_LOCKED',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // Increment login attempts
      const newLoginAttempts = user.login_attempts + 1;
      let lockExpiry = null;
      let isLocked = false;

      // Lock account after 5 failed attempts for 30 minutes
      if (newLoginAttempts >= 5) {
        isLocked = true;
        lockExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await mysql.execute(`
        UPDATE portal_users 
        SET login_attempts = ?, is_locked = ?, lock_expiry = ?
        WHERE id = ?
      `, [newLoginAttempts, isLocked, lockExpiry, user.id]);

      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS',
        timestamp: new Date().toISOString()
      });
    }

    // Reset login attempts on successful login
    await mysql.execute(`
      UPDATE portal_users 
      SET login_attempts = 0, last_login = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [user.id]);

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      customerId: user.customer_id,
      username: user.username,
      email: user.email,
      role: user.role,
      customerType: user.customer_type
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Generate refresh token (simple UUID for now)
    const refreshToken = uuidv4();

    // Store refresh token in database (you might want to create a separate table for this)
    // For now, we'll store it in the user record
    await mysql.execute(`
      UPDATE portal_users 
      SET password_reset_token = ?, password_reset_expiry = DATE_ADD(NOW(), INTERVAL 30 DAY)
      WHERE id = ?
    `, [refreshToken, user.id]);

    // Log successful login
    const activityQuery = `
      INSERT INTO portal_activity_logs (id, user_id, customer_id, activity_type, description, ip_address, user_agent)
      VALUES (?, ?, ?, 'login', 'User logged in successfully', ?, ?)
    `;

    await mysql.execute(activityQuery, [
      uuidv4(),
      user.id,
      user.customer_id,
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          user_type: user.customer_type,
          role: user.role
        },
        token,
        expires_in: 24 * 60 * 60, // 24 hours in seconds
        refresh_token: refreshToken
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// User logout
async function logout(req, res) {
  try {
    const userId = req.user.userId; // From JWT middleware
    const customerId = req.user.customerId;

    // Invalidate refresh token
    await mysql.execute(`
      UPDATE portal_users 
      SET password_reset_token = NULL, password_reset_expiry = NULL
      WHERE id = ?
    `, [userId]);

    // Log logout activity
    const activityQuery = `
      INSERT INTO portal_activity_logs (id, user_id, customer_id, activity_type, description, ip_address, user_agent)
      VALUES (?, ?, ?, 'logout', 'User logged out', ?, ?)
    `;

    await mysql.execute(activityQuery, [
      uuidv4(),
      userId,
      customerId,
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);

    res.json({
      success: true,
      message: 'Logout successful',
      data: {
        user_id: userId,
        logout_time: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Refresh token
async function refreshToken(req, res) {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        error: 'MISSING_REFRESH_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // Find user with valid refresh token
    const userQuery = `
      SELECT 
        pu.id,
        pu.username,
        pu.email,
        pu.role,
        pu.customer_id,
        c.customer_type
      FROM portal_users pu
      JOIN customers c ON pu.customer_id = c.id
      WHERE pu.password_reset_token = ? 
        AND pu.password_reset_expiry > NOW()
        AND pu.is_active = TRUE
    `;

    const [users] = await mysql.execute(userQuery, [refresh_token]);

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        error: 'INVALID_REFRESH_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    const user = users[0];

    // Generate new JWT token
    const tokenPayload = {
      userId: user.id,
      customerId: user.customer_id,
      username: user.username,
      email: user.email,
      role: user.role,
      customerType: user.customer_type
    };

    const newToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Generate new refresh token
    const newRefreshToken = uuidv4();

    // Update refresh token in database
    await mysql.execute(`
      UPDATE portal_users 
      SET password_reset_token = ?, password_reset_expiry = DATE_ADD(NOW(), INTERVAL 30 DAY)
      WHERE id = ?
    `, [newRefreshToken, user.id]);

    // Log token refresh activity
    const activityQuery = `
      INSERT INTO portal_activity_logs (id, user_id, customer_id, activity_type, description, ip_address, user_agent)
      VALUES (?, ?, ?, 'other', 'Token refreshed', ?, ?)
    `;

    await mysql.execute(activityQuery, [
      uuidv4(),
      user.id,
      user.customer_id,
      req.ip || 'unknown',
      req.get('User-Agent') || 'unknown'
    ]);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        expires_in: 24 * 60 * 60, // 24 hours in seconds
        refresh_token: newRefreshToken
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access token required',
      error: 'MISSING_TOKEN',
      timestamp: new Date().toISOString()
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        error: 'TOKEN_EXPIRED',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'INVALID_TOKEN',
      timestamp: new Date().toISOString()
    });
  }
}

// Middleware to check if user has required permissions
function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'AUTHENTICATION_REQUIRED',
        timestamp: new Date().toISOString()
      });
    }

    // Check role-based permissions
    if (user.role === 'owner') {
      return next(); // Owner has all permissions
    }

    if (user.role === 'manager' && ['dashboard', 'requests', 'reports'].includes(permission)) {
      return next();
    }

    if (user.role === 'employee' && ['dashboard', 'requests'].includes(permission)) {
      return next();
    }

    if (user.role === 'viewer' && permission === 'dashboard') {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions',
      error: 'INSUFFICIENT_PERMISSIONS',
      timestamp: new Date().toISOString()
    });
  };
}

module.exports = {
  login,
  logout,
  refreshToken,
  verifyToken,
  requirePermission
};
