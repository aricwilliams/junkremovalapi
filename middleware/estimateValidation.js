const Joi = require('joi');

// Estimate validation schema
const estimateSchema = Joi.object({
  // Client Information
  is_new_client: Joi.boolean().optional().messages({
    'boolean.base': 'Is new client must be a boolean value'
  }),
  existing_client_id: Joi.number().integer().optional().allow(null).messages({
    'number.base': 'Existing client ID must be a number',
    'number.integer': 'Existing client ID must be an integer'
  }),
  
  // Basic Contact Information
  full_name: Joi.string().min(2).max(255).required().messages({
    'string.empty': 'Full name is required',
    'string.min': 'Full name must be at least 2 characters long',
    'string.max': 'Full name cannot exceed 255 characters',
    'any.required': 'Full name is required'
  }),
  phone_number: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required().messages({
    'string.empty': 'Phone number is required',
    'string.pattern.base': 'Phone number must be a valid phone number',
    'any.required': 'Phone number is required'
  }),
  email_address: Joi.string().email().required().messages({
    'string.empty': 'Email address is required',
    'string.email': 'Email address must be a valid email address',
    'any.required': 'Email address is required'
  }),
  ok_to_text: Joi.boolean().optional().allow(null).messages({
    'boolean.base': 'OK to text must be a boolean value'
  }),
  
  // Service Address
  service_address: Joi.string().min(5).max(1000).required().messages({
    'string.empty': 'Service address is required',
    'string.min': 'Service address must be at least 5 characters long',
    'string.max': 'Service address cannot exceed 1000 characters',
    'any.required': 'Service address is required'
  }),
  gate_code: Joi.string().max(100).optional().allow('', null).messages({
    'string.max': 'Gate code cannot exceed 100 characters'
  }),
  apartment_unit: Joi.string().max(50).optional().allow('', null).messages({
    'string.max': 'Apartment unit cannot exceed 50 characters'
  }),
  
  // Project Details
  preferred_date: Joi.date().optional().allow(null).messages({
    'date.base': 'Preferred date must be a valid date'
  }),
  preferred_time: Joi.string().max(50).optional().allow('', null).messages({
    'string.max': 'Preferred time cannot exceed 50 characters'
  }),
  location_on_property: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Location on property is required',
    'string.min': 'Location on property must be at least 2 characters long',
    'string.max': 'Location on property cannot exceed 100 characters',
    'any.required': 'Location on property is required'
  }),
  approximate_volume: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Approximate volume is required',
    'string.min': 'Approximate volume must be at least 2 characters long',
    'string.max': 'Approximate volume cannot exceed 100 characters',
    'any.required': 'Approximate volume is required'
  }),
  access_considerations: Joi.string().max(1000).optional().allow('', null).messages({
    'string.max': 'Access considerations cannot exceed 1000 characters'
  }),
  
  // Photos & Media
  photos: Joi.array().items(Joi.string()).optional().allow(null).messages({
    'array.base': 'Photos must be an array of strings'
  }),
  videos: Joi.array().items(Joi.string()).optional().allow(null).messages({
    'array.base': 'Videos must be an array of strings'
  }),
  
  // Item Type & Condition
  material_types: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.base': 'Material types must be an array',
    'array.min': 'At least one material type must be selected',
    'any.required': 'Material types are required'
  }),
  approximate_item_count: Joi.string().max(255).optional().allow('', null).messages({
    'string.max': 'Approximate item count cannot exceed 255 characters'
  }),
  items_filled_water: Joi.boolean().optional().allow(null).messages({
    'boolean.base': 'Items filled water must be a boolean value'
  }),
  items_filled_oil_fuel: Joi.boolean().optional().allow(null).messages({
    'boolean.base': 'Items filled oil/fuel must be a boolean value'
  }),
  hazardous_materials: Joi.boolean().optional().allow(null).messages({
    'boolean.base': 'Hazardous materials must be a boolean value'
  }),
  items_tied_bags: Joi.boolean().optional().allow(null).messages({
    'boolean.base': 'Items tied bags must be a boolean value'
  }),
  oversized_items: Joi.boolean().optional().allow(null).messages({
    'boolean.base': 'Oversized items must be a boolean value'
  }),
  
  // Safety & Hazards
  mold_present: Joi.boolean().optional().allow(null).messages({
    'boolean.base': 'Mold present must be a boolean value'
  }),
  pests_present: Joi.boolean().optional().allow(null).messages({
    'boolean.base': 'Pests present must be a boolean value'
  }),
  sharp_objects: Joi.boolean().optional().allow(null).messages({
    'boolean.base': 'Sharp objects must be a boolean value'
  }),
  heavy_lifting_required: Joi.boolean().optional().allow(null).messages({
    'boolean.base': 'Heavy lifting required must be a boolean value'
  }),
  disassembly_required: Joi.boolean().optional().allow(null).messages({
    'boolean.base': 'Disassembly required must be a boolean value'
  }),
  
  // Additional Information & Services
  additional_notes: Joi.string().max(1000).optional().allow('', null).messages({
    'string.max': 'Additional notes cannot exceed 1000 characters'
  }),
  request_donation_pickup: Joi.boolean().optional().allow(null).messages({
    'boolean.base': 'Request donation pickup must be a boolean value'
  }),
  request_demolition_addon: Joi.boolean().optional().allow(null).messages({
    'boolean.base': 'Request demolition addon must be a boolean value'
  }),
  
  // Follow-up & Priority
  how_did_you_hear: Joi.string().max(255).optional().allow('', null).messages({
    'string.max': 'How did you hear cannot exceed 255 characters'
  }),
  request_priority: Joi.string().valid('standard', 'urgent', 'low').optional().allow(null).messages({
    'any.only': 'Request priority must be one of: standard, urgent, low'
  }),
  
  // System Fields
  status: Joi.string().valid('pending', 'reviewed', 'quoted', 'accepted', 'declined', 'expired', 'need review').optional().allow(null).messages({
    'any.only': 'Status must be one of: pending, reviewed, quoted, accepted, declined, expired, need review'
  }),
  quote_amount: Joi.number().precision(2).min(0).optional().allow(null).messages({
    'number.base': 'Quote amount must be a number',
    'number.min': 'Quote amount must be greater than or equal to 0'
  }),
  amount: Joi.number().precision(2).min(0).optional().allow(null).messages({
    'number.base': 'Amount must be a number',
    'number.min': 'Amount must be greater than or equal to 0'
  }),
  quote_notes: Joi.string().max(1000).optional().allow('', null).messages({
    'string.max': 'Quote notes cannot exceed 1000 characters'
  })
}).unknown(true);

// Status update validation schema (only allows status field)
const statusUpdateSchema = Joi.object({
  status: Joi.string().valid('accepted', 'declined').required().messages({
    'string.empty': 'Status is required',
    'any.only': 'Status must be either "accepted" or "declined"',
    'any.required': 'Status is required'
  })
}).unknown(false); // Reject any unknown fields

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

// Status update validation middleware
const validateStatusUpdate = (req, res, next) => {
  // Check for unknown fields first
  const allowedFields = ['status'];
  const requestFields = Object.keys(req.body);
  const unknownFields = requestFields.filter(field => !allowedFields.includes(field));
  
  if (unknownFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [{
        field: 'body',
        message: `Unknown fields not allowed: ${unknownFields.join(', ')}`
      }],
      timestamp: new Date().toISOString()
    });
  }
  
  const { error } = statusUpdateSchema.validate(req.body, { abortEarly: false });
  
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
  statusUpdateSchema,
  validateEstimate,
  validateStatusUpdate
};