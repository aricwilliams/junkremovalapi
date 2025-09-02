const Joi = require('joi');
const config = require('../config/config');

// Base job schema
const baseJobSchema = {
  customer_id: Joi.string().required().messages({
    'string.empty': 'Customer ID is required',
    'any.required': 'Customer ID is required'
  }),
  customer_name: Joi.string().min(2).max(255).required().messages({
    'string.empty': 'Customer name is required',
    'string.min': 'Customer name must be at least 2 characters long',
    'string.max': 'Customer name cannot exceed 255 characters',
    'any.required': 'Customer name is required'
  }),
  customer_phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required().messages({
    'string.empty': 'Customer phone is required',
    'string.pattern.base': 'Customer phone must be a valid phone number',
    'any.required': 'Customer phone is required'
  }),
  customer_email: Joi.string().email().required().messages({
    'string.empty': 'Customer email is required',
    'string.email': 'Customer email must be a valid email address',
    'any.required': 'Customer email is required'
  }),
  address: Joi.string().min(5).max(500).required().messages({
    'string.empty': 'Address is required',
    'string.min': 'Address must be at least 5 characters long',
    'string.max': 'Address cannot exceed 500 characters',
    'any.required': 'Address is required'
  }),
  city: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'City is required',
    'string.min': 'City must be at least 2 characters long',
    'string.max': 'City cannot exceed 100 characters',
    'any.required': 'City is required'
  }),
  state: Joi.string().length(2).pattern(/^[A-Z]{2}$/).required().messages({
    'string.empty': 'State is required',
    'string.length': 'State must be exactly 2 characters',
    'string.pattern.base': 'State must be a valid 2-letter state code',
    'any.required': 'State is required'
  }),
  zip_code: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required().messages({
    'string.empty': 'ZIP code is required',
    'string.pattern.base': 'ZIP code must be a valid US ZIP code format',
    'any.required': 'ZIP code is required'
  }),
  latitude: Joi.number().min(-90).max(90).optional().messages({
    'number.min': 'Latitude must be between -90 and 90',
    'number.max': 'Latitude must be between -90 and 90'
  }),
  longitude: Joi.number().min(-180).max(180).optional().messages({
    'number.min': 'Longitude must be between -180 and 180',
    'number.max': 'Longitude must be between -180 and 180'
  }),
  scheduled_date: Joi.date().min('now').required().messages({
    'date.base': 'Scheduled date must be a valid date',
    'date.min': 'Scheduled date cannot be in the past',
    'any.required': 'Scheduled date is required'
  }),
  time_slot: Joi.string().valid(...config.timeSlots).required().messages({
    'string.empty': 'Time slot is required',
    'any.only': 'Time slot must be one of the available options',
    'any.required': 'Time slot is required'
  }),
  estimated_hours: Joi.number().min(0.5).max(24).required().messages({
    'number.base': 'Estimated hours must be a number',
    'number.min': 'Estimated hours must be at least 0.5',
    'number.max': 'Estimated hours cannot exceed 24',
    'any.required': 'Estimated hours is required'
  }),
  priority: Joi.string().valid(...Object.values(config.jobPriorities)).default('medium').messages({
    'any.only': 'Priority must be one of: low, medium, high, urgent'
  }),
  total_estimate: Joi.number().min(0).precision(2).required().messages({
    'number.base': 'Total estimate must be a number',
    'number.min': 'Total estimate cannot be negative',
    'number.precision': 'Total estimate can have maximum 2 decimal places',
    'any.required': 'Total estimate is required'
  }),
  notes: Joi.string().max(1000).optional().messages({
    'string.max': 'Notes cannot exceed 1000 characters'
  })
};

// Job items schema
const jobItemSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().messages({
    'string.empty': 'Item name is required',
    'string.min': 'Item name must be at least 2 characters long',
    'string.max': 'Item name cannot exceed 255 characters',
    'any.required': 'Item name is required'
  }),
  category: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Item category is required',
    'string.min': 'Item category must be at least 2 characters long',
    'string.max': 'Item category cannot exceed 100 characters',
    'any.required': 'Item category is required'
  }),
  quantity: Joi.number().integer().min(1).default(1).messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be a whole number',
    'number.min': 'Quantity must be at least 1'
  }),
  base_price: Joi.number().min(0).precision(2).required().messages({
    'number.base': 'Base price must be a number',
    'number.min': 'Base price cannot be negative',
    'number.precision': 'Base price can have maximum 2 decimal places',
    'any.required': 'Base price is required'
  }),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium').messages({
    'any.only': 'Difficulty must be one of: easy, medium, hard'
  }),
  estimated_time: Joi.number().min(0.1).max(24).required().messages({
    'number.base': 'Estimated time must be a number',
    'number.min': 'Estimated time must be at least 0.1 hours',
    'number.max': 'Estimated time cannot exceed 24 hours',
    'any.required': 'Estimated time is required'
  }),
  notes: Joi.string().max(500).optional().messages({
    'string.max': 'Item notes cannot exceed 500 characters'
  })
});

