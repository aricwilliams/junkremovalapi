const Joi = require('joi');

// Base schemas
const baseAddressSchema = Joi.object({
  street: Joi.string().max(255).required(),
  city: Joi.string().max(100).required(),
  state: Joi.string().length(2).required(),
  zip_code: Joi.string().max(10).required(),
  country: Joi.string().max(100).default('USA')
});

const baseProjectDetailsSchema = Joi.object({
  description: Joi.string().max(1000).required(),
  square_footage: Joi.number().positive().optional(),
  rooms: Joi.array().items(Joi.string()).optional(),
  items_to_remove: Joi.array().items(Joi.string()).optional(),
  special_requirements: Joi.string().max(500).optional()
});

const baseTimelineSchema = Joi.object({
  requested_date: Joi.date().iso().required(),
  preferred_time: Joi.string().max(50).optional(),
  urgency: Joi.string().valid('high', 'medium', 'low').default('medium'),
  flexible_dates: Joi.boolean().default(false)
});

const baseBudgetSchema = Joi.object({
  estimated_value: Joi.number().positive().optional(),
  budget_range: Joi.string().max(100).optional(),
  payment_method: Joi.string().max(100).optional()
});

// Client Request Validation Schemas
const createClientRequest = Joi.object({
  customer_name: Joi.string().max(255).required(),
  customer_email: Joi.string().email().max(255).required(),
  customer_phone: Joi.string().max(20).required(),
  service_address: Joi.string().max(500).required(),
  city: Joi.string().max(100).required(),
  state: Joi.string().length(2).required(),
  zip_code: Joi.string().max(10).required(),
  country: Joi.string().max(100).default('USA'),
  type: Joi.string().valid('pickup', 'service', 'emergency', 'maintenance').default('service'),
  priority: Joi.string().valid('urgent', 'high', 'medium', 'low', 'standard').default('medium'),
  subject: Joi.string().max(500).required(),
  description: Joi.string().required(),
  requested_date: Joi.date().iso().required(),
  preferred_date: Joi.date().iso().optional(),
  preferred_time: Joi.string().max(50).optional(),
  location_on_property: Joi.string().max(255).optional(),
  approximate_volume: Joi.string().max(100).optional(),
  approximate_item_count: Joi.string().max(100).optional(),
  gate_code: Joi.string().max(50).optional(),
  apartment_number: Joi.string().max(50).optional(),
  access_considerations: Joi.string().optional(),
  material_types: Joi.array().items(Joi.string()).optional(),
  hazardous_material: Joi.boolean().default(false),
  hazardous_description: Joi.string().optional(),
  has_mold: Joi.boolean().default(false),
  has_pests: Joi.boolean().default(false),
  has_sharp_objects: Joi.boolean().default(false),
  heavy_lifting_required: Joi.boolean().default(false),
  disassembly_required: Joi.boolean().default(false),
  disassembly_description: Joi.string().optional(),
  filled_with_water: Joi.boolean().default(false),
  filled_with_oil: Joi.boolean().default(false),
  items_in_bags: Joi.boolean().default(false),
  bag_contents: Joi.string().optional(),
  oversized_items: Joi.boolean().default(false),
  oversized_description: Joi.string().optional(),
  request_donation_pickup: Joi.boolean().default(false),
  request_demolition: Joi.boolean().default(false),
  demolition_description: Joi.string().optional(),
  text_opt_in: Joi.boolean().default(false),
  how_did_you_hear: Joi.string().max(255).optional(),
  additional_notes: Joi.string().optional(),
  attachments: Joi.array().items(Joi.string()).optional()
});

