const Joi = require('joi');

// Base schemas for reuse
const baseLocationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).precision(8).optional(),
  longitude: Joi.number().min(-180).max(180).precision(8).optional()
});

const baseContactSchema = Joi.object({
  name: Joi.string().max(255).required(),
  relationship: Joi.string().max(100).required(),
  phone: Joi.string().max(20).required(),
  email: Joi.string().email().max(255).optional(),
  address: Joi.string().optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(2).optional(),
  zip_code: Joi.string().max(10).optional()
});

// Employee validation schemas
const createEmployeeSchema = Joi.object({
  personal_info: Joi.object({
    first_name: Joi.string().max(100).required(),
    last_name: Joi.string().max(100).required(),
    email: Joi.string().email().max(255).required(),
    phone: Joi.string().max(20).required(),
    mobile: Joi.string().max(20).optional(),
    date_of_birth: Joi.date().max('now').optional(),
    ssn: Joi.string().pattern(/^\d{3}-\d{2}-\d{4}$/).optional()
  }).required(),
  employment_info: Joi.object({
    department: Joi.string().valid('operations', 'sales', 'admin', 'maintenance').required(),
    position: Joi.string().valid('driver', 'helper', 'supervisor', 'manager', 'admin', 'dispatcher', 'mechanic', 'other').required(),
    hire_date: Joi.date().max('now').required(),
    supervisor: Joi.string().uuid().optional(),
    work_location: Joi.string().max(255).optional()
  }).required(),
  compensation: Joi.object({
    current_salary: Joi.number().positive().precision(2).required(),
    hourly_rate: Joi.number().positive().precision(2).optional(),
    overtime_rate: Joi.number().positive().precision(2).optional()
  }).required(),
  schedule: Joi.object({
    work_schedule: Joi.string().valid('monday_friday', 'tuesday_saturday', 'wednesday_sunday', 'custom').required(),
    start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    break_duration: Joi.number().integer().min(0).max(480).optional(), // in minutes
    overtime_eligible: Joi.boolean().default(true),
    preferred_shifts: Joi.array().items(Joi.string().valid('morning', 'afternoon', 'night')).optional()
  }).required()
});

const updateEmployeeSchema = Joi.object({
  personal_info: Joi.object({
    first_name: Joi.string().max(100).optional(),
    last_name: Joi.string().max(100).optional(),
    email: Joi.string().email().max(255).optional(),
    phone: Joi.string().max(20).optional(),
    mobile: Joi.string().max(20).optional(),
    date_of_birth: Joi.date().max('now').optional(),
    ssn: Joi.string().pattern(/^\d{3}-\d{2}-\d{4}$/).optional()
  }).optional(),
  employment_info: Joi.object({
    department: Joi.string().valid('operations', 'sales', 'admin', 'maintenance').optional(),
    position: Joi.string().valid('driver', 'helper', 'supervisor', 'manager', 'admin', 'dispatcher', 'mechanic', 'other').optional(),
    supervisor: Joi.string().uuid().optional(),
    work_location: Joi.string().max(255).optional()
  }).optional(),
  compensation: Joi.object({
    current_salary: Joi.number().positive().precision(2).optional(),
    hourly_rate: Joi.number().positive().precision(2).optional(),
    overtime_rate: Joi.number().positive().precision(2).optional()
  }).optional(),
  schedule: Joi.object({
    work_schedule: Joi.string().valid('monday_friday', 'tuesday_saturday', 'wednesday_sunday', 'custom').optional(),
    start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    break_duration: Joi.number().integer().min(0).max(480).optional(),
    overtime_eligible: Joi.boolean().optional(),
    preferred_shifts: Joi.array().items(Joi.string().valid('morning', 'afternoon', 'night')).optional()
  }).optional()
});

const employeeQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(255).optional(),
  status: Joi.string().valid('active', 'inactive', 'on-leave', 'terminated', 'suspended', 'probation').optional(),
  department: Joi.string().valid('operations', 'sales', 'admin', 'maintenance').optional(),
  position: Joi.string().valid('driver', 'helper', 'supervisor', 'manager', 'admin', 'dispatcher', 'mechanic', 'other').optional(),
  hire_date_from: Joi.date().optional(),
  hire_date_to: Joi.date().optional(),
  sort_by: Joi.string().valid('first_name', 'last_name', 'hire_date', 'department', 'position', 'status').default('last_name'),
  sort_order: Joi.string().valid('asc', 'desc').default('asc')
});

const employeeIdParamSchema = Joi.object({
  id: Joi.string().uuid().required()
});

