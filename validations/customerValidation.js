const Joi = require('joi');

// Base customer validation schemas
const customerBaseSchema = {
  name: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'Customer name must be at least 2 characters long',
      'string.max': 'Customer name cannot exceed 255 characters',
      'any.required': 'Customer name is required'
    }),
  email: Joi.string().email().max(255).required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email cannot exceed 255 characters',
      'any.required': 'Email is required'
    }),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).max(20).required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'string.max': 'Phone number cannot exceed 20 characters',
      'any.required': 'Phone number is required'
    }),
  address: Joi.string().min(5).max(500).required()
    .messages({
      'string.min': 'Address must be at least 5 characters long',
      'string.max': 'Address cannot exceed 500 characters',
      'any.required': 'Address is required'
    }),
  city: Joi.string().min(2).max(100).required()
    .messages({
      'string.min': 'City must be at least 2 characters long',
      'string.max': 'City cannot exceed 100 characters',
      'any.required': 'City is required'
    }),
  state: Joi.string().length(2).pattern(/^[A-Z]{2}$/).required()
    .messages({
      'string.length': 'State must be exactly 2 characters',
      'string.pattern.base': 'State must be a valid 2-letter abbreviation',
      'any.required': 'State is required'
    }),
  zip_code: Joi.string().pattern(/^\d{5}(-\d{4})?$/).max(10).required()
    .messages({
      'string.pattern.base': 'Please provide a valid ZIP code',
      'string.max': 'ZIP code cannot exceed 10 characters',
      'any.required': 'ZIP code is required'
    }),
  country: Joi.string().max(100).default('USA'),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  status: Joi.string().valid('new', 'quoted', 'scheduled', 'completed', 'inactive', 'blacklisted').default('new'),
  customer_type: Joi.string().valid('residential', 'commercial', 'industrial', 'government').default('residential'),
  property_type: Joi.string().valid('house', 'apartment', 'condo', 'office', 'warehouse', 'retail', 'other').optional(),
  notes: Joi.string().max(1000).optional(),
  source: Joi.string().valid('website', 'google', 'yelp', 'referral', 'facebook', 'instagram', 'phone_book', 'other').default('other'),
  marketing_consent: Joi.boolean().default(false),
  sms_consent: Joi.boolean().default(false),
  email_consent: Joi.boolean().default(false)
};

// Customer contact validation schemas
const customerContactSchema = {
  contact_type: Joi.string().valid('primary', 'secondary', 'emergency', 'billing', 'property_manager').default('secondary'),
  first_name: Joi.string().min(1).max(100).required()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name cannot exceed 100 characters',
      'any.required': 'First name is required'
    }),
  last_name: Joi.string().min(1).max(100).required()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name cannot exceed 100 characters',
      'any.required': 'Last name is required'
    }),
  email: Joi.string().email().max(255).optional()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email cannot exceed 255 characters'
    }),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).max(20).optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'string.max': 'Phone number cannot exceed 20 characters'
    }),
  mobile: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).max(20).optional()
    .messages({
      'string.pattern.base': 'Please provide a valid mobile number',
      'string.max': 'Mobile number cannot exceed 20 characters'
    }),
  relationship: Joi.string().max(100).optional(),
  is_primary_contact: Joi.boolean().default(false),
  can_make_decisions: Joi.boolean().default(false),
  preferred_contact_method: Joi.string().valid('phone', 'email', 'sms', 'mail').default('phone'),
  notes: Joi.string().max(500).optional()
};