const updateClientRequest = Joi.object({
  customer_name: Joi.string().max(255).optional(),
  customer_email: Joi.string().email().max(255).optional(),
  customer_phone: Joi.string().max(20).optional(),
  service_address: Joi.string().max(500).optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().length(2).optional(),
  zip_code: Joi.string().max(10).optional(),
  country: Joi.string().max(100).optional(),
  type: Joi.string().valid('pickup', 'service', 'emergency', 'maintenance').optional(),
  priority: Joi.string().valid('urgent', 'high', 'medium', 'low', 'standard').optional(),
  status: Joi.string().valid('pending', 'reviewing', 'quoted', 'scheduled', 'completed', 'cancelled').optional(),
  subject: Joi.string().max(500).optional(),
  description: Joi.string().optional(),
  requested_date: Joi.date().iso().optional(),
  preferred_date: Joi.date().iso().optional(),
  preferred_time: Joi.string().max(50).optional(),
  location_on_property: Joi.string().max(255).optional(),
  approximate_volume: Joi.string().max(100).optional(),
  approximate_item_count: Joi.string().max(100).optional(),
  gate_code: Joi.string().max(50).optional(),
  apartment_number: Joi.string().max(50).optional(),
  access_considerations: Joi.string().optional(),
  material_types: Joi.array().items(Joi.string()).optional(),
  hazardous_material: Joi.boolean().optional(),
  hazardous_description: Joi.string().optional(),
  has_mold: Joi.boolean().optional(),
  has_pests: Joi.boolean().optional(),
  has_sharp_objects: Joi.boolean().optional(),
  heavy_lifting_required: Joi.boolean().optional(),
  disassembly_required: Joi.boolean().optional(),
  disassembly_description: Joi.string().optional(),
  filled_with_water: Joi.boolean().optional(),
  filled_with_oil: Joi.boolean().optional(),
  items_in_bags: Joi.boolean().optional(),
  bag_contents: Joi.string().optional(),
  oversized_items: Joi.boolean().optional(),
  oversized_description: Joi.string().optional(),
  request_donation_pickup: Joi.boolean().optional(),
  request_demolition: Joi.boolean().optional(),
  demolition_description: Joi.string().optional(),
  text_opt_in: Joi.boolean().optional(),
  how_did_you_hear: Joi.string().max(255).optional(),
  additional_notes: Joi.string().optional(),
  attachments: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().optional(),
  can_create_estimate: Joi.boolean().optional(),
  estimate_status: Joi.string().valid('pending', 'created', 'sent', 'accepted', 'rejected').optional(),
  volume_weight: Joi.number().positive().optional(),
  volume_yardage: Joi.number().positive().optional()
});

// Estimate Validation Schemas
const createEstimate = Joi.object({
  client_request_id: Joi.string().uuid().optional(),
  customer_id: Joi.string().uuid().optional(),
  customer_name: Joi.string().max(255).required(),
  customer_email: Joi.string().email().max(255).required(),
  customer_phone: Joi.string().max(20).required(),
  address: Joi.string().required(),
  city: Joi.string().max(100).required(),
  state: Joi.string().length(2).required(),
  zip_code: Joi.string().max(10).required(),
  country: Joi.string().max(100).default('USA'),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  labor_hours: Joi.number().positive().default(0),
  labor_rate: Joi.number().positive().default(0),
  items: Joi.array().items(Joi.object({
    name: Joi.string().max(255).required(),
    category: Joi.string().max(100).required(),
    quantity: Joi.number().positive().default(1),
    base_price: Joi.number().positive().default(0),
    price_per_unit: Joi.number().positive().optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
    estimated_time: Joi.number().positive().optional(),
    volume_weight: Joi.number().positive().optional(),
    volume_yardage: Joi.number().positive().optional(),
    description: Joi.string().optional(),
    notes: Joi.string().optional()
  })).min(1).required(),
  additional_fees: Joi.array().items(Joi.object({
    fee_type: Joi.string().valid('disposal', 'travel', 'difficulty', 'hazardous', 'after_hours', 'weekend', 'holiday', 'rush', 'custom').required(),
    description: Joi.string().max(255).optional(),
    amount: Joi.number().positive().required(),
    is_percentage: Joi.boolean().default(false),
    percentage_rate: Joi.number().positive().optional()
  })).optional(),
  expiry_date: Joi.date().iso().min('now').required(),
  terms_conditions: Joi.string().optional(),
  payment_terms: Joi.string().max(255).optional(),
  notes: Joi.string().optional(),
  volume_weight: Joi.number().positive().optional(),
  volume_yardage: Joi.number().positive().optional()
});

const updateEstimate = Joi.object({
  customer_name: Joi.string().max(255).optional(),
  customer_email: Joi.string().email().max(255).optional(),
  customer_phone: Joi.string().max(20).optional(),
  address: Joi.string().optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().length(2).optional(),
  zip_code: Joi.string().max(10).optional(),
  country: Joi.string().max(100).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  labor_hours: Joi.number().positive().optional(),
  labor_rate: Joi.number().positive().optional(),
  status: Joi.string().valid('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted').optional(),
  expiry_date: Joi.date().iso().optional(),
  terms_conditions: Joi.string().optional(),
  payment_terms: Joi.string().max(255).optional(),
  notes: Joi.string().optional(),
  volume_weight: Joi.number().positive().optional(),
  volume_yardage: Joi.number().positive().optional()
});

// Estimate Item Validation Schemas
const createEstimateItem = Joi.object({
  name: Joi.string().max(255).required(),
  category: Joi.string().max(100).required(),
  quantity: Joi.number().positive().default(1),
  base_price: Joi.number().positive().default(0),
  price_per_unit: Joi.number().positive().optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
  estimated_time: Joi.number().positive().optional(),
  volume_weight: Joi.number().positive().optional(),
  volume_yardage: Joi.number().positive().optional(),
  description: Joi.string().optional(),
  notes: Joi.string().optional()
});

