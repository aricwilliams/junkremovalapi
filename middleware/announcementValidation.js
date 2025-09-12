const Joi = require('joi');

// Validation schemas
const createAnnouncementSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Message cannot be empty',
      'string.min': 'Message must be at least 1 character long',
      'string.max': 'Message cannot exceed 1000 characters',
      'any.required': 'Message is required'
    }),
  is_visible: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'is_visible must be a boolean value'
    })
});

const updateAnnouncementSchema = Joi.object({
  message: Joi.string()
    .min(1)
    .max(1000)
    .optional()
    .messages({
      'string.empty': 'Message cannot be empty',
      'string.min': 'Message must be at least 1 character long',
      'string.max': 'Message cannot exceed 1000 characters'
    }),
  is_visible: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'is_visible must be a boolean value'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const announcementIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'ID must be a number',
      'number.integer': 'ID must be an integer',
      'number.positive': 'ID must be a positive number',
      'any.required': 'ID is required'
    })
});

// Validation middleware functions
const validateCreateAnnouncement = (req, res, next) => {
  const { error, value } = createAnnouncementSchema.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
      error: 'VALIDATION_ERROR'
    });
  }

  req.validatedData = value;
  next();
};

const validateUpdateAnnouncement = (req, res, next) => {
  const { error, value } = updateAnnouncementSchema.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors,
      error: 'VALIDATION_ERROR'
    });
  }

  req.validatedData = value;
  next();
};

const validateAnnouncementId = (req, res, next) => {
  const { error } = announcementIdSchema.validate(req.params);

  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Invalid announcement ID',
      error: 'INVALID_ID'
    });
  }

  next();
};

module.exports = {
  validateCreateAnnouncement,
  validateUpdateAnnouncement,
  validateAnnouncementId
};