// Customer address validation schemas
const customerAddressSchema = {
  address_type: Joi.string().valid('billing', 'service', 'mailing', 'other').default('service'),
  address_line_1: Joi.string().min(5).max(255).required()
    .messages({
      'string.min': 'Address line 1 must be at least 5 characters long',
      'string.max': 'Address line 1 cannot exceed 255 characters',
      'any.required': 'Address line 1 is required'
    }),
  address_line_2: Joi.string().max(255).optional(),
  city: Joi.string().min(2).max(100).required()
    .messages({
      'string.min': 'City must be at least 2 characters long',
      'string.max': 'City cannot exceed 100 characters',
      'any.required': 'City is required'
    }),
  state: Joi.string().length(2).pattern(/^[A-Z]{2}$/).required()
    .messages({
      'string.length': 'State must be exactly 2 characters',
      'string.pattern.base': 'State must be a valid 2-letter abbreviation',
      'any.required': 'State is required'
    }),
  zip_code: Joi.string().pattern(/^\d{5}(-\d{4})?$/).max(10).required()
    .messages({
      'string.pattern.base': 'Please provide a valid ZIP code',
      'string.max': 'ZIP code cannot exceed 10 characters',
      'any.required': 'ZIP code is required'
    }),
  country: Joi.string().max(100).default('USA'),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  is_primary: Joi.boolean().default(false),
  access_notes: Joi.string().max(500).optional(),
  service_area_notes: Joi.string().max(500).optional()
};

// Customer note validation schemas
const customerNoteSchema = {
  note_type: Joi.string().valid('general', 'communication', 'issue', 'follow_up', 'internal').default('general'),
  title: Joi.string().min(3).max(255).required()
    .messages({
      'string.min': 'Note title must be at least 3 characters long',
      'string.max': 'Note title cannot exceed 255 characters',
      'any.required': 'Note title is required'
    }),
  content: Joi.string().min(5).max(2000).required()
    .messages({
      'string.min': 'Note content must be at least 5 characters long',
      'string.max': 'Note content cannot exceed 2000 characters',
      'any.required': 'Note content is required'
    }),
  is_internal: Joi.boolean().default(false),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  due_date: Joi.date().iso().optional()
    .messages({
      'date.format': 'Due date must be a valid ISO date format'
    })
};

// Customer communication validation schemas
const customerCommunicationSchema = {
  communication_type: Joi.string().valid('phone_call', 'email', 'sms', 'in_person', 'portal_message').required()
    .messages({
      'any.required': 'Communication type is required'
    }),
  direction: Joi.string().valid('inbound', 'outbound').required()
    .messages({
      'any.required': 'Communication direction is required'
    }),
  subject: Joi.string().max(255).optional(),
  content: Joi.string().max(2000).optional(),
  duration_seconds: Joi.number().integer().min(0).max(86400).optional()
    .messages({
      'number.integer': 'Duration must be a whole number',
      'number.min': 'Duration cannot be negative',
      'number.max': 'Duration cannot exceed 24 hours (86400 seconds)'
    }),
  contact_person_id: Joi.string().uuid().optional(),
  employee_id: Joi.string().uuid().optional(),
  status: Joi.string().valid('initiated', 'in_progress', 'completed', 'failed', 'scheduled').default('completed'),
  scheduled_at: Joi.date().iso().optional(),
  follow_up_required: Joi.boolean().default(false),
  follow_up_date: Joi.date().iso().optional(),
  follow_up_notes: Joi.string().max(500).optional()
};

// Customer preference validation schemas
const customerPreferenceSchema = {
  preference_key: Joi.string().min(1).max(100).required()
    .messages({
      'string.min': 'Preference key is required',
      'string.max': 'Preference key cannot exceed 100 characters',
      'any.required': 'Preference key is required'
    }),
  preference_value: Joi.string().max(1000).optional(),
  preference_type: Joi.string().valid('string', 'number', 'boolean', 'json').default('string'),
  description: Joi.string().max(500).optional()
};

// Customer tag assignment validation schemas
const customerTagAssignmentSchema = {
  tag_id: Joi.string().uuid().required()
    .messages({
      'any.required': 'Tag ID is required',
      'string.guid': 'Tag ID must be a valid UUID'
    }),
  notes: Joi.string().max(500).optional()
};

