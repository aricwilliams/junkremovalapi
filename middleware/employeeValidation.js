const Joi = require('joi');

// Employee validation schema
const employeeSchema = Joi.object({
  first_name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'First name is required',
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 100 characters',
    'any.required': 'First name is required'
  }),
  last_name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Last name is required',
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 100 characters',
    'any.required': 'Last name is required'
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
  job_title: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Job title is required',
    'string.min': 'Job title must be at least 2 characters long',
    'string.max': 'Job title cannot exceed 100 characters',
    'any.required': 'Job title is required'
  }),
  employee_type: Joi.string().valid('manager', 'regular', '1099').optional().messages({
    'any.only': 'Employee type must be one of: manager, regular, 1099'
  }),
  position: Joi.string().valid('driver', 'helper', 'supervisor', 'manager', 'admin').optional().messages({
    'any.only': 'Position must be one of: driver, helper, supervisor, manager, admin'
  }),
  status: Joi.string().valid('active', 'inactive', 'on-leave', 'terminated').optional().messages({
    'any.only': 'Status must be one of: active, inactive, on-leave, terminated'
  }),
  hire_date: Joi.date().required().messages({
    'date.base': 'Hire date must be a valid date',
    'any.required': 'Hire date is required'
  })
}).unknown(true);

// Validation middleware
const validateEmployee = (req, res, next) => {
  const { error } = employeeSchema.validate(req.body, { abortEarly: false });
  
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
  employeeSchema,
  validateEmployee
};