// Employee Schedule validation schemas
const updateEmployeeScheduleSchema = Joi.object({
  schedule_changes: Joi.object({
    monday: Joi.object({
      start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      break_start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      break_end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    }).optional(),
    tuesday: Joi.object({
      start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      break_start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      break_end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    }).optional(),
    wednesday: Joi.object({
      start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      break_start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      break_end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    }).optional(),
    thursday: Joi.object({
      start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      break_start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      break_end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    }).optional(),
    friday: Joi.object({
      start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      break_start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      break_end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    }).optional(),
    saturday: Joi.object({
      start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      break_start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      break_end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    }).optional(),
    sunday: Joi.object({
      start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      break_start: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
      break_end: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional()
    }).optional()
  }).required(),
  effective_date: Joi.date().min('now').required(),
  reason: Joi.string().max(500).optional()
});

const scheduleQuerySchema = Joi.object({
  date_from: Joi.date().optional(),
  date_to: Joi.date().optional()
});

// Employee Performance validation schemas
const createPerformanceReviewSchema = Joi.object({
  review_date: Joi.date().max('now').required(),
  reviewer: Joi.string().uuid().required(),
  overall_rating: Joi.number().min(1.0).max(5.0).precision(1).required(),
  strengths: Joi.array().items(Joi.string().max(255)).min(1).required(),
  areas_for_improvement: Joi.array().items(Joi.string().max(255)).optional(),
  goals: Joi.array().items(Joi.string().max(255)).optional(),
  next_review_date: Joi.date().min('now').required(),
  comments: Joi.string().max(1000).optional()
});

const performanceQuerySchema = Joi.object({
  review_year: Joi.number().integer().min(2000).max(2100).optional(),
  metric_type: Joi.string().valid('attendance', 'safety', 'quality', 'productivity').optional()
});

// Employee Time Tracking validation schemas
const clockInOutSchema = Joi.object({
  action: Joi.string().valid('clock_in', 'clock_out', 'break_start', 'break_end').required(),
  timestamp: Joi.date().max('now').required(),
  location: Joi.string().max(255).optional(),
  notes: Joi.string().max(500).optional()
});

const timeLogsQuerySchema = Joi.object({
  date_from: Joi.date().optional(),
  date_to: Joi.date().optional(),
  status: Joi.string().valid('clocked_in', 'clocked_out', 'on_break').optional()
});

// Employee Training validation schemas
const addTrainingRecordSchema = Joi.object({
  course_name: Joi.string().max(255).required(),
  type: Joi.string().valid('mandatory', 'elective', 'certification', 'refresher').required(),
  completion_date: Joi.date().max('now').required(),
  expiration_date: Joi.date().min('now').optional(),
  instructor: Joi.string().max(255).optional(),
  score: Joi.number().min(0).max(100).precision(1).optional(),
  certificate_number: Joi.string().max(100).optional(),
  notes: Joi.string().max(1000).optional()
});

// Employee Payroll validation schemas
const payrollQuerySchema = Joi.object({
  pay_period: Joi.string().valid('weekly', 'biweekly', 'monthly').optional(),
  date_from: Joi.date().optional(),
  date_to: Joi.date().optional()
});

// Employee Reports validation schemas
const reportsQuerySchema = Joi.object({
  date_from: Joi.date().required(),
  date_to: Joi.date().min(Joi.ref('date_from')).required(),
  department: Joi.string().valid('operations', 'sales', 'admin', 'maintenance').optional(),
  format: Joi.string().valid('json', 'pdf').default('json')
});

const performanceReportQuerySchema = Joi.object({
  date_from: Joi.date().required(),
  date_to: Joi.date().min(Joi.ref('date_from')).required(),
  department: Joi.string().valid('operations', 'sales', 'admin', 'maintenance').optional(),
  performance_threshold: Joi.number().min(1.0).max(5.0).precision(1).optional()
});

