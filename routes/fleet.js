const express = require('express');
const router = express.Router();

// Import controllers
const vehiclesController = require('../controllers/vehiclesController');
const vehicleMaintenanceController = require('../controllers/vehicleMaintenanceController');
const vehicleTrackingController = require('../controllers/vehicleTrackingController');
const vehicleAssignmentsController = require('../controllers/vehicleAssignmentsController');
const vehicleFuelLogsController = require('../controllers/vehicleFuelLogsController');
const fleetReportsController = require('../controllers/fleetReportsController');
const fleetSettingsController = require('../controllers/fleetSettingsController');

// Import middleware
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { validateRequest } = require('../middleware/validateRequest');

// Import validation schemas
const {
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
  
  // Fleet settings schemas
  updateFleetSettings,
  
  // Report schemas
  getFleetReports
} = require('../validations/fleetValidation');

// Apply authentication middleware to all routes
router.use(auth);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Fleet Management API is running',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// VEHICLES MANAGEMENT
// ============================================================================

/**
 * @route   GET /api/v1/fleet/vehicles
 * @desc    Get all vehicles with filtering, sorting, and pagination
 * @access  Private - All authenticated users
 */
router.get('/vehicles', 
  requireRole(['admin', 'manager', 'dispatcher', 'driver']),
  validateRequest(getVehicles, 'query'),
  vehiclesController.getAllVehicles
);

/**
 * @route   GET /api/v1/fleet/vehicles/:id
 * @desc    Get vehicle by ID with all related information
 * @access  Private - All authenticated users
 */
router.get('/vehicles/:id',
  requireRole(['admin', 'manager', 'dispatcher', 'driver']),
  validateRequest(vehicleId, 'params'),
  vehiclesController.getVehicleById
);

/**
 * @route   POST /api/v1/fleet/vehicles
 * @desc    Create a new vehicle
 * @access  Private - Admin, Manager, Dispatcher
 */
router.post('/vehicles',
  requireRole(['admin', 'manager', 'dispatcher']),
  validateRequest(createVehicle, 'body'),
  vehiclesController.createVehicle
);

/**
 * @route   PUT /api/v1/fleet/vehicles/:id
 * @desc    Update an existing vehicle
 * @access  Private - Admin, Manager, Dispatcher
 */
router.put('/vehicles/:id',
  requireRole(['admin', 'manager', 'dispatcher']),
  validateRequest(vehicleId, 'params'),
  validateRequest(updateVehicle, 'body'),
  vehiclesController.updateVehicle
);

/**
 * @route   DELETE /api/v1/fleet/vehicles/:id
 * @desc    Delete a vehicle (soft delete)
 * @access  Private - Admin, Manager
 */
router.delete('/vehicles/:id',
  requireRole(['admin', 'manager']),
  validateRequest(vehicleId, 'params'),
  vehiclesController.deleteVehicle
);

// ============================================================================
// VEHICLE MAINTENANCE
// ============================================================================

/**
 * @route   GET /api/v1/fleet/vehicles/:id/maintenance
 * @desc    Get all maintenance records for a specific vehicle
 * @access  Private - All authenticated users
 */
router.get('/vehicles/:id/maintenance',
  requireRole(['admin', 'manager', 'dispatcher', 'driver']),
  validateRequest(vehicleId, 'params'),
  validateRequest(getMaintenanceRecords, 'query'),
  vehicleMaintenanceController.getVehicleMaintenance
);

/**
 * @route   POST /api/v1/fleet/vehicles/:id/maintenance
 * @desc    Create a new maintenance record for a vehicle
 * @access  Private - Admin, Manager, Dispatcher
 */
router.post('/vehicles/:id/maintenance',
  requireRole(['admin', 'manager', 'dispatcher']),
  validateRequest(vehicleId, 'params'),
  validateRequest(createMaintenanceRecord, 'body'),
  vehicleMaintenanceController.createMaintenanceRecord
);

/**
 * @route   GET /api/v1/fleet/vehicles/:id/maintenance/:maintenanceId
 * @desc    Get maintenance record by ID
 * @access  Private - Admin, Manager, Dispatcher
 */
router.get('/vehicles/:id/maintenance/:maintenanceId',
  requireRole(['admin', 'manager', 'dispatcher']),
  validateRequest(maintenanceId, 'params'),
  vehicleMaintenanceController.getMaintenanceRecordById
);

/**
 * @route   PUT /api/v1/fleet/vehicles/:id/maintenance/:maintenanceId
 * @desc    Update an existing maintenance record
 * @access  Private - Admin, Manager, Dispatcher
 */
router.put('/vehicles/:id/maintenance/:maintenanceId',
  requireRole(['admin', 'manager', 'dispatcher']),
  validateRequest(maintenanceId, 'params'),
  validateRequest(updateMaintenanceRecord, 'body'),
  vehicleMaintenanceController.updateMaintenanceRecord
);

/**
 * @route   DELETE /api/v1/fleet/vehicles/:id/maintenance/:maintenanceId
 * @desc    Delete a maintenance record
 * @access  Private - Admin, Manager
 */
