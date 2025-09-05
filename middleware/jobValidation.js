const Joi = require('joi');

// Job validation schema
const jobSchema = Joi.object({
  customer_id: Joi.number().integer().required().messages({
    'number.base': 'Customer ID must be a number',
    'number.integer': 'Customer ID must be an integer',
    'any.required': 'Customer ID is required'
  }),
  estimate_id: Joi.number().integer().optional().allow(null).messages({
    'number.base': 'Estimate ID must be a number',
    'number.integer': 'Estimate ID must be an integer'
  }),
  assigned_employee_id: Joi.number().integer().optional().allow(null).messages({
    'number.base': 'Employee ID must be a number',
    'number.integer': 'Employee ID must be an integer'
  }),
  title: Joi.string().min(2).max(255).required().messages({
    'string.empty': 'Title is required',
    'string.min': 'Title must be at least 2 characters long',
    'string.max': 'Title cannot exceed 255 characters',
    'any.required': 'Title is required'
  }),
  description: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Description cannot exceed 1000 characters'
  }),
  scheduled_date: Joi.date().required().messages({
    'date.base': 'Scheduled date must be a valid date',
    'any.required': 'Scheduled date is required'
  }),
  completion_date: Joi.date().optional().allow(null).messages({
    'date.base': 'Completion date must be a valid date'
  }),
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').optional().messages({
    'any.only': 'Status must be one of: scheduled, in_progress, completed, cancelled'
  }),
  total_cost: Joi.number().precision(2).min(0).optional().allow(null).messages({
    'number.base': 'Total cost must be a number',
    'number.min': 'Total cost must be greater than or equal to 0'
  })
}).unknown(true);

// Job item validation schema
const jobItemSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'string.empty': 'Item name is required',
    'string.min': 'Item name must be at least 2 characters long',
    'string.max': 'Item name cannot exceed 255 characters',
    'any.required': 'Item name is required'
  }),
  category: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Category is required',
    'string.min': 'Category must be at least 2 characters long',
    'string.max': 'Category cannot exceed 100 characters',
    'any.required': 'Category is required'
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required'
  }),
  base_price: Joi.number().precision(2).min(0).required().messages({
    'number.base': 'Base price must be a number',
    'number.min': 'Base price must be greater than or equal to 0',
    'any.required': 'Base price is required'
  }),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional().messages({
    'any.only': 'Difficulty must be one of: easy, medium, hard'
  }),
  estimated_time: Joi.number().integer().min(1).required().messages({
    'number.base': 'Estimated time must be a number',
    'number.integer': 'Estimated time must be an integer',
    'number.min': 'Estimated time must be at least 1 minute',
    'any.required': 'Estimated time is required'
  })
}).unknown(true);

// Job note validation schema
const jobNoteSchema = Joi.object({
  note_type: Joi.string().valid('general', 'customer_communication', 'internal', 'issue', 'resolution').optional().messages({
    'any.only': 'Note type must be one of: general, customer_communication, internal, issue, resolution'
  }),
  content: Joi.string().min(1).max(1000).required().messages({
    'string.empty': 'Content is required',
    'string.min': 'Content must be at least 1 character long',
    'string.max': 'Content cannot exceed 1000 characters',
    'any.required': 'Content is required'
  }),
  is_important: Joi.boolean().optional().messages({
    'boolean.base': 'Is important must be a boolean value'
  })
}).unknown(true);

// Validation middleware
const validateJob = (req, res, next) => {
  const { error } = jobSchema.validate(req.body, { abortEarly: false });
  
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

const validateJobItem = (req, res, next) => {
  const { error } = jobItemSchema.validate(req.body, { abortEarly: false });
  
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

const validateJobNote = (req, res, next) => {
  const { error } = jobNoteSchema.validate(req.body, { abortEarly: false });
  
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
  jobSchema,
  jobItemSchema,
  jobNoteSchema,
  validateJob,
  validateJobItem,
  validateJobNote
};
