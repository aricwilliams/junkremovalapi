const Joi = require('joi');

// Base schemas
const baseLocationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  address: Joi.string().max(500).optional()
});

const baseSpecificationsSchema = Joi.object({
  engine: Joi.string().max(255).optional(),
  transmission: Joi.string().max(255).optional(),
  fuel_type: Joi.string().valid('gasoline', 'diesel', 'electric', 'hybrid', 'other').optional(),
  fuel_capacity: Joi.number().positive().optional(),
  payload_capacity: Joi.number().positive().optional(),
  gross_vehicle_weight: Joi.number().positive().optional()
});

// Vehicle Validation Schemas
const createVehicle = Joi.object({
  name: Joi.string().max(255).required(),
  license_plate: Joi.string().max(20).required(),
  vin: Joi.string().length(17).optional(),
  make: Joi.string().max(100).required(),
  model: Joi.string().max(100).required(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).required(),
  vehicle_type: Joi.string().valid('truck', 'trailer', 'van', 'pickup', 'dump_truck', 'flatbed', 'other').default('truck'),
  capacity_weight: Joi.number().positive().optional(),
  capacity_volume: Joi.number().positive().optional(),
  capacity_units: Joi.string().max(20).default('lbs'),
  volume_units: Joi.string().max(20).default('yds³'),
  fuel_type: Joi.string().valid('gasoline', 'diesel', 'electric', 'hybrid', 'other').default('gasoline'),
  fuel_capacity: Joi.number().positive().optional(),
  fuel_capacity_units: Joi.string().max(10).default('gallons'),
  current_fuel_level: Joi.number().min(0).max(100).optional(),
  mileage: Joi.number().min(0).default(0),
  mileage_units: Joi.string().max(10).default('miles'),
  last_service_date: Joi.date().iso().optional(),
  next_service_date: Joi.date().iso().optional(),
  last_service_mileage: Joi.number().min(0).optional(),
  next_service_mileage: Joi.number().min(0).optional(),
  assigned_crew_id: Joi.string().uuid().optional(),
  assigned_job_id: Joi.string().uuid().optional(),
  current_location_lat: Joi.number().min(-90).max(90).optional(),
  current_location_lng: Joi.number().min(-180).max(180).optional(),
  current_location_address: Joi.string().optional(),
  notes: Joi.string().optional(),
  specifications: baseSpecificationsSchema.optional()
});

const updateVehicle = Joi.object({
  name: Joi.string().max(255).optional(),
  license_plate: Joi.string().max(20).optional(),
  vin: Joi.string().length(17).optional(),
  make: Joi.string().max(100).optional(),
  model: Joi.string().max(100).optional(),
  year: Joi.number().integer().min(1900).max(new Date().getFullYear() + 1).optional(),
  vehicle_type: Joi.string().valid('truck', 'trailer', 'van', 'pickup', 'dump_truck', 'flatbed', 'other').optional(),
  status: Joi.string().valid('available', 'in-use', 'maintenance', 'out-of-service', 'retired', 'reserved').optional(),
  capacity_weight: Joi.number().positive().optional(),
  capacity_volume: Joi.number().positive().optional(),
  capacity_units: Joi.string().max(20).optional(),
  volume_units: Joi.string().max(20).optional(),
  fuel_type: Joi.string().valid('gasoline', 'diesel', 'electric', 'hybrid', 'other').optional(),
  fuel_capacity: Joi.number().positive().optional(),
  fuel_capacity_units: Joi.string().max(10).optional(),
  current_fuel_level: Joi.number().min(0).max(100).optional(),
  mileage: Joi.number().min(0).optional(),
  mileage_units: Joi.string().max(10).optional(),
  last_service_date: Joi.date().iso().optional(),
  next_service_date: Joi.date().iso().optional(),
  last_service_mileage: Joi.number().min(0).optional(),
  next_service_mileage: Joi.number().min(0).optional(),
  assigned_crew_id: Joi.string().uuid().optional(),
  assigned_job_id: Joi.string().uuid().optional(),
  current_location_lat: Joi.number().min(-90).max(90).optional(),
  current_location_lng: Joi.number().min(-180).max(180).optional(),
  current_location_address: Joi.string().optional(),
  notes: Joi.string().optional(),
  specifications: baseSpecificationsSchema.optional()
});

