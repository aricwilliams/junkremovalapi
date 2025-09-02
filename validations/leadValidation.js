const Joi = require('joi');

// Base schemas for common fields
const leadBaseSchema = {
  name: Joi.string().min(1).max(255).required(),
  company: Joi.string().max(255).allow(null, ''),
  email: Joi.string().email().max(255).required(),
  phone: Joi.string().max(20).required(),
  mobile: Joi.string().max(20).allow(null, ''),
  address: Joi.string().max(500).required(),
  city: Joi.string().max(100).required(),
  state: Joi.string().length(2).required(),
  zip_code: Joi.string().max(10).required(),
  country: Joi.string().max(100).default('USA'),
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'quoted', 'scheduled', 'lost', 'converted', 'deleted').default('new'),
  source: Joi.string().valid('website', 'google', 'yelp', 'referral', 'facebook', 'instagram', 'phone_book', 'direct_mail', 'trade_show', 'cold_call', 'social_media', 'other').default('other'),
  estimated_value: Joi.number().min(0).precision(2).allow(null),
  service_type: Joi.string().max(255).allow(null, ''),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  lead_score: Joi.number().integer().min(0).max(100).default(0),
  notes: Joi.string().max(1000).allow(null, ''),
  assigned_to: Joi.string().uuid().allow(null, ''),
  next_follow_up_date: Joi.date().allow(null)
};

const leadContactSchema = {
  contact_type: Joi.string().valid('primary', 'secondary', 'decision_maker', 'influencer', 'other').default('primary'),
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  title: Joi.string().max(100).allow(null, ''),
  email: Joi.string().email().max(255).allow(null, ''),
  phone: Joi.string().max(20).allow(null, ''),
  mobile: Joi.string().max(20).allow(null, ''),
  relationship: Joi.string().max(100).allow(null, ''),
  is_primary_contact: Joi.boolean().default(false),
  can_make_decisions: Joi.boolean().default(false),
  preferred_contact_method: Joi.string().valid('phone', 'email', 'sms', 'mail').default('phone'),
  notes: Joi.string().max(500).allow(null, '')
};

const leadActivitySchema = {
  activity_type: Joi.string().valid('phone_call', 'email', 'sms', 'meeting', 'site_visit', 'quote_sent', 'follow_up', 'initial_contact', 'other').required(),
  subject: Joi.string().max(255).allow(null, ''),
  description: Joi.string().min(1).max(1000).required(),
  activity_date: Joi.date().default(Date.now),
  duration_minutes: Joi.number().integer().min(1).max(480).allow(null),
  outcome: Joi.string().valid('positive', 'negative', 'neutral', 'scheduled', 'rescheduled', 'cancelled').default('neutral'),
  next_action: Joi.string().max(255).allow(null, ''),
  next_action_date: Joi.date().allow(null),
  scheduled_follow_up: Joi.date().allow(null),
  notes: Joi.string().max(500).allow(null, '')
};

const leadNoteSchema = {
  note_type: Joi.string().valid('general', 'communication', 'qualification', 'objection', 'follow_up', 'internal').default('general'),
  title: Joi.string().min(1).max(255).required(),
  content: Joi.string().min(1).max(2000).required(),
  is_internal: Joi.boolean().default(false),
  is_important: Joi.boolean().default(false),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  due_date: Joi.date().allow(null)
};

const leadQualificationSchema = {
  is_qualified: Joi.boolean().default(false),
  qualification_score: Joi.number().integer().min(0).max(100).default(0),
  qualification_notes: Joi.string().max(1000).allow(null, ''),
  qualification_criteria: Joi.object().allow(null)
};

const leadFollowUpSchema = {
  follow_up_type: Joi.string().valid('call', 'email', 'meeting', 'site_visit', 'quote_follow_up', 'other').required(),
  subject: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).allow(null, ''),
  scheduled_date: Joi.date().required(),
  scheduled_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null, ''),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  assigned_to: Joi.string().uuid().allow(null, ''),
  notes: Joi.string().max(500).allow(null, '')
};

