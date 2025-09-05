const Joi = require('joi');

// Estimate validation schema
const estimateSchema = Joi.object({
  customer_id: Joi.number().integer().required().messages({
    'number.base': 'Customer ID must be a number',
    'number.integer': 'Customer ID must be an integer',
    'any.required': 'Customer ID is required'
  }),
  title: Joi.string().min(2).max(255).required().messages({
    'string.empty': 'Title is required',
    'string.min': 'Title must be at least 2 characters long',
    'string.max': 'Title cannot exceed 255 characters',
    'any.required': 'Title is required'
  }),
  amount: Joi.number().precision(2).min(0).required().messages({
    'number.base': 'Amount must be a number',
    'number.min': 'Amount must be greater than or equal to 0',
    'any.required': 'Amount is required'
  }),
  status: Joi.string().valid('draft', 'sent', 'accepted', 'rejected', 'expired').optional().messages({
    'any.only': 'Status must be one of: draft, sent, accepted, rejected, expired'
  }),
  sent_date: Joi.date().optional().allow(null).messages({
    'date.base': 'Sent date must be a valid date'
  }),
  expiry_date: Joi.date().optional().allow(null).messages({
    'date.base': 'Expiry date must be a valid date'
  }),
  notes: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Notes cannot exceed 1000 characters'
  })
}).unknown(true);

// Validation middleware
const validateEstimate = (req, res, next) => {
  const { error } = estimateSchema.validate(req.body, { abortEarly: false });
  
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
  estimateSchema,
  validateEstimate
};