// Vehicle Maintenance Validation Schemas
const createMaintenanceRecord = Joi.object({
  maintenance_type: Joi.string().valid('routine', 'repair', 'emergency', 'inspection', 'tire', 'brake', 'engine', 'transmission', 'other').required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent', 'critical').default('medium'),
  status: Joi.string().valid('scheduled', 'in-progress', 'completed', 'cancelled', 'deferred').default('scheduled'),
  title: Joi.string().max(255).required(),
  description: Joi.string().required(),
  scheduled_date: Joi.date().iso().optional(),
  completed_date: Joi.date().iso().optional(),
  scheduled_mileage: Joi.number().min(0).optional(),
  completed_mileage: Joi.number().min(0).optional(),
  estimated_cost: Joi.number().positive().optional(),
  actual_cost: Joi.number().positive().optional(),
  labor_hours: Joi.number().positive().optional(),
  labor_rate: Joi.number().positive().optional(),
  parts_cost: Joi.number().positive().optional(),
  performed_by: Joi.string().uuid().optional(),
  performed_by_name: Joi.string().max(255).optional(),
  service_location: Joi.string().max(255).optional(),
  next_service_date: Joi.date().iso().optional(),
  next_service_mileage: Joi.number().min(0).optional(),
  warranty_expiry: Joi.date().iso().optional(),
  notes: Joi.string().optional()
});

const updateMaintenanceRecord = Joi.object({
  maintenance_type: Joi.string().valid('routine', 'repair', 'emergency', 'inspection', 'tire', 'brake', 'engine', 'transmission', 'other').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent', 'critical').optional(),
  status: Joi.string().valid('scheduled', 'in-progress', 'completed', 'cancelled', 'deferred').optional(),
  title: Joi.string().max(255).optional(),
  description: Joi.string().optional(),
  scheduled_date: Joi.date().iso().optional(),
  completed_date: Joi.date().iso().optional(),
  scheduled_mileage: Joi.number().min(0).optional(),
  completed_mileage: Joi.number().min(0).optional(),
  estimated_cost: Joi.number().positive().optional(),
  actual_cost: Joi.number().positive().optional(),
  labor_hours: Joi.number().positive().optional(),
  labor_rate: Joi.number().positive().optional(),
  parts_cost: Joi.number().positive().optional(),
  performed_by: Joi.string().uuid().optional(),
  performed_by_name: Joi.string().max(255).optional(),
  service_location: Joi.string().max(255).optional(),
  next_service_date: Joi.date().iso().optional(),
  next_service_mileage: Joi.number().min(0).optional(),
  warranty_expiry: Joi.date().iso().optional(),
  notes: Joi.string().optional()
});

// Vehicle Location Validation Schemas
const updateVehicleLocation = Joi.object({
  address: Joi.string().max(500).required(),
  coordinates: baseLocationSchema.required(),
  tracking_data: Joi.object({
    speed: Joi.number().min(0).optional(),
    heading: Joi.number().min(0).max(360).optional(),
    fuel_level: Joi.number().min(0).max(100).optional(),
    engine_status: Joi.string().valid('running', 'stopped', 'idle', 'unknown').optional(),
    ignition_status: Joi.string().valid('on', 'off', 'unknown').optional(),
    door_status: Joi.string().valid('open', 'closed', 'unknown').optional(),
    battery_voltage: Joi.number().positive().optional(),
    temperature: Joi.number().optional(),
    temperature_units: Joi.string().valid('fahrenheit', 'celsius').default('fahrenheit'),
    accuracy: Joi.number().positive().optional()
  }).optional()
});

// Vehicle Assignment Validation Schemas
const assignVehicle = Joi.object({
  crew_id: Joi.string().uuid().optional(),
  job_id: Joi.string().uuid().optional(),
  assignment_type: Joi.string().valid('crew', 'job', 'maintenance', 'training', 'other').default('crew'),
  start_date: Joi.date().iso().required(),
  start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).optional(),
  end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  start_mileage: Joi.number().min(0).optional(),
  end_mileage: Joi.number().min(0).optional(),
  assigned_by: Joi.string().uuid().optional(),
  assigned_by_name: Joi.string().max(255).optional(),
  notes: Joi.string().optional()
});