const leadConversionSchema = {
  customer_name: Joi.string().min(1).max(255).required(),
  customer_type: Joi.string().valid('residential', 'commercial').required(),
  first_job_details: Joi.object({
    service_type: Joi.string().max(255).required(),
    estimated_value: Joi.number().min(0).precision(2).required(),
    preferred_date: Joi.date().allow(null),
    notes: Joi.string().max(1000).allow(null, '')
  }).required(),
  billing_info: Joi.object({
    billing_address: Joi.string().max(500).required(),
    payment_terms: Joi.string().max(100).allow(null, '')
  }).allow(null)
};

const leadWorkflowSchema = {
  workflow_name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).allow(null, ''),
  triggers: Joi.array().items(Joi.string()).min(1).required(),
  conditions: Joi.object().allow(null),
  actions: Joi.array().items(Joi.object({
    type: Joi.string().valid('send_email', 'schedule_follow_up', 'reassign_lead', 'send_notification', 'update_status', 'other').required(),
    template: Joi.string().max(255).allow(null),
    delay_hours: Joi.number().integer().min(0).allow(null),
    assigned_to: Joi.string().uuid().allow(null),
    recipients: Joi.array().items(Joi.string()).allow(null)
  })).min(1).required(),
  is_active: Joi.boolean().default(true)
};

// Validation schemas for different operations
const createLeadSchema = Joi.object({
  ...leadBaseSchema,
  contacts: Joi.array().items(Joi.object(leadContactSchema)).max(10).allow(null),
  project_details: Joi.object({
    description: Joi.string().max(1000).allow(null, ''),
    timeline: Joi.string().max(100).allow(null, ''),
    budget_range: Joi.string().max(100).allow(null, ''),
    urgency: Joi.string().valid('low', 'medium', 'high', 'urgent').allow(null, '')
  }).allow(null),
  tags: Joi.array().items(Joi.string().uuid()).allow(null)
});

const updateLeadSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  company: Joi.string().max(255).allow(null, ''),
  email: Joi.string().email().max(255),
  phone: Joi.string().max(20),
  mobile: Joi.string().max(20).allow(null, ''),
  address: Joi.string().max(500),
  city: Joi.string().max(100),
  state: Joi.string().length(2),
  zip_code: Joi.string().max(10),
  country: Joi.string().max(100),
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'quoted', 'scheduled', 'lost', 'converted', 'deleted'),
  source: Joi.string().valid('website', 'google', 'yelp', 'referral', 'facebook', 'instagram', 'phone_book', 'direct_mail', 'trade_show', 'cold_call', 'social_media', 'other'),
  estimated_value: Joi.number().min(0).precision(2).allow(null),
  service_type: Joi.string().max(255).allow(null, ''),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  lead_score: Joi.number().integer().min(0).max(100),
  notes: Joi.string().max(1000).allow(null, ''),
  assigned_to: Joi.string().uuid().allow(null, ''),
  next_follow_up_date: Joi.date().allow(null)
});

const getLeadsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(255).allow(null, ''),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'quoted', 'scheduled', 'lost', 'converted', 'deleted').allow(null, ''),
  source: Joi.string().valid('website', 'google', 'yelp', 'referral', 'facebook', 'instagram', 'phone_book', 'direct_mail', 'trade_show', 'cold_call', 'social_media', 'other').allow(null, ''),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').allow(null, ''),
  assigned_to: Joi.string().uuid().allow(null, ''),
  date_from: Joi.date().allow(null),
  date_to: Joi.date().allow(null),
  sort_by: Joi.string().valid('name', 'company', 'email', 'city', 'state', 'created_at', 'last_contact_date', 'estimated_value', 'lead_score').default('created_at'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
});

const searchLeadsSchema = Joi.object({
  q: Joi.string().min(1).max(255).required(),
  search_fields: Joi.string().max(500).default('name,company,email,phone'),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'quoted', 'scheduled', 'lost', 'converted', 'deleted').allow(null, ''),
  source: Joi.string().valid('website', 'google', 'yelp', 'referral', 'facebook', 'instagram', 'phone_book', 'direct_mail', 'trade_show', 'cold_call', 'social_media', 'other').allow(null, ''),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').allow(null, ''),
  assigned_to: Joi.string().uuid().allow(null, ''),
  min_estimated_value: Joi.number().min(0).precision(2).allow(null),
  max_estimated_value: Joi.number().min(0).precision(2).allow(null),
  service_type: Joi.string().max(255).allow(null, '')
});

