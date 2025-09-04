const Joi = require('joi');

// Job creation validation schema
const createJobSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Customer ID must be a number',
      'number.integer': 'Customer ID must be an integer',
      'number.positive': 'Customer ID must be positive',
      'any.required': 'Customer ID is required'
    }),
  
  estimate_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Estimate ID must be a number',
      'number.integer': 'Estimate ID must be an integer',
      'number.positive': 'Estimate ID must be positive'
    }),
  
  assigned_employee_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Employee ID must be a number',
      'number.integer': 'Employee ID must be an integer',
      'number.positive': 'Employee ID must be positive'
    }),
  
  title: Joi.string().min(1).max(255).required()
    .messages({
      'string.base': 'Title must be a string',
      'string.empty': 'Title cannot be empty',
      'string.min': 'Title must be at least 1 character',
      'string.max': 'Title cannot exceed 255 characters',
      'any.required': 'Title is required'
    }),
  
  description: Joi.string().max(1000).optional()
    .messages({
      'string.base': 'Description must be a string',
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  
  scheduled_date: Joi.date().iso().required()
    .messages({
      'date.base': 'Scheduled date must be a valid date',
      'date.format': 'Scheduled date must be in ISO format',
      'any.required': 'Scheduled date is required'
    }),
  
  total_cost: Joi.number().precision(2).min(0).optional()
    .messages({
      'number.base': 'Total cost must be a number',
      'number.min': 'Total cost cannot be negative',
      'number.precision': 'Total cost can have at most 2 decimal places'
    })
});

// Job update validation schema
const updateJobSchema = Joi.object({
  customer_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Customer ID must be a number',
      'number.integer': 'Customer ID must be an integer',
      'number.positive': 'Customer ID must be positive'
    }),
  
  estimate_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Estimate ID must be a number',
      'number.integer': 'Estimate ID must be an integer',
      'number.positive': 'Estimate ID must be positive'
    }),
  
  assigned_employee_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Employee ID must be a number',
      'number.integer': 'Employee ID must be an integer',
      'number.positive': 'Employee ID must be positive'
    }),
  
  title: Joi.string().min(1).max(255).optional()
    .messages({
      'string.base': 'Title must be a string',
      'string.empty': 'Title cannot be empty',
      'string.min': 'Title must be at least 1 character',
      'string.max': 'Title cannot exceed 255 characters'
    }),
  
  description: Joi.string().max(1000).optional()
    .messages({
      'string.base': 'Description must be a string',
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  
  scheduled_date: Joi.date().iso().optional()
    .messages({
      'date.base': 'Scheduled date must be a valid date',
      'date.format': 'Scheduled date must be in ISO format'
    }),
  
  completion_date: Joi.date().iso().optional()
    .messages({
      'date.base': 'Completion date must be a valid date',
      'date.format': 'Completion date must be in ISO format'
    }),
  
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').optional()
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be one of: scheduled, in_progress, completed, cancelled'
    }),
  
  total_cost: Joi.number().precision(2).min(0).optional()
    .messages({
      'number.base': 'Total cost must be a number',
      'number.min': 'Total cost cannot be negative',
      'number.precision': 'Total cost can have at most 2 decimal places'
    })
});

// Job query parameters validation schema
const jobQuerySchema = Joi.object({
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').optional()
    .messages({
      'string.base': 'Status must be a string',
      'any.only': 'Status must be one of: scheduled, in_progress, completed, cancelled'
    }),
  
  page: Joi.number().integer().min(1).optional()
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number().integer().min(1).max(100).optional()
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  
  business_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Business ID must be a number',
      'number.integer': 'Business ID must be an integer',
      'number.positive': 'Business ID must be positive'
    }),
  
  customer_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Customer ID must be a number',
      'number.integer': 'Customer ID must be an integer',
      'number.positive': 'Customer ID must be positive'
    }),
  
  assigned_employee_id: Joi.number().integer().positive().optional()
    .messages({
      'number.base': 'Employee ID must be a number',
      'number.integer': 'Employee ID must be an integer',
      'number.positive': 'Employee ID must be positive'
    }),
  
  date_from: Joi.date().iso().optional()
    .messages({
      'date.base': 'Date from must be a valid date',
      'date.format': 'Date from must be in ISO format'
    }),
  
  date_to: Joi.date().iso().optional()
    .messages({
      'date.base': 'Date to must be a valid date',
      'date.format': 'Date to must be in ISO format'
    }),
  
  sort_by: Joi.string().valid('scheduled_date', 'completion_date', 'created_at', 'total_cost', 'status').optional()
    .messages({
      'string.base': 'Sort by must be a string',
      'any.only': 'Sort by must be one of: scheduled_date, completion_date, created_at, total_cost, status'
    }),
  
  sort_order: Joi.string().valid('asc', 'desc').optional()
    .messages({
      'string.base': 'Sort order must be a string',
      'any.only': 'Sort order must be either asc or desc'
    })
});