// Vehicle Fuel Log Validation Schemas
const createFuelLog = Joi.object({
  fuel_date: Joi.date().iso().required(),
  fuel_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  fuel_station: Joi.string().max(255).optional(),
  fuel_station_address: Joi.string().optional(),
  fuel_type: Joi.string().valid('gasoline', 'diesel', 'electric', 'hybrid', 'other').default('gasoline'),
  fuel_quantity: Joi.number().positive().required(),
  fuel_quantity_units: Joi.string().max(10).default('gallons'),
  fuel_cost_per_unit: Joi.number().positive().required(),
  total_fuel_cost: Joi.number().positive().required(),
  odometer_reading: Joi.number().min(0).required(),
  fuel_level_before: Joi.number().min(0).max(100).optional(),
  fuel_level_after: Joi.number().min(0).max(100).optional(),
  driver_id: Joi.string().uuid().optional(),
  driver_name: Joi.string().max(255).optional(),
  notes: Joi.string().optional()
});

const updateFuelLog = Joi.object({
  fuel_date: Joi.date().iso().optional(),
  fuel_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  fuel_station: Joi.string().max(255).optional(),
  fuel_station_address: Joi.string().optional(),
  fuel_type: Joi.string().valid('gasoline', 'diesel', 'electric', 'hybrid', 'other').optional(),
  fuel_quantity: Joi.number().positive().optional(),
  fuel_quantity_units: Joi.string().max(10).optional(),
  fuel_cost_per_unit: Joi.number().positive().optional(),
  total_fuel_cost: Joi.number().positive().optional(),
  odometer_reading: Joi.number().min(0).optional(),
  fuel_level_before: Joi.number().min(0).max(100).optional(),
  fuel_level_after: Joi.number().min(0).max(100).optional(),
  driver_id: Joi.string().uuid().optional(),
  driver_name: Joi.string().max(255).optional(),
  notes: Joi.string().optional()
});

// Vehicle Inspection Validation Schemas
const createInspection = Joi.object({
  inspection_type: Joi.string().valid('pre-trip', 'post-trip', 'daily', 'weekly', 'monthly', 'annual', 'safety', 'compliance').default('pre-trip'),
  inspection_date: Joi.date().iso().required(),
  inspection_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  inspector_id: Joi.string().uuid().optional(),
  inspector_name: Joi.string().max(255).optional(),
  odometer_reading: Joi.number().min(0).required(),
  overall_condition: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'unsafe').default('good'),
  passed_inspection: Joi.boolean().default(true),
  failed_items: Joi.string().optional(),
  corrective_actions: Joi.string().optional(),
  next_inspection_date: Joi.date().iso().optional(),
  notes: Joi.string().optional()
});

const updateInspection = Joi.object({
  inspection_type: Joi.string().valid('pre-trip', 'post-trip', 'daily', 'weekly', 'monthly', 'annual', 'safety', 'compliance').optional(),
  inspection_date: Joi.date().iso().optional(),
  inspection_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  inspector_id: Joi.string().uuid().optional(),
  inspector_name: Joi.string().max(255).optional(),
  odometer_reading: Joi.number().min(0).optional(),
  overall_condition: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'unsafe').optional(),
  passed_inspection: Joi.boolean().optional(),
  failed_items: Joi.string().optional(),
  corrective_actions: Joi.string().optional(),
  next_inspection_date: Joi.date().iso().optional(),
  notes: Joi.string().optional()
});

// Vehicle Accident Validation Schemas
const createAccident = Joi.object({
  accident_date: Joi.date().iso().required(),
  accident_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  accident_location: Joi.string().required(),
  accident_type: Joi.string().valid('collision', 'rollover', 'fire', 'theft', 'vandalism', 'weather', 'mechanical', 'other').default('collision'),
  severity: Joi.string().valid('minor', 'moderate', 'major', 'totaled').default('minor'),
  description: Joi.string().required(),
  involved_parties: Joi.string().optional(),
  police_report_number: Joi.string().max(100).optional(),
  insurance_claim_number: Joi.string().max(100).optional(),
  estimated_damage_cost: Joi.number().positive().optional(),
  actual_damage_cost: Joi.number().positive().optional(),
  vehicle_damage_description: Joi.string().optional(),
  injuries: Joi.string().optional(),
  witnesses: Joi.string().optional(),
  weather_conditions: Joi.string().max(255).optional(),
  road_conditions: Joi.string().max(255).optional(),
  driver_id: Joi.string().uuid().optional(),
  driver_name: Joi.string().max(255).optional(),
  is_at_fault: Joi.boolean().default(false),
  fault_description: Joi.string().optional(),
  legal_status: Joi.string().valid('pending', 'investigation', 'settled', 'closed', 'litigation').default('pending'),
  notes: Joi.string().optional()
});

