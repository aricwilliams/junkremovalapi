const Joi = require('joi');

// Base schemas for reuse
const baseLocationSchema = Joi.object({
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().length(2).required(),
  zip_code: Joi.string().max(10).required(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  gate_code: Joi.string().max(50).optional(),
  apartment_number: Joi.string().max(50).optional(),
  location_on_property: Joi.string().max(100).optional(),
  access_considerations: Joi.string().optional()
});

const baseContactSchema = Joi.object({
  phone: Joi.string().max(20).optional(),
  mobile: Joi.string().max(20).optional(),
  email: Joi.string().email().optional()
});

const notificationPreferencesSchema = Joi.object({
  email_notifications: Joi.boolean().default(true),
  sms_notifications: Joi.boolean().default(false),
  push_notifications: Joi.boolean().default(true),
  marketing_emails: Joi.boolean().default(false),
  service_updates: Joi.boolean().default(true),
  payment_reminders: Joi.boolean().default(true)
});

const communicationPreferencesSchema = Joi.object({
  preferred_contact_time: Joi.string().valid('business_hours', 'anytime', 'evenings', 'weekends').default('business_hours'),
  preferred_contact_method: Joi.string().valid('email', 'phone', 'sms').default('email')
});

// Portal Users Validation Schemas
const getAllPortalUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100).optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
  user_type: Joi.string().valid('customer', 'business', 'contractor').optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  sort_by: Joi.string().valid('created_at', 'username', 'email', 'last_login', 'role').default('created_at'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
});

const getPortalUserByIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const createPortalUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  confirm_password: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords must match'
  }),
  personal_info: Joi.object({
    first_name: Joi.string().max(100).required(),
    last_name: Joi.string().max(100).required(),
    phone: Joi.string().max(20).optional(),
    mobile: Joi.string().max(20).optional(),
    date_of_birth: Joi.date().iso().optional(),
    preferred_contact_method: Joi.string().valid('email', 'phone', 'sms').default('email')
  }).required(),
  user_type: Joi.string().valid('customer', 'business', 'contractor').default('customer'),
  preferences: Joi.object({
    language: Joi.string().valid('en', 'es', 'fr').default('en'),
    timezone: Joi.string().default('America/New_York'),
    notification_preferences: notificationPreferencesSchema,
    communication_preferences: communicationPreferencesSchema
  }).optional(),
  billing_info: Joi.object({
    billing_address: Joi.object({
      street: Joi.string().max(255).optional(),
      city: Joi.string().max(100).optional(),
      state: Joi.string().max(2).optional(),
      zip_code: Joi.string().max(10).optional(),
      country: Joi.string().max(100).default('USA')
    }).optional()
  }).optional(),
  terms_accepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must accept the terms and conditions'
  }),
  privacy_policy_accepted: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must accept the privacy policy'
  })
});

const updatePortalUserSchema = Joi.object({
  personal_info: Joi.object({
    first_name: Joi.string().max(100).optional(),
    last_name: Joi.string().max(100).optional(),
    phone: Joi.string().max(20).optional(),
    mobile: Joi.string().max(20).optional(),
    date_of_birth: Joi.date().iso().optional(),
    preferred_contact_method: Joi.string().valid('email', 'phone', 'sms').optional()
  }).optional(),
  preferences: Joi.object({
    language: Joi.string().valid('en', 'es', 'fr').optional(),
    timezone: Joi.string().optional(),
    notification_preferences: notificationPreferencesSchema.optional(),
    communication_preferences: communicationPreferencesSchema.optional()
  }).optional(),
  status: Joi.string().valid('active', 'inactive', 'suspended').optional()
});

const deletePortalUserSchema = Joi.object({
  id: Joi.string().uuid().required()
});

// Portal Authentication Validation Schemas
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const logoutSchema = Joi.object({
  // No body required for logout
});

const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().required()
});

// Service Requests Validation Schemas
const getAllServiceRequestsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('pending', 'reviewing', 'quoted', 'scheduled', 'in-progress', 'completed', 'cancelled').optional(),
  request_type: Joi.string().valid('pickup', 'service', 'emergency', 'maintenance', 'consultation').optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  sort_by: Joi.string().valid('created_at', 'requested_date', 'preferred_date', 'priority', 'status').default('created_at'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
});

const getServiceRequestByIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const createServiceRequestSchema = Joi.object({
  title: Joi.string().max(255).required(),
  description: Joi.string().required(),
  request_type: Joi.string().valid('pickup', 'service', 'emergency', 'maintenance', 'consultation').default('service'),
  priority: Joi.string().valid('urgent', 'high', 'medium', 'low', 'standard').default('standard'),
  location: baseLocationSchema.required(),
  items: Joi.array().items(Joi.object({
    description: Joi.string().required(),
    quantity: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
    size: Joi.string().optional(),
    condition: Joi.string().optional()
  })).optional(),
  scheduling: Joi.object({
    preferred_date: Joi.date().iso().required(),
    preferred_time: Joi.string().max(50).optional(),
    flexible_timing: Joi.boolean().default(true),
    estimated_duration: Joi.string().max(100).optional()
  }).required(),
  material_types: Joi.array().items(Joi.string()).optional(),
  hazardous_material: Joi.boolean().default(false),
  hazardous_description: Joi.string().optional(),
  oversized_items: Joi.boolean().default(false),
  oversized_description: Joi.string().optional(),
  heavy_lifting_required: Joi.boolean().default(false),
  disassembly_required: Joi.boolean().default(false),
  disassembly_description: Joi.string().optional(),
  notes: Joi.string().optional()
});

const updateServiceRequestSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional(),
  priority: Joi.string().valid('urgent', 'high', 'medium', 'low', 'standard').optional(),
  location: baseLocationSchema.optional(),
  scheduling: Joi.object({
    preferred_date: Joi.date().iso().optional(),
    preferred_time: Joi.string().max(50).optional(),
    flexible_timing: Joi.boolean().optional(),
    estimated_duration: Joi.string().max(100).optional()
  }).optional(),
  notes: Joi.string().optional()
});

const cancelServiceRequestSchema = Joi.object({
  cancellation_reason: Joi.string().required(),
  cancellation_notes: Joi.string().optional()
});

// Job History Validation Schemas
const getJobHistorySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  sort_by: Joi.string().valid('scheduled_date', 'completed_date', 'created_at').default('scheduled_date'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
});

const getJobDetailsSchema = Joi.object({
  id: Joi.string().uuid().required()
});

// Invoice Management Validation Schemas
const getInvoicesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('pending', 'paid', 'overdue', 'cancelled').optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  sort_by: Joi.string().valid('due_date', 'issue_date', 'amount', 'created_at').default('due_date'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
});

const getInvoiceDetailsSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const payInvoiceSchema = Joi.object({
  payment_method: Joi.string().valid('credit_card', 'debit_card', 'bank_transfer', 'check', 'cash').required(),
  payment_reference: Joi.string().max(100).optional(),
  amount: Joi.number().positive().required(),
  notes: Joi.string().optional()
});

// Client Profile Validation Schemas
const getClientProfileSchema = Joi.object({
  // No body required for getting profile
});

const updateClientProfileSchema = Joi.object({
  personal_info: Joi.object({
    first_name: Joi.string().max(100).optional(),
    last_name: Joi.string().max(100).optional(),
    phone: Joi.string().max(20).optional(),
    mobile: Joi.string().max(20).optional(),
    date_of_birth: Joi.date().iso().optional(),
    preferred_contact_method: Joi.string().valid('email', 'phone', 'sms').optional()
  }).optional(),
  addresses: Joi.array().items(Joi.object({
    id: Joi.string().uuid().optional(),
    type: Joi.string().valid('primary', 'billing', 'shipping').required(),
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().length(2).required(),
    zip_code: Joi.string().max(10).required(),
    country: Joi.string().default('USA'),
    is_default: Joi.boolean().default(false)
  })).optional(),
  preferences: Joi.object({
    language: Joi.string().valid('en', 'es', 'fr').optional(),
    timezone: Joi.string().optional(),
    notification_preferences: notificationPreferencesSchema.optional(),
    communication_preferences: communicationPreferencesSchema.optional()
  }).optional()
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).max(128).required(),
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required().messages({
    'any.only': 'Passwords do not match'
  })
});

// Portal Reports Validation Schemas
const getServiceSummaryReportSchema = Joi.object({
  date_from: Joi.date().iso().required(),
  date_to: Joi.date().iso().required(),
  format: Joi.string().valid('json', 'pdf').default('json')
});

// Portal Settings Validation Schemas
const getPortalSettingsSchema = Joi.object({
  // No body required for getting settings
});

const updatePortalSettingsSchema = Joi.object({
  general_settings: Joi.object({
    default_language: Joi.string().valid('en', 'es', 'fr').optional(),
    default_timezone: Joi.string().optional(),
    date_format: Joi.string().valid('MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD').optional(),
    time_format: Joi.string().valid('12-hour', '24-hour').optional()
  }).optional(),
  notification_settings: notificationPreferencesSchema.optional(),
  privacy_settings: Joi.object({
    profile_visibility: Joi.string().valid('private', 'public', 'contacts_only').optional(),
    service_history_visibility: Joi.string().valid('private', 'public', 'contacts_only').optional(),
    allow_marketing_communications: Joi.boolean().optional()
  }).optional(),
  security_settings: Joi.object({
    two_factor_authentication: Joi.boolean().optional(),
    session_timeout_minutes: Joi.number().integer().min(15).max(480).optional(),
    password_expiry_days: Joi.number().integer().min(30).max(365).optional(),
    login_attempts_limit: Joi.number().integer().min(3).max(10).optional()
  }).optional()
});

module.exports = {
  // Portal Users
  getAllPortalUsersSchema,
  getPortalUserByIdSchema,
  createPortalUserSchema,
  updatePortalUserSchema,
  deletePortalUserSchema,
  
  // Portal Authentication
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  
  // Service Requests
  getAllServiceRequestsSchema,
  getServiceRequestByIdSchema,
  createServiceRequestSchema,
  updateServiceRequestSchema,
  cancelServiceRequestSchema,
  
  // Job History
  getJobHistorySchema,
  getJobDetailsSchema,
  
  // Invoice Management
  getInvoicesSchema,
  getInvoiceDetailsSchema,
  payInvoiceSchema,
  
  // Client Profile
  getClientProfileSchema,
  updateClientProfileSchema,
  changePasswordSchema,
  
  // Portal Reports
  getServiceSummaryReportSchema,
  
  // Portal Settings
  getPortalSettingsSchema,
  updatePortalSettingsSchema
};