// Customer service history validation schemas
const customerServiceHistorySchema = {
  service_date: Joi.date().iso().required()
    .messages({
      'any.required': 'Service date is required',
      'date.format': 'Service date must be a valid ISO date format'
    }),
  service_type: Joi.string().min(2).max(100).required()
    .messages({
      'string.min': 'Service type must be at least 2 characters long',
      'string.max': 'Service type cannot exceed 100 characters',
      'any.required': 'Service type is required'
    }),
  service_description: Joi.string().max(1000).optional(),
  service_value: Joi.number().precision(2).min(0).max(999999.99).optional()
    .messages({
      'number.precision': 'Service value can have up to 2 decimal places',
      'number.min': 'Service value cannot be negative',
      'number.max': 'Service value cannot exceed 999,999.99'
    }),
  employee_id: Joi.string().uuid().optional(),
  customer_satisfaction: Joi.number().integer().min(1).max(5).optional()
    .messages({
      'number.integer': 'Customer satisfaction must be a whole number',
      'number.min': 'Customer satisfaction must be at least 1',
      'number.max': 'Customer satisfaction cannot exceed 5'
    }),
  feedback: Joi.string().max(1000).optional(),
  follow_up_required: Joi.boolean().default(false),
  follow_up_notes: Joi.string().max(500).optional()
};

// Customer marketing validation schemas
const customerMarketingSchema = {
  campaign_name: Joi.string().min(2).max(255).required()
    .messages({
      'string.min': 'Campaign name must be at least 2 characters long',
      'string.max': 'Campaign name cannot exceed 255 characters',
      'any.required': 'Campaign name is required'
    }),
  campaign_type: Joi.string().valid('email', 'sms', 'direct_mail', 'social_media', 'other').required()
    .messages({
      'any.required': 'Campaign type is required'
    }),
  sent_at: Joi.date().iso().optional(),
  opened_at: Joi.date().iso().optional(),
  clicked_at: Joi.date().iso().optional(),
  responded_at: Joi.date().iso().optional(),
  response_type: Joi.string().valid('positive', 'negative', 'neutral', 'unsubscribe').optional(),
  notes: Joi.string().max(500).optional()
};

// Validation schemas for different operations
const createCustomerSchema = Joi.object({
  ...customerBaseSchema,
  contacts: Joi.array().items(Joi.object(customerContactSchema)).optional(),
  addresses: Joi.array().items(Joi.object(customerAddressSchema)).optional(),
  preferences: Joi.object().pattern(Joi.string(), Joi.any()).optional()
});

const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  email: Joi.string().email().max(255).optional(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).max(20).optional(),
  address: Joi.string().min(5).max(500).optional(),
  city: Joi.string().min(2).max(100).optional(),
  state: Joi.string().length(2).pattern(/^[A-Z]{2}$/).optional(),
  zip_code: Joi.string().pattern(/^\d{5}(-\d{4})?$/).max(10).optional(),
  country: Joi.string().max(100).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  status: Joi.string().valid('new', 'quoted', 'scheduled', 'completed', 'inactive', 'blacklisted').optional(),
  customer_type: Joi.string().valid('residential', 'commercial', 'industrial', 'government').optional(),
  property_type: Joi.string().valid('house', 'apartment', 'condo', 'office', 'warehouse', 'retail', 'other').optional(),
  notes: Joi.string().max(1000).optional(),
  source: Joi.string().valid('website', 'google', 'yelp', 'referral', 'facebook', 'instagram', 'phone_book', 'other').optional(),
  marketing_consent: Joi.boolean().optional(),
  sms_consent: Joi.boolean().optional(),
  email_consent: Joi.boolean().optional()
});

const getCustomersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100).optional(),
  status: Joi.string().valid('new', 'quoted', 'scheduled', 'completed', 'inactive', 'blacklisted').optional(),
  customer_type: Joi.string().valid('residential', 'commercial', 'industrial', 'government').optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().length(2).pattern(/^[A-Z]{2}$/).optional(),
  sort_by: Joi.string().valid('name', 'email', 'city', 'state', 'created_at', 'last_contact_date', 'total_spent').default('name'),
  sort_order: Joi.string().valid('asc', 'desc').default('asc'),
  include_inactive: Joi.boolean().default(false)
});