router.delete('/vehicles/:id/maintenance/:maintenanceId',
  requireRole(['admin', 'manager']),
  validateRequest(maintenanceId, 'params'),
  vehicleMaintenanceController.deleteMaintenanceRecord
);

// ============================================================================
// VEHICLE TRACKING
// ============================================================================

/**
 * @route   GET /api/v1/fleet/vehicles/:id/location
 * @desc    Get current location and tracking information for a vehicle
 * @access  Private - All authenticated users
 */
router.get('/vehicles/:id/location',
  requireRole(['admin', 'manager', 'dispatcher', 'driver']),
  validateRequest(vehicleId, 'params'),
  vehicleTrackingController.getVehicleLocation
);

/**
 * @route   POST /api/v1/fleet/vehicles/:id/location
 * @desc    Update the current location of a vehicle
 * @access  Private - Admin, Manager, Dispatcher, Driver
 */
router.post('/vehicles/:id/location',
  requireRole(['admin', 'manager', 'dispatcher', 'driver']),
  validateRequest(vehicleId, 'params'),
  validateRequest(updateVehicleLocation, 'body'),
  vehicleTrackingController.updateVehicleLocation
);

/**
 * @route   GET /api/v1/fleet/vehicles/:id/tracking
 * @desc    Get vehicle tracking history
 * @access  Private - Admin, Manager, Dispatcher
 */
router.get('/vehicles/:id/tracking',
  requireRole(['admin', 'manager', 'dispatcher']),
  validateRequest(vehicleId, 'params'),
  vehicleTrackingController.getVehicleTrackingHistory
);

/**
 * @route   GET /api/v1/fleet/location
 * @desc    Get real-time fleet location (all vehicles)
 * @access  Private - Admin, Manager, Dispatcher
 */
router.get('/location',
  requireRole(['admin', 'manager', 'dispatcher']),
  vehicleTrackingController.getFleetLocation
);

// ============================================================================
// VEHICLE ASSIGNMENTS
// ============================================================================

/**
 * @route   GET /api/v1/fleet/vehicles/:id/assignments
 * @desc    Get all driver assignments for a specific vehicle
 * @access  Private - Admin, Manager, Dispatcher
 */
router.get('/vehicles/:id/assignments',
  requireRole(['admin', 'manager', 'dispatcher']),
  validateRequest(vehicleId, 'params'),
  vehicleAssignmentsController.getVehicleAssignments
);

/**
 * @route   POST /api/v1/fleet/vehicles/:id/assign
 * @desc    Assign a vehicle to a driver/crew
 * @access  Private - Admin, Manager, Dispatcher
 */
router.post('/vehicles/:id/assign',
  requireRole(['admin', 'manager', 'dispatcher']),
  validateRequest(vehicleId, 'params'),
  validateRequest(assignVehicle, 'body'),
  vehicleAssignmentsController.assignVehicle
);

/**
 * @route   GET /api/v1/fleet/vehicles/:id/assignments/:assignmentId
 * @desc    Get assignment by ID
 * @access  Private - Admin, Manager, Dispatcher
 */
router.get('/vehicles/:id/assignments/:assignmentId',
  requireRole(['admin', 'manager', 'dispatcher']),
  validateRequest(assignmentId, 'params'),
  vehicleAssignmentsController.getAssignmentById
);

/**
 * @route   PUT /api/v1/fleet/vehicles/:id/assignments/:assignmentId
 * @desc    Update an existing vehicle assignment
 * @access  Private - Admin, Manager, Dispatcher
 */
router.put('/vehicles/:id/assignments/:assignmentId',
  requireRole(['admin', 'manager', 'dispatcher']),
  validateRequest(assignmentId, 'params'),
  validateRequest(assignVehicle, 'body'),
  vehicleAssignmentsController.updateVehicleAssignment
);

/**
 * @route   DELETE /api/v1/fleet/vehicles/:id/assignments/:assignmentId
 * @desc    Delete a vehicle assignment
 * @access  Private - Admin, Manager
 */
router.delete('/vehicles/:id/assignments/:assignmentId',
  requireRole(['admin', 'manager']),
  validateRequest(assignmentId, 'params'),
  vehicleAssignmentsController.deleteVehicleAssignment
);

// ============================================================================
// VEHICLE FUEL LOGS
// ============================================================================

/**
 * @route   GET /api/v1/fleet/vehicles/:id/fuel-logs
 * @desc    Get all fuel logs for a specific vehicle
 * @access  Private - All authenticated users
 */
router.get('/vehicles/:id/fuel-logs',
  requireRole(['admin', 'manager', 'dispatcher', 'driver']),
  validateRequest(vehicleId, 'params'),
  validateRequest(getFuelLogs, 'query'),
  vehicleFuelLogsController.getVehicleFuelLogs
);

/**
 * @route   POST /api/v1/fleet/vehicles/:id/fuel-logs
 * @desc    Add a new fuel log entry for a vehicle
 * @access  Private - Admin, Manager, Dispatcher, Driver
 */
