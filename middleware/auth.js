const jwt = require('jsonwebtoken');
const config = require('../config/config');

const auth = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const error = new Error('Access denied. No token provided.');
      error.statusCode = 401;
      error.code = 'NO_TOKEN_PROVIDED';
      throw error;
    }

    // Verify token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Add user info to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      error.statusCode = 401;
      error.code = 'INVALID_TOKEN';
    } else if (error.name === 'TokenExpiredError') {
      error.statusCode = 401;
      error.code = 'TOKEN_EXPIRED';
    } else {
      error.statusCode = 401;
      error.code = 'AUTHENTICATION_FAILED';
    }
    next(error);
  }
};

const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional routes
    next();
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      const error = new Error('Access denied. Authentication required.');
      error.statusCode = 401;
      error.code = 'AUTHENTICATION_REQUIRED';
      return next(error);
    }

    if (!roles.includes(req.user.role)) {
      const error = new Error('Access denied. Insufficient permissions.');
      error.statusCode = 403;
      error.code = 'INSUFFICIENT_PERMISSIONS';
      return next(error);
    }

    next();
  };
};

module.exports = {
  auth,
  optionalAuth,
  requireRole
};