const updateEstimateItem = Joi.object({
  name: Joi.string().max(255).optional(),
  category: Joi.string().max(100).optional(),
  quantity: Joi.number().positive().optional(),
  base_price: Joi.number().positive().optional(),
  price_per_unit: Joi.number().positive().optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  estimated_time: Joi.number().positive().optional(),
  volume_weight: Joi.number().positive().optional(),
  volume_yardage: Joi.number().positive().optional(),
  description: Joi.string().optional(),
  notes: Joi.string().optional()
});

// Additional Fee Validation Schemas
const createAdditionalFee = Joi.object({
  fee_type: Joi.string().valid('disposal', 'travel', 'difficulty', 'hazardous', 'after_hours', 'weekend', 'holiday', 'rush', 'custom').required(),
  description: Joi.string().max(255).optional(),
  amount: Joi.number().positive().required(),
  is_percentage: Joi.boolean().default(false),
  percentage_rate: Joi.number().positive().optional()
});

const updateAdditionalFee = Joi.object({
  fee_type: Joi.string().valid('disposal', 'travel', 'difficulty', 'hazardous', 'after_hours', 'weekend', 'holiday', 'rush', 'custom').optional(),
  description: Joi.string().max(255).optional(),
  amount: Joi.number().positive().optional(),
  is_percentage: Joi.boolean().optional(),
  percentage_rate: Joi.number().positive().optional()
});

// Pricing Item Validation Schemas
const createPricingItem = Joi.object({
  name: Joi.string().max(255).required(),
  category: Joi.string().max(100).required(),
  base_price: Joi.number().positive().default(0),
  price_per_unit: Joi.number().positive().optional(),
  unit_type: Joi.string().max(50).optional(),
  estimated_time: Joi.number().positive().optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
  description: Joi.string().optional(),
  volume_weight: Joi.number().positive().optional(),
  volume_yardage: Joi.number().positive().optional(),
  is_active: Joi.boolean().default(true),
  sort_order: Joi.number().integer().min(0).default(0)
});

const updatePricingItem = Joi.object({
  name: Joi.string().max(255).optional(),
  category: Joi.string().max(100).optional(),
  base_price: Joi.number().positive().optional(),
  price_per_unit: Joi.number().positive().optional(),
  unit_type: Joi.string().max(50).optional(),
  estimated_time: Joi.number().positive().optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional(),
  description: Joi.string().optional(),
  volume_weight: Joi.number().positive().optional(),
  volume_yardage: Joi.number().positive().optional(),
  is_active: Joi.boolean().optional(),
  sort_order: Joi.number().integer().min(0).optional()
});

// Pricing Category Validation Schemas
const createPricingCategory = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().optional(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  icon: Joi.string().max(50).optional(),
  is_active: Joi.boolean().default(true),
  sort_order: Joi.number().integer().min(0).default(0)
});

const updatePricingCategory = Joi.object({
  name: Joi.string().max(100).optional(),
  description: Joi.string().optional(),
  color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  icon: Joi.string().max(50).optional(),
  is_active: Joi.boolean().optional(),
  sort_order: Joi.number().integer().min(0).optional()
});

// Estimate Template Validation Schemas
const createEstimateTemplate = Joi.object({
  name: Joi.string().max(255).required(),
  description: Joi.string().optional(),
  category: Joi.string().max(100).optional(),
  is_active: Joi.boolean().default(true),
  items: Joi.array().items(Joi.object({
    name: Joi.string().max(255).required(),
    category: Joi.string().max(100).required(),
    quantity: Joi.number().positive().default(1),
    base_price: Joi.number().positive().default(0),
    price_per_unit: Joi.number().positive().optional(),
    difficulty: Joi.string().valid('easy', 'medium', 'hard').default('medium'),
    estimated_time: Joi.number().positive().optional(),
    volume_weight: Joi.number().positive().optional(),
    volume_yardage: Joi.number().positive().optional(),
    description: Joi.string().optional(),
    sort_order: Joi.number().integer().min(0).default(0)
  })).optional()
});

const updateEstimateTemplate = Joi.object({
  name: Joi.string().max(255).optional(),
  description: Joi.string().optional(),
  category: Joi.string().max(100).optional(),
  is_active: Joi.boolean().optional()
});