const updateAccident = Joi.object({
  accident_date: Joi.date().iso().optional(),
  accident_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  accident_location: Joi.string().optional(),
  accident_type: Joi.string().valid('collision', 'rollover', 'fire', 'theft', 'vandalism', 'weather', 'mechanical', 'other').optional(),
  severity: Joi.string().valid('minor', 'moderate', 'major', 'totaled').optional(),
  description: Joi.string().optional(),
  involved_parties: Joi.string().optional(),
  police_report_number: Joi.string().max(100).optional(),
  insurance_claim_number: Joi.string().max(100).optional(),
  estimated_damage_cost: Joi.number().positive().optional(),
  actual_damage_cost: Joi.number().positive().optional(),
  vehicle_damage_description: Joi.string().optional(),
  injuries: Joi.string().optional(),
  witnesses: Joi.string().optional(),
  weather_conditions: Joi.string().max(255).optional(),
  road_conditions: Joi.string().max(255).optional(),
  driver_id: Joi.string().uuid().optional(),
  driver_name: Joi.string().max(255).optional(),
  is_at_fault: Joi.boolean().optional(),
  fault_description: Joi.string().optional(),
  legal_status: Joi.string().valid('pending', 'investigation', 'settled', 'closed', 'litigation').optional(),
  notes: Joi.string().optional()
});

// Vehicle Document Validation Schemas
const createDocument = Joi.object({
  document_type: Joi.string().valid('manual', 'warranty', 'title', 'registration', 'insurance', 'maintenance_log', 'inspection_report', 'accident_report', 'other').default('other'),
  document_name: Joi.string().max(255).required(),
  file_path: Joi.string().max(500).optional(),
  file_size: Joi.number().positive().optional(),
  file_type: Joi.string().max(100).optional(),
  document_number: Joi.string().max(100).optional(),
  issue_date: Joi.date().iso().optional(),
  expiry_date: Joi.date().iso().optional(),
  description: Joi.string().optional(),
  is_required: Joi.boolean().default(false),
  is_public: Joi.boolean().default(false),
  uploaded_by: Joi.string().uuid().optional(),
  notes: Joi.string().optional()
});

const updateDocument = Joi.object({
  document_type: Joi.string().valid('manual', 'warranty', 'title', 'registration', 'insurance', 'maintenance_log', 'inspection_report', 'accident_report', 'other').optional(),
  document_name: Joi.string().max(255).optional(),
  file_path: Joi.string().max(500).optional(),
  file_size: Joi.number().positive().optional(),
  file_type: Joi.string().max(100).optional(),
  document_number: Joi.string().max(100).optional(),
  issue_date: Joi.date().iso().optional(),
  expiry_date: Joi.date().iso().optional(),
  description: Joi.string().optional(),
  is_required: Joi.boolean().optional(),
  is_public: Joi.boolean().optional(),
  uploaded_by: Joi.string().uuid().optional(),
  notes: Joi.string().optional()
});

// Fleet Settings Validation Schemas
const updateFleetSettings = Joi.object({
  maintenance_settings: Joi.object({
    maintenance_reminder_days: Joi.number().integer().min(1).max(30).optional(),
    oil_change_interval: Joi.number().integer().min(1000).max(10000).optional(),
    brake_service_interval: Joi.number().integer().min(5000).max(50000).optional(),
    tire_rotation_interval: Joi.number().integer().min(1000).max(10000).optional()
  }).optional(),
  fuel_settings: Joi.object({
    low_fuel_threshold: Joi.number().min(5).max(50).optional(),
    fuel_efficiency_target: Joi.number().min(5).max(50).optional(),
    fuel_cost_alert_threshold: Joi.number().positive().optional()
  }).optional(),
  tracking_settings: Joi.object({
    location_update_interval: Joi.number().integer().min(30).max(3600).optional(),
    enable_geofencing: Joi.boolean().optional(),
    enable_speed_alerts: Joi.boolean().optional(),
    speed_limit: Joi.number().min(20).max(100).optional()
  }).optional(),
  notification_settings: Joi.object({
    maintenance_reminders: Joi.boolean().optional(),
    fuel_alerts: Joi.boolean().optional(),
    location_alerts: Joi.boolean().optional(),
    email_notifications: Joi.boolean().optional(),
    sms_notifications: Joi.boolean().optional()
  }).optional()
});