const createLeadContactSchema = Joi.object(leadContactSchema);

const updateLeadContactSchema = Joi.object({
  contact_type: Joi.string().valid('primary', 'secondary', 'decision_maker', 'influencer', 'other'),
  first_name: Joi.string().min(1).max(100),
  last_name: Joi.string().min(1).max(100),
  title: Joi.string().max(100).allow(null, ''),
  email: Joi.string().email().max(255).allow(null, ''),
  phone: Joi.string().max(20).allow(null, ''),
  mobile: Joi.string().max(20).allow(null, ''),
  relationship: Joi.string().max(100).allow(null, ''),
  is_primary_contact: Joi.boolean(),
  can_make_decisions: Joi.boolean(),
  preferred_contact_method: Joi.string().valid('phone', 'email', 'sms', 'mail'),
  notes: Joi.string().max(500).allow(null, '')
});

const createLeadActivitySchema = Joi.object(leadActivitySchema);

const updateLeadActivitySchema = Joi.object({
  activity_type: Joi.string().valid('phone_call', 'email', 'sms', 'meeting', 'site_visit', 'quote_sent', 'follow_up', 'initial_contact', 'other'),
  subject: Joi.string().max(255).allow(null, ''),
  description: Joi.string().min(1).max(1000),
  activity_date: Joi.date(),
  duration_minutes: Joi.number().integer().min(1).max(480).allow(null),
  outcome: Joi.string().valid('positive', 'negative', 'neutral', 'scheduled', 'rescheduled', 'cancelled'),
  next_action: Joi.string().max(255).allow(null, ''),
  next_action_date: Joi.date().allow(null),
  scheduled_follow_up: Joi.date().allow(null),
  notes: Joi.string().max(500).allow(null, '')
});

const createLeadNoteSchema = Joi.object(leadNoteSchema);

const updateLeadNoteSchema = Joi.object({
  note_type: Joi.string().valid('general', 'communication', 'qualification', 'objection', 'follow_up', 'internal'),
  title: Joi.string().min(1).max(255),
  content: Joi.string().min(1).max(2000),
  is_internal: Joi.boolean(),
  is_important: Joi.boolean(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  due_date: Joi.date().allow(null)
});

const updateLeadQualificationSchema = Joi.object(leadQualificationSchema);

const createLeadFollowUpSchema = Joi.object(leadFollowUpSchema);

const updateLeadFollowUpSchema = Joi.object({
  follow_up_type: Joi.string().valid('call', 'email', 'meeting', 'site_visit', 'quote_follow_up', 'other'),
  subject: Joi.string().min(1).max(255),
  description: Joi.string().max(1000).allow(null, ''),
  scheduled_date: Joi.date(),
  scheduled_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).allow(null, ''),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  assigned_to: Joi.string().uuid().allow(null, ''),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled', 'overdue'),
  outcome: Joi.string().max(1000).allow(null, ''),
  next_action: Joi.string().max(255).allow(null, '')
});

const createLeadWorkflowSchema = Joi.object(leadWorkflowSchema);

const updateLeadWorkflowSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  description: Joi.string().max(1000).allow(null, ''),
  triggers: Joi.array().items(Joi.string()).min(1),
  conditions: Joi.object().allow(null),
  actions: Joi.array().items(Joi.object({
    type: Joi.string().valid('send_email', 'schedule_follow_up', 'reassign_lead', 'send_notification', 'update_status', 'other').required(),
    template: Joi.string().max(255).allow(null),
    delay_hours: Joi.number().integer().min(0).allow(null),
    assigned_to: Joi.string().uuid().allow(null),
    recipients: Joi.array().items(Joi.string()).allow(null)
  })).min(1),
  is_active: Joi.boolean()
});

// Parameter validation schemas
const leadIdSchema = Joi.object({
  id: Joi.string().uuid().required()
});

const contactIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
  contactId: Joi.string().uuid().required()
});

const activityIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
  activityId: Joi.string().uuid().required()
});

const noteIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
  noteId: Joi.string().uuid().required()
});

const followUpIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
  followupId: Joi.string().uuid().required()
});

const tagIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
  tagId: Joi.string().uuid().required()
});

const workflowIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
  workflowId: Joi.string().uuid().required()
});

const quoteIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
  quoteId: Joi.string().uuid().required()
});

// Report validation schemas
const leadReportSchema = Joi.object({
  date_from: Joi.date().allow(null),
  date_to: Joi.date().allow(null),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'quoted', 'scheduled', 'lost', 'converted', 'deleted').allow(null, ''),
  source: Joi.string().valid('website', 'google', 'yelp', 'referral', 'facebook', 'instagram', 'phone_book', 'direct_mail', 'trade_show', 'cold_call', 'social_media', 'other').allow(null, ''),
  assigned_to: Joi.string().uuid().allow(null, ''),
  format: Joi.string().valid('json', 'pdf').default('json')
});

const leadPerformanceReportSchema = Joi.object({
  date_from: Joi.date().allow(null),
  date_to: Joi.date().allow(null),
  employee_id: Joi.string().uuid().allow(null, ''),
  source: Joi.string().valid('website', 'google', 'yelp', 'referral', 'facebook', 'instagram', 'phone_book', 'direct_mail', 'trade_show', 'cold_call', 'social_media', 'other').allow(null, '')
});

// Tag management schemas
const createTagSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).default('#3B82F6'),
  description: Joi.string().max(500).allow(null, '')
});

const updateTagSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
  description: Joi.string().max(500).allow(null, ''),
  is_active: Joi.boolean()
});

const assignTagSchema = Joi.object({
  tag_id: Joi.string().uuid().required()
});

// Quote management schemas
const createQuoteSchema = Joi.object({
  quote_number: Joi.string().min(1).max(50).required(),
  quote_amount: Joi.number().min(0).precision(2).required(),
  quote_type: Joi.string().valid('initial', 'revised', 'final').default('initial'),
  status: Joi.string().valid('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired').default('draft'),
  expiry_date: Joi.date().allow(null),
  notes: Joi.string().max(1000).allow(null, '')
});

const updateQuoteSchema = Joi.object({
  quote_amount: Joi.number().min(0).precision(2),
  quote_type: Joi.string().valid('initial', 'revised', 'final'),
  status: Joi.string().valid('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'),
  expiry_date: Joi.date().allow(null),
  notes: Joi.string().max(1000).allow(null, '')
});

module.exports = {
  // Lead operations
  createLead: createLeadSchema,
  updateLead: updateLeadSchema,
  getLeads: getLeadsSchema,
  searchLeads: searchLeadsSchema,
  
  // Lead contacts
  createLeadContact: createLeadContactSchema,
  updateLeadContact: updateLeadContactSchema,
  
  // Lead activities
  createLeadActivity: createLeadActivitySchema,
  updateLeadActivity: updateLeadActivitySchema,
  
  // Lead notes
  createLeadNote: createLeadNoteSchema,
  updateLeadNote: updateLeadNoteSchema,
  
  // Lead qualification
  updateLeadQualification: updateLeadQualificationSchema,
  
  // Lead follow-ups
  createLeadFollowUp: createLeadFollowUpSchema,
  updateLeadFollowUp: updateLeadFollowUpSchema,
  
  // Lead conversion
  convertLead: leadConversionSchema,
  
  // Lead workflows
  createLeadWorkflow: createLeadWorkflowSchema,
  updateLeadWorkflow: updateLeadWorkflowSchema,
  
  // Lead quotes
  createLeadQuote: createQuoteSchema,
  updateLeadQuote: updateQuoteSchema,
  
  // Tag management
  createTag: createTagSchema,
  updateTag: updateTagSchema,
  assignTag: assignTagSchema,
  
  // Reports
  leadReport: leadReportSchema,
  leadPerformanceReport: leadPerformanceReportSchema,
  
  // Parameter validation
  leadId: leadIdSchema,
  contactId: contactIdSchema,
  activityId: activityIdSchema,
  noteId: noteIdSchema,
  followUpId: followUpIdSchema,
  tagId: tagIdSchema,
  workflowId: workflowIdSchema,
  quoteId: quoteIdSchema
};