// Job item validation schema
const jobItemSchema = Joi.object({
  item_name: Joi.string().min(1).max(255).required()
    .messages({
      'string.base': 'Item name must be a string',
      'string.empty': 'Item name cannot be empty',
      'string.min': 'Item name must be at least 1 character',
      'string.max': 'Item name cannot exceed 255 characters',
      'any.required': 'Item name is required'
    }),
  
  description: Joi.string().max(500).optional()
    .messages({
      'string.base': 'Description must be a string',
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  quantity: Joi.number().integer().min(1).optional()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be an integer',
      'number.min': 'Quantity must be at least 1'
    }),
  
  unit_price: Joi.number().precision(2).min(0).optional()
    .messages({
      'number.base': 'Unit price must be a number',
      'number.min': 'Unit price cannot be negative',
      'number.precision': 'Unit price can have at most 2 decimal places'
    }),
  
  total_price: Joi.number().precision(2).min(0).optional()
    .messages({
      'number.base': 'Total price must be a number',
      'number.min': 'Total price cannot be negative',
      'number.precision': 'Total price can have at most 2 decimal places'
    }),
  
  weight_lbs: Joi.number().precision(2).min(0).optional()
    .messages({
      'number.base': 'Weight must be a number',
      'number.min': 'Weight cannot be negative',
      'number.precision': 'Weight can have at most 2 decimal places'
    }),
  
  dimensions: Joi.string().max(100).optional()
    .messages({
      'string.base': 'Dimensions must be a string',
      'string.max': 'Dimensions cannot exceed 100 characters'
    }),
  
  condition_notes: Joi.string().max(500).optional()
    .messages({
      'string.base': 'Condition notes must be a string',
      'string.max': 'Condition notes cannot exceed 500 characters'
    }),
  
  disposal_method: Joi.string().valid('landfill', 'recycle', 'donate', 'hazardous', 'other').optional()
    .messages({
      'string.base': 'Disposal method must be a string',
      'any.only': 'Disposal method must be one of: landfill, recycle, donate, hazardous, other'
    })
});

// Job note validation schema
const jobNoteSchema = Joi.object({
  note_type: Joi.string().valid('internal', 'customer', 'crew', 'follow_up').optional()
    .messages({
      'string.base': 'Note type must be a string',
      'any.only': 'Note type must be one of: internal, customer, crew, follow_up'
    }),
  
  content: Joi.string().min(1).max(1000).required()
    .messages({
      'string.base': 'Content must be a string',
      'string.empty': 'Content cannot be empty',
      'string.min': 'Content must be at least 1 character',
      'string.max': 'Content cannot exceed 1000 characters',
      'any.required': 'Content is required'
    }),
  
  is_important: Joi.boolean().optional()
    .messages({
      'boolean.base': 'Is important must be a boolean'
    })
});

// Job photo validation schema
const jobPhotoSchema = Joi.object({
  photo_url: Joi.string().uri().max(500).required()
    .messages({
      'string.base': 'Photo URL must be a string',
      'string.uri': 'Photo URL must be a valid URL',
      'string.max': 'Photo URL cannot exceed 500 characters',
      'any.required': 'Photo URL is required'
    }),
  
  photo_type: Joi.string().valid('before', 'during', 'after', 'receipt', 'other').optional()
    .messages({
      'string.base': 'Photo type must be a string',
      'any.only': 'Photo type must be one of: before, during, after, receipt, other'
    }),
  
  description: Joi.string().max(500).optional()
    .messages({
      'string.base': 'Description must be a string',
      'string.max': 'Description cannot exceed 500 characters'
    })
});

// Job time log validation schema
const jobTimeLogSchema = Joi.object({
  employee_id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'Employee ID must be a number',
      'number.integer': 'Employee ID must be an integer',
      'number.positive': 'Employee ID must be positive',
      'any.required': 'Employee ID is required'
    }),
  
  activity_type: Joi.string().valid('travel', 'setup', 'work', 'cleanup', 'travel_return').required()
    .messages({
      'string.base': 'Activity type must be a string',
      'any.only': 'Activity type must be one of: travel, setup, work, cleanup, travel_return',
      'any.required': 'Activity type is required'
    }),
  
  start_time: Joi.date().iso().required()
    .messages({
      'date.base': 'Start time must be a valid date',
      'date.format': 'Start time must be in ISO format',
      'any.required': 'Start time is required'
    }),
  
  end_time: Joi.date().iso().optional()
    .messages({
      'date.base': 'End time must be a valid date',
      'date.format': 'End time must be in ISO format'
    }),
  
  duration_minutes: Joi.number().integer().min(0).optional()
    .messages({
      'number.base': 'Duration must be a number',
      'number.integer': 'Duration must be an integer',
      'number.min': 'Duration cannot be negative'
    }),
  
  notes: Joi.string().max(500).optional()
    .messages({
      'string.base': 'Notes must be a string',
      'string.max': 'Notes cannot exceed 500 characters'
    }),
  
  location_latitude: Joi.number().min(-90).max(90).optional()
    .messages({
      'number.base': 'Latitude must be a number',
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90'
    }),
  
  location_longitude: Joi.number().min(-180).max(180).optional()
    .messages({
      'number.base': 'Longitude must be a number',
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180'
    })
});

module.exports = {
  createJobSchema,
  updateJobSchema,
  jobQuerySchema,
  jobItemSchema,
  jobNoteSchema,
  jobPhotoSchema,
  jobTimeLogSchema
};