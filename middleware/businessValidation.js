const Joi = require('joi');

// Business signup validation schema
const signupSchema = Joi.object({
  // Business Information
  business_name: Joi.string().min(2).max(255).required().messages({
    'string.empty': 'Business name is required',
    'string.min': 'Business name must be at least 2 characters long',
    'string.max': 'Business name cannot exceed 255 characters',
    'any.required': 'Business name is required'
  }),
  business_phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required().messages({
    'string.empty': 'Business phone is required',
    'string.pattern.base': 'Business phone must be a valid phone number',
    'any.required': 'Business phone is required'
  }),
  business_address: Joi.string().min(5).max(255).required().messages({
    'string.empty': 'Business address is required',
    'string.min': 'Business address must be at least 5 characters long',
    'string.max': 'Business address cannot exceed 255 characters',
    'any.required': 'Business address is required'
  }),
  business_city: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Business city is required',
    'string.min': 'Business city must be at least 2 characters long',
    'string.max': 'Business city cannot exceed 100 characters',
    'any.required': 'Business city is required'
  }),
  business_state: Joi.string().length(2).required().messages({
    'string.empty': 'Business state is required',
    'string.length': 'Business state must be exactly 2 characters',
    'any.required': 'Business state is required'
  }),
  business_zip_code: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required().messages({
    'string.empty': 'Business zip code is required',
    'string.pattern.base': 'Business zip code must be a valid US zip code',
    'any.required': 'Business zip code is required'
  }),

  // Owner Information
  owner_first_name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Owner first name is required',
    'string.min': 'Owner first name must be at least 2 characters long',
    'string.max': 'Owner first name cannot exceed 100 characters',
    'any.required': 'Owner first name is required'
  }),
  owner_last_name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Owner last name is required',
    'string.min': 'Owner last name must be at least 2 characters long',
    'string.max': 'Owner last name cannot exceed 100 characters',
    'any.required': 'Owner last name is required'
  }),
  owner_email: Joi.string().email().required().messages({
    'string.empty': 'Owner email is required',
    'string.email': 'Owner email must be a valid email address',
    'any.required': 'Owner email is required'
  }),
  owner_phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required().messages({
    'string.empty': 'Owner phone is required',
    'string.pattern.base': 'Owner phone must be a valid phone number',
    'any.required': 'Owner phone is required'
  }),

  // Account Credentials
  username: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'Username is required',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot exceed 50 characters',
    'any.required': 'Username is required'
  }),
  password: Joi.string().min(1).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password is required',
    'any.required': 'Password is required'
  }),

  // Optional business details
  license_number: Joi.string().max(100).optional().allow('').messages({
    'string.max': 'License number cannot exceed 100 characters'
  }),
  insurance_number: Joi.string().max(100).optional().allow('').messages({
    'string.max': 'Insurance number cannot exceed 100 characters'
  }),
  service_radius: Joi.number().integer().min(1).max(500).optional().messages({
    'number.base': 'Service radius must be a number',
    'number.integer': 'Service radius must be an integer',
    'number.min': 'Service radius must be at least 1 mile',
    'number.max': 'Service radius cannot exceed 500 miles'
  }),
  number_of_trucks: Joi.number().integer().min(0).max(100).optional().messages({
    'number.base': 'Number of trucks must be a number',
    'number.integer': 'Number of trucks must be an integer',
    'number.min': 'Number of trucks cannot be negative',
    'number.max': 'Number of trucks cannot exceed 100'
  }),
  years_in_business: Joi.number().integer().min(0).max(100).optional().messages({
    'number.base': 'Years in business must be a number',
    'number.integer': 'Years in business must be an integer',
    'number.min': 'Years in business cannot be negative',
    'number.max': 'Years in business cannot exceed 100'
  })
}).unknown(true);

// Business login validation schema
const loginSchema = Joi.object({
  username: Joi.string().required().messages({
    'string.empty': 'Username or email is required',
    'any.required': 'Username or email is required'
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required'
  })
}).unknown(true);

// Password reset validation schema
const resetPasswordSchema = Joi.object({
  username: Joi.string().required().messages({
    'string.empty': 'Username or email is required',
    'any.required': 'Username or email is required'
  }),
  new_password: Joi.string().min(8).max(128).required().messages({
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 8 characters long',
    'string.max': 'New password cannot exceed 128 characters',
    'any.required': 'New password is required'
  })
}).unknown(true);

// Validation middleware
const validateSignup = (req, res, next) => {
  const { error } = signupSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }
  
  next();
};

const validateLogin = (req, res, next) => {
  const { error } = loginSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }
  
  next();
};

const validateResetPassword = (req, res, next) => {
  const { error } = resetPasswordSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

module.exports = {
  signupSchema,
  loginSchema,
  resetPasswordSchema,
  validateSignup,
  validateLogin,
  validateResetPassword
};