// Query Parameter Validation Schemas
const getVehicles = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(255).optional(),
  status: Joi.string().valid('available', 'in-use', 'maintenance', 'out-of-service', 'retired', 'reserved').optional(),
  vehicle_type: Joi.string().valid('truck', 'trailer', 'van', 'pickup', 'dump_truck', 'flatbed', 'other').optional(),
  assigned_crew_id: Joi.string().uuid().optional(),
  assigned_job_id: Joi.string().uuid().optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  sort_by: Joi.string().valid('created_at', 'name', 'make', 'model', 'year', 'status', 'mileage').default('created_at'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc')
});

const getMaintenanceRecords = Joi.object({
  maintenance_type: Joi.string().valid('routine', 'repair', 'emergency', 'inspection', 'tire', 'brake', 'engine', 'transmission', 'other').optional(),
  status: Joi.string().valid('scheduled', 'in-progress', 'completed', 'cancelled', 'deferred').optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent', 'critical').optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  performed_by: Joi.string().uuid().optional()
});

const getFuelLogs = Joi.object({
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  fuel_type: Joi.string().valid('gasoline', 'diesel', 'electric', 'hybrid', 'other').optional(),
  driver_id: Joi.string().uuid().optional()
});

const getInspections = Joi.object({
  inspection_type: Joi.string().valid('pre-trip', 'post-trip', 'daily', 'weekly', 'monthly', 'annual', 'safety', 'compliance').optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  passed_inspection: Joi.boolean().optional(),
  inspector_id: Joi.string().uuid().optional()
});

const getFleetReports = Joi.object({
  date_from: Joi.date().iso().required(),
  date_to: Joi.date().iso().required(),
  vehicle_type: Joi.string().valid('truck', 'trailer', 'van', 'pickup', 'dump_truck', 'flatbed', 'other').optional(),
  vehicle_id: Joi.string().uuid().optional(),
  crew_id: Joi.string().uuid().optional(),
  format: Joi.string().valid('json', 'pdf').default('json')
});

// Path Parameter Validation Schemas
const vehicleId = Joi.object({
  id: Joi.string().uuid().required()
});

const maintenanceId = Joi.object({
  id: Joi.string().uuid().required(),
  maintenanceId: Joi.string().uuid().required()
});

const fuelLogId = Joi.object({
  id: Joi.string().uuid().required(),
  fuelLogId: Joi.string().uuid().required()
});

const inspectionId = Joi.object({
  id: Joi.string().uuid().required(),
  inspectionId: Joi.string().uuid().required()
});

const accidentId = Joi.object({
  id: Joi.string().uuid().required(),
  accidentId: Joi.string().uuid().required()
});

const documentId = Joi.object({
  id: Joi.string().uuid().required(),
  documentId: Joi.string().uuid().required()
});

const assignmentId = Joi.object({
  id: Joi.string().uuid().required(),
  assignmentId: Joi.string().uuid().required()
});

module.exports = {
  // Vehicle schemas
  createVehicle,
  updateVehicle,
  getVehicles,
  vehicleId,
  
  // Maintenance schemas
  createMaintenanceRecord,
  updateMaintenanceRecord,
  getMaintenanceRecords,
  maintenanceId,
  
  // Location schemas
  updateVehicleLocation,
  
  // Assignment schemas
  assignVehicle,
  assignmentId,
  
  // Fuel schemas
  createFuelLog,
  updateFuelLog,
  getFuelLogs,
  fuelLogId,
  
  // Inspection schemas
  createInspection,
  updateInspection,
  getInspections,
  inspectionId,
  
  // Accident schemas
  createAccident,
  updateAccident,
  accidentId,
  
  // Document schemas
  createDocument,
  updateDocument,
  documentId,
  
  // Fleet settings schemas
  updateFleetSettings,
  
  // Report schemas
  getFleetReports
};