// Employee Settings validation schemas
const updateEmployeeSettingsSchema = Joi.object({
  work_schedules: Joi.object({
    default_start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    default_end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    default_break_duration: Joi.number().integer().min(0).max(480).optional(),
    overtime_threshold: Joi.number().positive().precision(2).optional(),
    overtime_multiplier: Joi.number().positive().precision(2).optional()
  }).optional(),
  performance_settings: Joi.object({
    review_frequency_months: Joi.number().integer().min(1).max(12).optional(),
    performance_rating_scale: Joi.number().integer().min(3).max(10).optional(),
    attendance_threshold: Joi.number().min(0).max(100).precision(1).optional(),
    safety_threshold: Joi.number().min(0).max(100).precision(1).optional()
  }).optional(),
  payroll_settings: Joi.object({
    pay_frequency: Joi.string().valid('weekly', 'biweekly', 'monthly').optional(),
    overtime_calculation: Joi.string().valid('after_40_hours', 'after_8_hours', 'after_10_hours').optional(),
    holiday_pay_multiplier: Joi.number().positive().precision(2).optional(),
    weekend_pay_multiplier: Joi.number().positive().precision(2).optional()
  }).optional(),
  notification_settings: Joi.object({
    performance_review_reminders: Joi.boolean().optional(),
    training_expiration_alerts: Joi.boolean().optional(),
    attendance_alerts: Joi.boolean().optional(),
    email_notifications: Joi.boolean().optional(),
    sms_notifications: Joi.boolean().optional()
  }).optional()
});

// Emergency Contact validation schemas
const createEmergencyContactSchema = Joi.object({
  contact_type: Joi.string().valid('primary', 'secondary', 'emergency', 'beneficiary').default('primary'),
  name: Joi.string().max(255).required(),
  relationship: Joi.string().max(100).required(),
  phone: Joi.string().max(20).required(),
  email: Joi.string().email().max(255).optional(),
  address: Joi.string().optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(2).optional(),
  zip_code: Joi.string().max(10).optional(),
  is_primary: Joi.boolean().default(false),
  notes: Joi.string().max(1000).optional()
});

const updateEmergencyContactSchema = Joi.object({
  contact_type: Joi.string().valid('primary', 'secondary', 'emergency', 'beneficiary').optional(),
  name: Joi.string().max(255).optional(),
  relationship: Joi.string().max(100).optional(),
  phone: Joi.string().max(20).optional(),
  email: Joi.string().email().max(255).optional(),
  address: Joi.string().optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(2).optional(),
  zip_code: Joi.string().max(10).optional(),
  is_primary: Joi.boolean().optional(),
  notes: Joi.string().max(1000).optional()
});

const emergencyContactIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  contact_id: Joi.string().uuid().required()
});

// Document validation schemas
const createDocumentSchema = Joi.object({
  document_type: Joi.string().valid('drivers_license', 'background_check', 'drug_test', 'i9_form', 'w4_form', 'contract', 'certification', 'training_record', 'performance_review', 'other').required(),
  document_name: Joi.string().max(255).required(),
  document_number: Joi.string().max(100).optional(),
  issuing_authority: Joi.string().max(255).optional(),
  issue_date: Joi.date().max('now').optional(),
  expiry_date: Joi.date().min('now').optional(),
  is_required: Joi.boolean().default(false),
  notes: Joi.string().max(1000).optional()
});

const updateDocumentSchema = Joi.object({
  document_type: Joi.string().valid('drivers_license', 'background_check', 'drug_test', 'i9_form', 'w4_form', 'contract', 'certification', 'training_record', 'performance_review', 'other').optional(),
  document_name: Joi.string().max(255).optional(),
  document_number: Joi.string().max(100).optional(),
  issuing_authority: Joi.string().max(255).optional(),
  issue_date: Joi.date().max('now').optional(),
  expiry_date: Joi.date().min('now').optional(),
  is_required: Joi.boolean().optional(),
  notes: Joi.string().max(1000).optional()
});

const documentIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  document_id: Joi.string().uuid().required()
});

// Certification validation schemas
const createCertificationSchema = Joi.object({
  name: Joi.string().max(255).required(),
  issuing_authority: Joi.string().max(255).required(),
  certificate_number: Joi.string().max(100).optional(),
  issue_date: Joi.date().max('now').required(),
  expiry_date: Joi.date().min('now').optional(),
  renewal_required: Joi.boolean().default(false),
  renewal_frequency: Joi.string().max(50).optional(),
  continuing_education_hours: Joi.number().positive().precision(2).optional(),
  ce_hours_required: Joi.number().positive().precision(2).optional(),
  notes: Joi.string().max(1000).optional()
});

const updateCertificationSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  issuing_authority: Joi.string().max(255).optional(),
  certificate_number: Joi.string().max(100).optional(),
  issue_date: Joi.date().max('now').optional(),
  expiry_date: Joi.date().min('now').optional(),
  renewal_required: Joi.boolean().optional(),
  renewal_frequency: Joi.string().max(50).optional(),
  continuing_education_hours: Joi.number().positive().precision(2).optional(),
  ce_hours_required: Joi.number().positive().precision(2).optional(),
  notes: Joi.string().max(1000).optional()
});

const certificationIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  certification_id: Joi.string().uuid().required()
});

// Pay Rate validation schemas
const createPayRateSchema = Joi.object({
  pay_type: Joi.string().valid('hourly', 'salary', 'commission', 'piece_rate', '1099').default('hourly'),
  base_rate: Joi.number().positive().precision(2).required(),
  overtime_rate: Joi.number().positive().precision(2).optional(),
  overtime_multiplier: Joi.number().positive().precision(2).default(1.5),
  holiday_rate: Joi.number().positive().precision(2).optional(),
  holiday_multiplier: Joi.number().positive().precision(2).default(1.5),
  weekend_rate: Joi.number().positive().precision(2).optional(),
  weekend_multiplier: Joi.number().positive().precision(2).default(1.25),
  night_differential: Joi.number().positive().precision(2).optional(),
  per_diem_rate: Joi.number().positive().precision(2).optional(),
  mileage_rate: Joi.number().positive().precision(2).optional(),
  effective_date: Joi.date().max('now').required(),
  notes: Joi.string().max(1000).optional()
});

const updatePayRateSchema = Joi.object({
  pay_type: Joi.string().valid('hourly', 'salary', 'commission', 'piece_rate', '1099').optional(),
  base_rate: Joi.number().positive().precision(2).optional(),
  overtime_rate: Joi.number().positive().precision(2).optional(),
  overtime_multiplier: Joi.number().positive().precision(2).optional(),
  holiday_rate: Joi.number().positive().precision(2).optional(),
  holiday_multiplier: Joi.number().positive().precision(2).optional(),
  weekend_rate: Joi.number().positive().precision(2).optional(),
  weekend_multiplier: Joi.number().positive().precision(2).optional(),
  night_differential: Joi.number().positive().precision(2).optional(),
  per_diem_rate: Joi.number().positive().precision(2).optional(),
  mileage_rate: Joi.number().positive().precision(2).optional(),
  effective_date: Joi.date().max('now').optional(),
  notes: Joi.string().max(1000).optional()
});

const payRateIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  pay_rate_id: Joi.string().uuid().required()
});

// Benefit validation schemas
const createBenefitSchema = Joi.object({
  benefit_type: Joi.string().valid('health_insurance', 'dental_insurance', 'vision_insurance', 'life_insurance', 'disability_insurance', 'retirement', 'vacation', 'sick_leave', 'personal_leave', 'other').required(),
  provider: Joi.string().max(255).optional(),
  policy_number: Joi.string().max(100).optional(),
  group_number: Joi.string().max(100).optional(),
  start_date: Joi.date().max('now').required(),
  end_date: Joi.date().min(Joi.ref('start_date')).optional(),
  employee_cost: Joi.number().positive().precision(2).optional(),
  employer_cost: Joi.number().positive().precision(2).optional(),
  total_cost: Joi.number().positive().precision(2).optional(),
  coverage_level: Joi.string().max(100).optional(),
  dependents_count: Joi.number().integer().min(0).default(0),
  notes: Joi.string().max(1000).optional()
});

const updateBenefitSchema = Joi.object({
  benefit_type: Joi.string().valid('health_insurance', 'dental_insurance', 'vision_insurance', 'life_insurance', 'disability_insurance', 'retirement', 'vacation', 'sick_leave', 'personal_leave', 'other').optional(),
  provider: Joi.string().max(255).optional(),
  policy_number: Joi.string().max(100).optional(),
  group_number: Joi.string().max(100).optional(),
  start_date: Joi.date().max('now').optional(),
  end_date: Joi.date().min(Joi.ref('start_date')).optional(),
  employee_cost: Joi.number().positive().precision(2).optional(),
  employer_cost: Joi.number().positive().precision(2).optional(),
  total_cost: Joi.number().positive().precision(2).optional(),
  coverage_level: Joi.string().max(100).optional(),
  dependents_count: Joi.number().integer().min(0).optional(),
  notes: Joi.string().max(1000).optional()
});

const benefitIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  benefit_id: Joi.string().uuid().required()
});

// Incident validation schemas
const createIncidentSchema = Joi.object({
  incident_type: Joi.string().valid('safety_violation', 'policy_violation', 'performance_issue', 'attendance_issue', 'accident', 'injury', 'other').required(),
  incident_date: Joi.date().max('now').required(),
  incident_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  location: Joi.string().optional(),
  description: Joi.string().max(1000).required(),
  severity: Joi.string().valid('minor', 'moderate', 'major', 'critical').default('minor'),
  witnesses: Joi.string().optional(),
  investigation_required: Joi.boolean().default(false),
  notes: Joi.string().max(1000).optional()
});