// Create job validation schema
const createJobSchema = Joi.object({
  ...baseJobSchema,
  items: Joi.array().items(jobItemSchema).min(1).required().messages({
    'array.min': 'At least one item is required',
    'any.required': 'Job items are required'
  })
});

// Update job validation schema
const updateJobSchema = Joi.object({
  customer_name: Joi.string().min(2).max(255).optional(),
  customer_phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  customer_email: Joi.string().email().optional(),
  address: Joi.string().min(5).max(500).optional(),
  city: Joi.string().min(2).max(100).optional(),
  state: Joi.string().length(2).pattern(/^[A-Z]{2}$/).optional(),
  zip_code: Joi.string().pattern(/^\d{5}(-\d{4})?$/).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  scheduled_date: Joi.date().min('now').optional(),
  time_slot: Joi.string().valid(...config.timeSlots).optional(),
  estimated_hours: Joi.number().min(0.5).max(24).optional(),
  priority: Joi.string().valid(...Object.values(config.jobPriorities)).optional(),
  total_estimate: Joi.number().min(0).precision(2).optional(),
  notes: Joi.string().max(1000).optional()
});

// Update job status validation schema
const updateJobStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(config.jobStatuses)).required().messages({
    'string.empty': 'Status is required',
    'any.only': 'Status must be one of the valid options',
    'any.required': 'Status is required'
  }),
  status_notes: Joi.string().max(500).optional().messages({
    'string.max': 'Status notes cannot exceed 500 characters'
  }),
  actual_start_time: Joi.date().optional().messages({
    'date.base': 'Actual start time must be a valid date'
  })
});

// Assign crew validation schema
const assignCrewSchema = Joi.object({
  crew_id: Joi.string().required().messages({
    'string.empty': 'Crew ID is required',
    'any.required': 'Crew ID is required'
  }),
  assignment_notes: Joi.string().max(500).optional().messages({
    'string.max': 'Assignment notes cannot exceed 500 characters'
  })
});

// Add item to job validation schema
const addItemToJobSchema = jobItemSchema;

// Upload photos validation schema
const uploadPhotosSchema = Joi.object({
  photo_type: Joi.string().valid('before', 'after').required().messages({
    'string.empty': 'Photo type is required',
    'any.only': 'Photo type must be either "before" or "after"',
    'any.required': 'Photo type is required'
  }),
  description: Joi.string().max(200).optional().messages({
    'string.max': 'Photo description cannot exceed 200 characters'
  })
});

// Time log validation schemas
const startTimeLogSchema = Joi.object({
  crew_member_id: Joi.string().required().messages({
    'string.empty': 'Crew member ID is required',
    'any.required': 'Crew member ID is required'
  }),
  activity: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Activity is required',
    'string.min': 'Activity must be at least 2 characters long',
    'string.max': 'Activity cannot exceed 100 characters',
    'any.required': 'Activity is required'
  }),
  notes: Joi.string().max(500).optional().messages({
    'string.max': 'Activity notes cannot exceed 500 characters'
  })
});

const stopTimeLogSchema = Joi.object({
  notes: Joi.string().max(500).optional().messages({
    'string.max': 'Stop notes cannot exceed 500 characters'
  })
});

// Notification validation schema
const sendNotificationSchema = Joi.object({
  type: Joi.string().valid(...Object.values(config.notificationTypes)).required().messages({
    'string.empty': 'Notification type is required',
    'any.only': 'Notification type must be one of the valid options',
    'any.required': 'Notification type is required'
  }),
  title: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Notification title is required',
    'string.min': 'Notification title must be at least 2 characters long',
    'string.max': 'Notification title cannot exceed 100 characters',
    'any.required': 'Notification title is required'
  }),
  message: Joi.string().min(2).max(500).required().messages({
    'string.empty': 'Notification message is required',
    'string.min': 'Notification message must be at least 2 characters long',
    'string.max': 'Notification message cannot exceed 500 characters',
    'any.required': 'Notification message is required'
  }),
  recipients: Joi.array().items(Joi.string().valid('customer', 'crew')).min(1).required().messages({
    'array.min': 'At least one recipient is required',
    'any.required': 'Recipients are required'
  }),
  send_email: Joi.boolean().default(true),
  send_sms: Joi.boolean().default(false)
});

// Query parameters validation schema
const getJobsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid(...Object.values(config.jobStatuses)).optional(),
  customer_id: Joi.string().optional(),
  crew_id: Joi.string().optional(),
  date_from: Joi.date().optional(),
  date_to: Joi.date().optional(),
  sort_by: Joi.string().valid('scheduled_date', 'created_at', 'priority', 'total_estimate').default('scheduled_date'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
});

module.exports = {
  createJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
  assignCrewSchema,
  addItemToJobSchema,
  uploadPhotosSchema,
  startTimeLogSchema,
  stopTimeLogSchema,
  sendNotificationSchema,
  getJobsQuerySchema
};