const searchCustomersQuerySchema = Joi.object({
  q: Joi.string().min(1).max(100).required()
    .messages({
      'any.required': 'Search query is required',
      'string.min': 'Search query must be at least 1 character long',
      'string.max': 'Search query cannot exceed 100 characters'
    }),
  search_fields: Joi.string().pattern(/^[a-zA-Z_,]+$/).optional()
    .messages({
      'string.pattern.base': 'Search fields must be comma-separated field names'
    }),
  customer_type: Joi.string().valid('residential', 'commercial', 'industrial', 'government').optional(),
  status: Joi.string().valid('new', 'quoted', 'scheduled', 'completed', 'inactive', 'blacklisted').optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().length(2).pattern(/^[A-Z]{2}$/).optional(),
  has_active_jobs: Joi.boolean().optional(),
  min_total_spent: Joi.number().min(0).optional(),
  max_total_spent: Joi.number().min(0).optional()
});

const customerIdParamSchema = Joi.object({
  id: Joi.string().uuid().required()
    .messages({
      'any.required': 'Customer ID is required',
      'string.guid': 'Customer ID must be a valid UUID'
    })
});

const contactIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  contactId: Joi.string().uuid().required()
});

const addressIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  addressId: Joi.string().uuid().required()
});

const tagIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  tagId: Joi.string().uuid().required()
});

const noteIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  noteId: Joi.string().uuid().required()
});

const communicationIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  communicationId: Joi.string().uuid().required()
});

const preferenceIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  preferenceId: Joi.string().uuid().required()
});

const serviceHistoryIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  serviceHistoryId: Joi.string().uuid().required()
});

const marketingIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  marketingId: Joi.string().uuid().required()
});

// Report query schemas
const customerReportQuerySchema = Joi.object({
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  customer_type: Joi.string().valid('residential', 'commercial', 'industrial', 'government').optional(),
  status: Joi.string().valid('new', 'quoted', 'scheduled', 'completed', 'inactive', 'blacklisted').optional(),
  format: Joi.string().valid('json', 'pdf').default('json')
});

// Export all validation schemas
module.exports = {
  // Customer CRUD operations
  createCustomer: createCustomerSchema,
  updateCustomer: updateCustomerSchema,
  getCustomers: getCustomersQuerySchema,
  searchCustomers: searchCustomersQuerySchema,
  customerId: customerIdParamSchema,
  
  // Customer contacts
  createCustomerContact: Joi.object(customerContactSchema),
  updateCustomerContact: Joi.object(customerContactSchema).min(1),
  contactId: contactIdParamSchema,
  
  // Customer addresses
  createCustomerAddress: Joi.object(customerAddressSchema),
  updateCustomerAddress: Joi.object(customerAddressSchema).min(1),
  addressId: addressIdParamSchema,
  
  // Customer tags
  assignCustomerTag: Joi.object(customerTagAssignmentSchema),
  tagId: tagIdParamSchema,
  
  // Customer notes
  createCustomerNote: Joi.object(customerNoteSchema),
  updateCustomerNote: Joi.object(customerNoteSchema).min(1),
  noteId: noteIdParamSchema,
  
  // Customer communications
  createCustomerCommunication: Joi.object(customerCommunicationSchema),
  updateCustomerCommunication: Joi.object(customerCommunicationSchema).min(1),
  communicationId: communicationIdParamSchema,
  
  // Customer preferences
  createCustomerPreference: Joi.object(customerPreferenceSchema),
  updateCustomerPreference: Joi.object(customerPreferenceSchema).min(1),
  preferenceId: preferenceIdParamSchema,
  
  // Customer service history
  createCustomerServiceHistory: Joi.object(customerServiceHistorySchema),
  updateCustomerServiceHistory: Joi.object(customerServiceHistorySchema).min(1),
  serviceHistoryId: serviceHistoryIdParamSchema,
  
  // Customer marketing
  createCustomerMarketing: Joi.object(customerMarketingSchema),
  updateCustomerMarketing: Joi.object(customerMarketingSchema).min(1),
  marketingId: marketingIdParamSchema,
  
  // Reports
  customerReport: customerReportQuerySchema,
  
  // Base schemas for reuse
  customerBase: customerBaseSchema,
  customerContact: customerContactSchema,
  customerAddress: customerAddressSchema,
  customerNote: customerNoteSchema,
  customerCommunication: customerCommunicationSchema,
  customerPreference: customerPreferenceSchema,
  customerTagAssignment: customerTagAssignmentSchema,
  customerServiceHistory: customerServiceHistorySchema,
  customerMarketing: customerMarketingSchema
};