router.post('/vehicles/:id/fuel-logs',
  requireRole(['admin', 'manager', 'dispatcher', 'driver']),
  validateRequest(vehicleId, 'params'),
  validateRequest(createFuelLog, 'body'),
  vehicleFuelLogsController.addFuelLog
);

/**
 * @route   GET /api/v1/fleet/vehicles/:id/fuel-logs/:fuelLogId
 * @desc    Get fuel log by ID
 * @access  Private - Admin, Manager, Dispatcher
 */
router.get('/vehicles/:id/fuel-logs/:fuelLogId',
  requireRole(['admin', 'manager', 'dispatcher']),
  validateRequest(fuelLogId, 'params'),
  vehicleFuelLogsController.getFuelLogById
);

/**
 * @route   PUT /api/v1/fleet/vehicles/:id/fuel-logs/:fuelLogId
 * @desc    Update an existing fuel log
 * @access  Private - Admin, Manager, Dispatcher
 */
router.put('/vehicles/:id/fuel-logs/:fuelLogId',
  requireRole(['admin', 'manager', 'dispatcher']),
  validateRequest(fuelLogId, 'params'),
  validateRequest(updateFuelLog, 'body'),
  vehicleFuelLogsController.updateFuelLog
);

/**
 * @route   DELETE /api/v1/fleet/vehicles/:id/fuel-logs/:fuelLogId
 * @desc    Delete a fuel log
 * @access  Private - Admin, Manager
 */
router.delete('/vehicles/:id/fuel-logs/:fuelLogId',
  requireRole(['admin', 'manager']),
  validateRequest(fuelLogId, 'params'),
  vehicleFuelLogsController.deleteFuelLog
);

// ============================================================================
// FLEET REPORTS
// ============================================================================

/**
 * @route   GET /api/v1/fleet/reports/summary
 * @desc    Get a summary report of all fleet operations and metrics
 * @access  Private - Admin, Manager, Dispatcher
 */
router.get('/reports/summary',
  requireRole(['admin', 'manager', 'dispatcher']),
  validateRequest(getFleetReports, 'query'),
  fleetReportsController.getFleetSummaryReport
);

/**
 * @route   GET /api/v1/fleet/reports/performance
 * @desc    Get detailed performance metrics for fleet operations
 * @access  Private - Admin, Manager, Dispatcher
 */
router.get('/reports/performance',
  requireRole(['admin', 'manager', 'dispatcher']),
  validateRequest(getFleetReports, 'query'),
  fleetReportsController.getFleetPerformanceReport
);

/**
 * @route   GET /api/v1/fleet/reports/insights
 * @desc    Get fleet insights and actionable recommendations
 * @access  Private - Admin, Manager, Dispatcher
 */
router.get('/reports/insights',
  requireRole(['admin', 'manager', 'dispatcher']),
  validateRequest(getFleetReports, 'query'),
  fleetReportsController.getFleetInsights
);

// ============================================================================
// FLEET SETTINGS
// ============================================================================

/**
 * @route   GET /api/v1/fleet/settings
 * @desc    Get all fleet management settings and configurations
 * @access  Private - Admin, Manager, Dispatcher
 */
router.get('/settings',
  requireRole(['admin', 'manager', 'dispatcher']),
  fleetSettingsController.getFleetSettings
);

/**
 * @route   PUT /api/v1/fleet/settings
 * @desc    Update fleet management settings
 * @access  Private - Admin, Manager
 */
router.put('/settings',
  requireRole(['admin', 'manager']),
  validateRequest(updateFleetSettings, 'body'),
  fleetSettingsController.updateFleetSettings
);

/**
 * @route   GET /api/v1/fleet/settings/:key
 * @desc    Get a specific fleet setting by key
 * @access  Private - Admin, Manager, Dispatcher
 */
router.get('/settings/:key',
  requireRole(['admin', 'manager', 'dispatcher']),
  fleetSettingsController.getFleetSettingByKey
);

/**
 * @route   POST /api/v1/fleet/settings
 * @desc    Create a new fleet setting
 * @access  Private - Admin, Manager
 */
router.post('/settings',
  requireRole(['admin', 'manager']),
  fleetSettingsController.createFleetSetting
);

/**
 * @route   DELETE /api/v1/fleet/settings/:key
 * @desc    Delete a fleet setting
 * @access  Private - Admin, Manager
 */
router.delete('/settings/:key',
  requireRole(['admin', 'manager']),
  fleetSettingsController.deleteFleetSetting
);

/**
 * @route   POST /api/v1/fleet/settings/reset
 * @desc    Reset fleet settings to defaults
 * @access  Private - Admin
 */
router.post('/settings/reset',
  requireRole(['admin']),
  fleetSettingsController.resetFleetSettings
);

// ============================================================================
// 404 HANDLER FOR UNKNOWN FLEET ENDPOINTS
// ============================================================================

router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Fleet Management API endpoint not found',
    error: 'ENDPOINT_NOT_FOUND',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