// Estimate from Template Validation Schema
const createEstimateFromTemplate = Joi.object({
  template_id: Joi.string().uuid().required(),
  client_request_id: Joi.string().uuid().optional(),
  customer_name: Joi.string().max(255).required(),
  customer_email: Joi.string().email().max(255).required(),
  customer_phone: Joi.string().max(20).required(),
  address: Joi.string().required(),
  city: Joi.string().max(100).required(),
  state: Joi.string().length(2).required(),
  zip_code: Joi.string().max(10).required(),
  country: Joi.string().max(100).default('USA'),
  customizations: Joi.object({
    items: Joi.array().items(Joi.object({
      name: Joi.string().max(255).required(),
      category: Joi.string().max(100).required(),
      quantity: Joi.number().positive().default(1),
      unit_price: Joi.number().positive().required()
    })).optional(),
    additional_fees: Joi.array().items(Joi.object({
      description: Joi.string().max(255).required(),
      amount: Joi.number().positive().required()
    })).optional()
  }).optional(),
  expiry_date: Joi.date().iso().min('now').required(),
  terms_conditions: Joi.string().optional(),
  payment_terms: Joi.string().max(255).optional(),
  notes: Joi.string().optional()
});

// Send Estimate Validation Schema
const sendEstimate = Joi.object({
  send_method: Joi.string().valid('email', 'sms', 'mail').default('email'),
  email_template: Joi.string().max(100).optional(),
  additional_message: Joi.string().max(1000).optional(),
  cc_emails: Joi.array().items(Joi.string().email()).optional()
});

// Update Estimate Status Validation Schema
const updateEstimateStatus = Joi.object({
  status: Joi.string().valid('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted').required(),
  status_notes: Joi.string().max(1000).optional(),
  accepted_date: Joi.date().iso().optional(),
  rejected_date: Joi.date().iso().optional(),
  rejection_reason: Joi.string().max(500).optional(),
  next_action: Joi.string().max(255).optional()
});

// Query Parameter Validation Schemas
const getClientRequests = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(255).optional(),
  status: Joi.string().valid('pending', 'reviewing', 'quoted', 'scheduled', 'completed', 'cancelled').optional(),
  type: Joi.string().valid('pickup', 'service', 'emergency', 'maintenance').optional(),
  priority: Joi.string().valid('urgent', 'high', 'medium', 'low', 'standard').optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  sort_by: Joi.string().valid('created_at', 'requested_date', 'priority', 'status', 'customer_name').default('created_at'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
});

const getEstimates = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(255).optional(),
  status: Joi.string().valid('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted').optional(),
  client_request_id: Joi.string().uuid().optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  min_total: Joi.number().positive().optional(),
  max_total: Joi.number().positive().optional(),
  sort_by: Joi.string().valid('created_at', 'sent_date', 'expiry_date', 'total', 'customer_name').default('created_at'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
});

const getPricingItems = Joi.object({
  category: Joi.string().max(100).optional(),
  is_active: Joi.boolean().optional(),
  search: Joi.string().max(255).optional(),
  difficulty: Joi.string().valid('easy', 'medium', 'hard').optional()
});

const getEstimateReports = Joi.object({
  date_from: Joi.date().iso().required(),
  date_to: Joi.date().iso().required(),
  status: Joi.string().valid('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted').optional(),
  service_type: Joi.string().max(100).optional(),
  format: Joi.string().valid('json', 'pdf').default('json')
});

// Path Parameter Validation Schemas
const clientRequestId = Joi.object({
  id: Joi.string().uuid().required()
});

const estimateId = Joi.object({
  id: Joi.string().uuid().required()
});

const itemId = Joi.object({
  id: Joi.string().uuid().required(),
  itemId: Joi.string().uuid().required()
});

const feeId = Joi.object({
  id: Joi.string().uuid().required(),
  feeId: Joi.string().uuid().required()
});

const pricingItemId = Joi.object({
  id: Joi.string().uuid().required()
});

const categoryId = Joi.object({
  id: Joi.string().uuid().required()
});

const templateId = Joi.object({
  id: Joi.string().uuid().required()
});

module.exports = {
  // Client Request schemas
  createClientRequest,
  updateClientRequest,
  getClientRequests,
  clientRequestId,
  
  // Estimate schemas
  createEstimate,
  updateEstimate,
  getEstimates,
  estimateId,
  createEstimateFromTemplate,
  sendEstimate,
  updateEstimateStatus,
  
  // Estimate Item schemas
  createEstimateItem,
  updateEstimateItem,
  itemId,
  
  // Additional Fee schemas
  createAdditionalFee,
  updateAdditionalFee,
  feeId,
  
  // Pricing Item schemas
  createPricingItem,
  updatePricingItem,
  getPricingItems,
  pricingItemId,
  
  // Pricing Category schemas
  createPricingCategory,
  updatePricingCategory,
  categoryId,
  
  // Estimate Template schemas
  createEstimateTemplate,
  updateEstimateTemplate,
  templateId,
  
  // Report schemas
  getEstimateReports
};
