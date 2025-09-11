const { body, validationResult } = require('express-validator');

/**
 * Validation middleware for notification operations
 */
const validateNotification = [
  // Validate google_review_link
  body('google_review_link')
    .optional()
    .isURL({ 
      protocols: ['http', 'https'],
      require_protocol: true 
    })
    .withMessage('Google review link must be a valid URL with http or https protocol')
    .isLength({ max: 500 })
    .withMessage('Google review link must not exceed 500 characters')
    .custom((value) => {
      if (value && !value.includes('google.com')) {
        throw new Error('Google review link should be a Google URL');
      }
      return true;
    }),

  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    
    next();
  }
];

/**
 * Validation middleware for notification creation (requires google_review_link)
 */
const validateNotificationCreation = [
  // Validate google_review_link (required for creation)
  body('google_review_link')
    .notEmpty()
    .withMessage('Google review link is required')
    .isURL({ 
      protocols: ['http', 'https'],
      require_protocol: true 
    })
    .withMessage('Google review link must be a valid URL with http or https protocol')
    .isLength({ max: 500 })
    .withMessage('Google review link must not exceed 500 characters')
    .custom((value) => {
      if (!value.includes('google.com')) {
        throw new Error('Google review link should be a Google URL');
      }
      return true;
    }),

  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    
    next();
  }
];

/**
 * Validation middleware for notification update (google_review_link optional)
 */
const validateNotificationUpdate = [
  // Validate google_review_link (optional for updates)
  body('google_review_link')
    .optional()
    .isURL({ 
      protocols: ['http', 'https'],
      require_protocol: true 
    })
    .withMessage('Google review link must be a valid URL with http or https protocol')
    .isLength({ max: 500 })
    .withMessage('Google review link must not exceed 500 characters')
    .custom((value) => {
      if (value && !value.includes('google.com')) {
        throw new Error('Google review link should be a Google URL');
      }
      return true;
    }),

  // Ensure at least one field is provided for update
  body().custom((value) => {
    const allowedFields = ['google_review_link'];
    const hasValidField = allowedFields.some(field => value[field] !== undefined);
    
    if (!hasValidField) {
      throw new Error('At least one field must be provided for update');
    }
    
    return true;
  }),

  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    
    next();
  }
];

module.exports = {
  validateNotification,
  validateNotificationCreation,
  validateNotificationUpdate
};
