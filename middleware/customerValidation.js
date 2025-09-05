const Joi = require('joi');

// Customer validation schema
const customerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'string.empty': 'Customer name is required',
    'string.min': 'Customer name must be at least 2 characters long',
    'string.max': 'Customer name cannot exceed 255 characters',
    'any.required': 'Customer name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email is required'
  }),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required().messages({
    'string.empty': 'Phone is required',
    'string.pattern.base': 'Phone must be a valid phone number',
    'any.required': 'Phone is required'
  }),
  address: Joi.string().min(5).max(255).required().messages({
    'string.empty': 'Address is required',
    'string.min': 'Address must be at least 5 characters long',
    'string.max': 'Address cannot exceed 255 characters',
    'any.required': 'Address is required'
  }),
  city: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'City is required',
    'string.min': 'City must be at least 2 characters long',
    'string.max': 'City cannot exceed 100 characters',
    'any.required': 'City is required'
  }),
  state: Joi.string().length(2).required().messages({
    'string.empty': 'State is required',
    'string.length': 'State must be exactly 2 characters',
    'any.required': 'State is required'
  }),
  zip_code: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required().messages({
    'string.empty': 'Zip code is required',
    'string.pattern.base': 'Zip code must be a valid US zip code',
    'any.required': 'Zip code is required'
  }),
  customer_type: Joi.string().valid('residential', 'commercial', 'industrial', 'government').optional().messages({
    'any.only': 'Customer type must be one of: residential, commercial, industrial, government'
  }),
  status: Joi.string().valid('new', 'quoted', 'scheduled', 'completed', 'inactive', 'blacklisted').optional().messages({
    'any.only': 'Status must be one of: new, quoted, scheduled, completed, inactive, blacklisted'
  })
}).unknown(true);

// Validation middleware
const validateCustomer = (req, res, next) => {
  const { error } = customerSchema.validate(req.body, { abortEarly: false });
  
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
  customerSchema,
  validateCustomer
};
