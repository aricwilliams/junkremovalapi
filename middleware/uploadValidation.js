const Joi = require('joi');

// Upload validation schema
const uploadSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional().messages({
    'string.min': 'Title must be at least 1 character long',
    'string.max': 'Title cannot exceed 255 characters'
  }),
  description: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Description cannot exceed 1000 characters'
  }),
  tags: Joi.string().optional().messages({
    'string.base': 'Tags must be a valid JSON string'
  }),
  is_public: Joi.string().valid('true', 'false').optional().messages({
    'any.only': 'is_public must be either "true" or "false"'
  }),
  metadata: Joi.string().optional().messages({
    'string.base': 'Metadata must be a valid JSON string'
  })
}).unknown(true);

// Update upload validation schema
const updateUploadSchema = Joi.object({
  title: Joi.string().min(1).max(255).optional().messages({
    'string.min': 'Title must be at least 1 character long',
    'string.max': 'Title cannot exceed 255 characters'
  }),
  description: Joi.string().max(1000).optional().allow('').messages({
    'string.max': 'Description cannot exceed 1000 characters'
  }),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional().messages({
    'array.max': 'Cannot have more than 10 tags',
    'string.max': 'Each tag cannot exceed 50 characters'
  }),
  is_public: Joi.boolean().optional().messages({
    'boolean.base': 'is_public must be a boolean value'
  }),
  metadata: Joi.object().optional().messages({
    'object.base': 'Metadata must be a valid object'
  })
}).unknown(false);

// Search validation schema
const searchSchema = Joi.object({
  q: Joi.string().min(1).max(100).required().messages({
    'string.empty': 'Search term is required',
    'string.min': 'Search term must be at least 1 character long',
    'string.max': 'Search term cannot exceed 100 characters',
    'any.required': 'Search term is required'
  }),
  file_type: Joi.string().valid('video', 'image', 'audio', 'other').optional().messages({
    'any.only': 'file_type must be one of: video, image, audio, other'
  }),
  is_public: Joi.string().valid('true', 'false').optional().messages({
    'any.only': 'is_public must be either "true" or "false"'
  }),
  sort_field: Joi.string().valid('created_at', 'title', 'file_size', 'view_count', 'download_count').optional().messages({
    'any.only': 'sort_field must be one of: created_at, title, file_size, view_count, download_count'
  }),
  sort_order: Joi.string().valid('ASC', 'DESC').optional().messages({
    'any.only': 'sort_order must be either ASC or DESC'
  }),
  page: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1'
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100'
  })
}).unknown(false);

// Get uploads validation schema
const getUploadsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Page must be a number',
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1'
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.base': 'Limit must be a number',
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100'
  }),
  file_type: Joi.string().valid('video', 'image', 'audio', 'other').optional().messages({
    'any.only': 'file_type must be one of: video, image, audio, other'
  }),
  is_public: Joi.string().valid('true', 'false').optional().messages({
    'any.only': 'is_public must be either "true" or "false"'
  }),
  search: Joi.string().min(1).max(100).optional().messages({
    'string.min': 'Search term must be at least 1 character long',
    'string.max': 'Search term cannot exceed 100 characters'
  }),
  sort_field: Joi.string().valid('created_at', 'title', 'file_size', 'view_count', 'download_count').optional().messages({
    'any.only': 'sort_field must be one of: created_at, title, file_size, view_count, download_count'
  }),
  sort_order: Joi.string().valid('ASC', 'DESC').optional().messages({
    'any.only': 'sort_order must be either ASC or DESC'
  }),
  start_date: Joi.date().iso().optional().messages({
    'date.format': 'start_date must be a valid ISO date'
  }),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).optional().messages({
    'date.format': 'end_date must be a valid ISO date',
    'date.min': 'end_date must be after start_date'
  })
}).unknown(false);

// Upload ID validation schema
const uploadIdSchema = Joi.object({
  id: Joi.number().integer().min(1).required().messages({
    'number.base': 'Upload ID must be a number',
    'number.integer': 'Upload ID must be an integer',
    'number.min': 'Upload ID must be at least 1',
    'any.required': 'Upload ID is required'
  })
}).unknown(false);

// Stats validation schema
const statsSchema = Joi.object({
  start_date: Joi.date().iso().optional().messages({
    'date.format': 'start_date must be a valid ISO date'
  }),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).optional().messages({
    'date.format': 'end_date must be a valid ISO date',
    'date.min': 'end_date must be after start_date'
  })
}).unknown(false);

// Validation middleware
const validateUpload = (req, res, next) => {
  const { error } = uploadSchema.validate(req.body, { abortEarly: false });
  
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
  
  // Parse JSON fields if they exist using safe parsing
  const { safeParseJSON } = require('../utils/safeJson');
  
  if (req.body.tags && typeof req.body.tags === 'string') {
    const parsedTags = safeParseJSON(req.body.tags, null);
    if (parsedTags === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tags format. Must be valid JSON array.'
      });
    }
    req.body.tags = parsedTags;
  }
  
  if (req.body.metadata && typeof req.body.metadata === 'string') {
    const parsedMetadata = safeParseJSON(req.body.metadata, null);
    if (parsedMetadata === null) {
      return res.status(400).json({
        success: false,
        message: 'Invalid metadata format. Must be valid JSON object.'
      });
    }
    req.body.metadata = parsedMetadata;
  }
  
  next();
};

const validateUpdateUpload = (req, res, next) => {
  const { error } = updateUploadSchema.validate(req.body, { abortEarly: false });
  
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

const validateSearch = (req, res, next) => {
  const { error } = searchSchema.validate(req.query, { abortEarly: false });
  
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

const validateGetUploads = (req, res, next) => {
  const { error } = getUploadsSchema.validate(req.query, { abortEarly: false });
  
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

const validateUploadId = (req, res, next) => {
  const { error } = uploadIdSchema.validate(req.params, { abortEarly: false });
  
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

const validateStats = (req, res, next) => {
  const { error } = statsSchema.validate(req.query, { abortEarly: false });
  
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

module.exports = {
  uploadSchema,
  updateUploadSchema,
  searchSchema,
  getUploadsSchema,
  uploadIdSchema,
  statsSchema,
  validateUpload,
  validateUpdateUpload,
  validateSearch,
  validateGetUploads,
  validateUploadId,
  validateStats
};