const updateIncidentSchema = Joi.object({
  incident_type: Joi.string().valid('safety_violation', 'policy_violation', 'performance_issue', 'attendance_issue', 'accident', 'injury', 'other').optional(),
  incident_date: Joi.date().max('now').optional(),
  incident_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  location: Joi.string().optional(),
  description: Joi.string().max(1000).optional(),
  severity: Joi.string().valid('minor', 'moderate', 'major', 'critical').optional(),
  witnesses: Joi.string().optional(),
  investigation_required: Joi.boolean().optional(),
  investigation_date: Joi.date().max('now').optional(),
  findings: Joi.string().max(1000).optional(),
  corrective_actions: Joi.string().max(1000).optional(),
  disciplinary_action: Joi.string().valid('none', 'verbal_warning', 'written_warning', 'suspension', 'termination', 'other').optional(),
  suspension_start: Joi.date().optional(),
  suspension_end: Joi.date().optional(),
  suspension_reason: Joi.string().max(500).optional(),
  follow_up_date: Joi.date().min('now').optional(),
  status: Joi.string().valid('reported', 'investigating', 'resolved', 'closed').optional(),
  notes: Joi.string().max(1000).optional()
});

const incidentIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  incident_id: Joi.string().uuid().required()
});

// Equipment validation schemas
const createEquipmentSchema = Joi.object({
  equipment_name: Joi.string().max(255).required(),
  equipment_type: Joi.string().valid('safety_gear', 'tools', 'uniforms', 'electronics', 'vehicles', 'other').default('safety_gear'),
  serial_number: Joi.string().max(100).optional(),
  asset_tag: Joi.string().max(100).optional(),
  issue_date: Joi.date().max('now').required(),
  return_date: Joi.date().min(Joi.ref('issue_date')).optional(),
  condition: Joi.string().valid('new', 'good', 'fair', 'poor', 'damaged').default('good'),
  replacement_cost: Joi.number().positive().precision(2).optional(),
  is_returnable: Joi.boolean().default(true),
  notes: Joi.string().max(1000).optional()
});

const updateEquipmentSchema = Joi.object({
  equipment_name: Joi.string().max(255).optional(),
  equipment_type: Joi.string().valid('safety_gear', 'tools', 'uniforms', 'electronics', 'vehicles', 'other').optional(),
  serial_number: Joi.string().max(100).optional(),
  asset_tag: Joi.string().max(100).optional(),
  issue_date: Joi.date().max('now').optional(),
  return_date: Joi.date().min(Joi.ref('issue_date')).optional(),
  condition: Joi.string().valid('new', 'good', 'fair', 'poor', 'damaged').optional(),
  replacement_cost: Joi.number().positive().precision(2).optional(),
  is_returnable: Joi.boolean().optional(),
  notes: Joi.string().max(1000).optional()
});

const equipmentIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  equipment_id: Joi.string().uuid().required()
});

module.exports = {
  // Employee schemas
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema,
  employeeIdParamSchema,
  
  // Schedule schemas
  updateEmployeeScheduleSchema,
  scheduleQuerySchema,
  
  // Performance schemas
  createPerformanceReviewSchema,
  performanceQuerySchema,
  
  // Time tracking schemas
  clockInOutSchema,
  timeLogsQuerySchema,
  
  // Training schemas
  addTrainingRecordSchema,
  
  // Payroll schemas
  payrollQuerySchema,
  
  // Report schemas
  reportsQuerySchema,
  performanceReportQuerySchema,
  
  // Settings schemas
  updateEmployeeSettingsSchema,
  
  // Emergency contact schemas
  createEmergencyContactSchema,
  updateEmergencyContactSchema,
  emergencyContactIdParamSchema,
  
  // Document schemas
  createDocumentSchema,
  updateDocumentSchema,
  documentIdParamSchema,
  
  // Certification schemas
  createCertificationSchema,
  updateCertificationSchema,
  certificationIdParamSchema,
  
  // Pay rate schemas
  createPayRateSchema,
  updatePayRateSchema,
  payRateIdParamSchema,
  
  // Benefit schemas
  createBenefitSchema,
  updateBenefitSchema,
  benefitIdParamSchema,
  
  // Incident schemas
  createIncidentSchema,
  updateIncidentSchema,
  incidentIdParamSchema,
  
  // Equipment schemas
  createEquipmentSchema,
  updateEquipmentSchema,
  equipmentIdParamSchema
};
