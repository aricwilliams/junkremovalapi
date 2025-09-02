const express = require('express');
const router = express.Router();

// Import middleware
const { auth } = require('../middleware/auth');
const { requireRole } = require('../middleware/requireRole');
const { validateRequest } = require('../middleware/validateRequest');

// Import validation schemas
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema,
  employeeIdParamSchema,
  updateEmployeeScheduleSchema,
  scheduleQuerySchema,
  createPerformanceReviewSchema,
  performanceQuerySchema,
  clockInOutSchema,
  timeLogsQuerySchema,
  addTrainingRecordSchema,
  payrollQuerySchema,
  reportsQuerySchema,
  performanceReportQuerySchema,
  updateEmployeeSettingsSchema,
  createEmergencyContactSchema,
  updateEmergencyContactSchema,
  emergencyContactIdParamSchema,
  createDocumentSchema,
  updateDocumentSchema,
  documentIdParamSchema,
  createCertificationSchema,
  updateCertificationSchema,
  certificationIdParamSchema,
  createPayRateSchema,
  updatePayRateSchema,
  payRateIdParamSchema,
  createBenefitSchema,
  updateBenefitSchema,
  benefitIdParamSchema,
  createIncidentSchema,
  updateIncidentSchema,
  incidentIdParamSchema,
  createEquipmentSchema,
  updateEquipmentSchema,
  equipmentIdParamSchema
} = require('../validations/employeeValidation');

// Import controllers
const employeesController = require('../controllers/employeesController');
const employeeSchedulesController = require('../controllers/employeeSchedulesController');
const employeePayrollController = require('../controllers/employeePayrollController');
const employeeTrainingController = require('../controllers/employeeTrainingController');
const employeeTimeTrackingController = require('../controllers/employeeTimeTrackingController');
const employeeReportsController = require('../controllers/employeeReportsController');

// Apply authentication middleware to all routes
router.use(auth);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Employees API is running',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// CORE EMPLOYEE ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/employees
 * @desc Get all employees with filtering, sorting, and pagination
 * @access admin, manager, hr
 */
router.get('/', 
  requireRole(['admin', 'manager', 'hr']),
  validateRequest(employeeQuerySchema, 'query'),
  employeesController.getAllEmployees
);

/**
 * @route POST /api/v1/employees
 * @desc Create a new employee
 * @access admin, hr
 */
router.post('/',
  requireRole(['admin', 'hr']),
  validateRequest(createEmployeeSchema, 'body'),
  employeesController.createEmployee
);

/**
 * @route GET /api/v1/employees/:id
 * @desc Get employee by ID with all related information
 * @access admin, manager, hr, supervisor (for their direct reports)
 */
router.get('/:id',
  requireRole(['admin', 'manager', 'hr', 'supervisor']),
  validateRequest(employeeIdParamSchema, 'params'),
  employeesController.getEmployeeById
);

/**
 * @route PUT /api/v1/employees/:id
 * @desc Update an existing employee
 * @access admin, hr, manager (for their direct reports)
 */
router.put('/:id',
  requireRole(['admin', 'hr', 'manager']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(updateEmployeeSchema, 'body'),
  employeesController.updateEmployee
);

/**
 * @route DELETE /api/v1/employees/:id
 * @desc Delete an employee (soft delete - sets status to 'terminated')
 * @access admin, hr
 */
router.delete('/:id',
  requireRole(['admin', 'hr']),
  validateRequest(employeeIdParamSchema, 'params'),
  employeesController.deleteEmployee
);

// ============================================================================
// EMPLOYEE SCHEDULE ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/employees/:id/schedule
 * @desc Get employee schedule for a period
 * @access admin, manager, hr, supervisor, employee (own schedule)
 */
router.get('/:id/schedule',
  requireRole(['admin', 'manager', 'hr', 'supervisor', 'employee']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(scheduleQuerySchema, 'query'),
  employeeSchedulesController.getEmployeeSchedule
);

/**
 * @route PUT /api/v1/employees/:id/schedule
 * @desc Update employee schedule
 * @access admin, manager, hr
 */
router.put('/:id/schedule',
  requireRole(['admin', 'manager', 'hr']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(updateEmployeeScheduleSchema, 'body'),
  employeeSchedulesController.updateEmployeeSchedule
);

/**
 * @route GET /api/v1/employees/:id/availability
 * @desc Get employee availability and potential conflicts
 * @access admin, manager, hr, supervisor
 */
router.get('/:id/availability',
  requireRole(['admin', 'manager', 'hr', 'supervisor']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(scheduleQuerySchema, 'query'),
  employeeSchedulesController.getEmployeeAvailability
);

/**
 * @route GET /api/v1/employees/team/schedule
 * @desc Get consolidated schedule for a team
 * @access admin, manager, hr, supervisor
 */
router.get('/team/schedule',
  requireRole(['admin', 'manager', 'hr', 'supervisor']),
  validateRequest(scheduleQuerySchema, 'query'),
  employeeSchedulesController.getTeamSchedule
);

// ============================================================================
// EMPLOYEE PAYROLL ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/employees/:id/payroll
 * @desc Get employee payroll information for a specific period
 * @access admin, hr, manager (for their direct reports), employee (own payroll)
 */
router.get('/:id/payroll',
  requireRole(['admin', 'hr', 'manager', 'employee']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(payrollQuerySchema, 'query'),
  employeePayrollController.getEmployeePayroll
);

/**
 * @route GET /api/v1/employees/payroll/summary
 * @desc Get payroll summary for all employees
 * @access admin, hr, manager
 */
router.get('/payroll/summary',
  requireRole(['admin', 'hr', 'manager']),
  validateRequest(payrollQuerySchema, 'query'),
  employeePayrollController.getPayrollSummary
);

/**
 * @route GET /api/v1/employees/payroll/reports
 * @desc Get payroll reports and analytics
 * @access admin, hr, manager
 */
router.get('/payroll/reports',
  requireRole(['admin', 'hr', 'manager']),
  validateRequest(payrollQuerySchema, 'query'),
  employeePayrollController.getPayrollReports
);

// ============================================================================
// EMPLOYEE TRAINING ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/employees/:id/training
 * @desc Get employee training records and certifications
 * @access admin, manager, hr, supervisor, employee (own training)
 */
router.get('/:id/training',
  requireRole(['admin', 'manager', 'hr', 'supervisor', 'employee']),
  validateRequest(employeeIdParamSchema, 'params'),
  employeeTrainingController.getEmployeeTraining
);

/**
 * @route POST /api/v1/employees/:id/training
 * @desc Add training record for an employee
 * @access admin, manager, hr
 */
router.post('/:id/training',
  requireRole(['admin', 'manager', 'hr']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(addTrainingRecordSchema, 'body'),
  employeeTrainingController.addTrainingRecord
);

/**
 * @route PUT /api/v1/employees/:id/training/:training_id
 * @desc Update training record
 * @access admin, manager, hr
 */
router.put('/:id/training/:training_id',
  requireRole(['admin', 'manager', 'hr']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(addTrainingRecordSchema, 'body'),
  employeeTrainingController.updateTrainingRecord
);

/**
 * @route GET /api/v1/employees/training/analytics
 * @desc Get training analytics and reports
 * @access admin, manager, hr
 */
router.get('/training/analytics',
  requireRole(['admin', 'manager', 'hr']),
  validateRequest(reportsQuerySchema, 'query'),
  employeeTrainingController.getTrainingAnalytics
);

// ============================================================================
// EMPLOYEE TIME TRACKING ENDPOINTS
// ============================================================================

/**
 * @route POST /api/v1/employees/:id/clock
 * @desc Clock in/out for an employee
 * @access admin, manager, hr, employee (own clock in/out)
 */
router.post('/:id/clock',
  requireRole(['admin', 'manager', 'hr', 'employee']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(clockInOutSchema, 'body'),
  employeeTimeTrackingController.clockInOut
);

/**
 * @route GET /api/v1/employees/:id/time-logs
 * @desc Get employee time logs
 * @access admin, manager, hr, supervisor, employee (own time logs)
 */
router.get('/:id/time-logs',
  requireRole(['admin', 'manager', 'hr', 'supervisor', 'employee']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(timeLogsQuerySchema, 'query'),
  employeeTimeTrackingController.getEmployeeTimeLogs
);

/**
 * @route GET /api/v1/employees/time-tracking/team
 * @desc Get team time tracking summary
 * @access admin, manager, hr, supervisor
 */
router.get('/time-tracking/team',
  requireRole(['admin', 'manager', 'hr', 'supervisor']),
  validateRequest(timeLogsQuerySchema, 'query'),
  employeeTimeTrackingController.getTeamTimeTracking
);

/**
 * @route GET /api/v1/employees/time-tracking/analytics
 * @desc Get time tracking analytics and reports
 * @access admin, manager, hr
 */
router.get('/time-tracking/analytics',
  requireRole(['admin', 'manager', 'hr']),
  validateRequest(reportsQuerySchema, 'query'),
  employeeTimeTrackingController.getTimeTrackingAnalytics
);

// ============================================================================
// EMPLOYEE REPORTS ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/employees/reports/summary
 * @desc Get employee summary report
 * @access admin, manager, hr
 */
router.get('/reports/summary',
  requireRole(['admin', 'manager', 'hr']),
  validateRequest(reportsQuerySchema, 'query'),
  employeeReportsController.getEmployeeSummaryReport
);

/**
 * @route GET /api/v1/employees/reports/performance
 * @desc Get employee performance report
 * @access admin, manager, hr
 */
router.get('/reports/performance',
  requireRole(['admin', 'manager', 'hr']),
  validateRequest(performanceReportQuerySchema, 'query'),
  employeeReportsController.getEmployeePerformanceReport
);

/**
 * @route GET /api/v1/employees/reports/turnover
 * @desc Get employee turnover analysis
 * @access admin, manager, hr
 */
router.get('/reports/turnover',
  requireRole(['admin', 'manager', 'hr']),
  validateRequest(reportsQuerySchema, 'query'),
  employeeReportsController.getEmployeeTurnoverAnalysis
);

// ============================================================================
// EMPLOYEE EMERGENCY CONTACTS ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/employees/:id/emergency-contacts
 * @desc Get employee emergency contacts
 * @access admin, manager, hr, supervisor, employee (own contacts)
 */
router.get('/:id/emergency-contacts',
  requireRole(['admin', 'manager', 'hr', 'supervisor', 'employee']),
  validateRequest(employeeIdParamSchema, 'params'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Emergency contacts endpoints not yet implemented',
      error: 'NOT_IMPLEMENTED',
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * @route POST /api/v1/employees/:id/emergency-contacts
 * @desc Add emergency contact for an employee
 * @access admin, manager, hr
 */
router.post('/:id/emergency-contacts',
  requireRole(['admin', 'manager', 'hr']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(createEmergencyContactSchema, 'body'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Emergency contacts endpoints not yet implemented',
      error: 'NOT_IMPLEMENTED',
      timestamp: new Date().toISOString()
    });
  }
);

// ============================================================================
// EMPLOYEE DOCUMENTS ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/employees/:id/documents
 * @desc Get employee documents
 * @access admin, manager, hr, supervisor, employee (own documents)
 */
router.get('/:id/documents',
  requireRole(['admin', 'manager', 'hr', 'supervisor', 'employee']),
  validateRequest(employeeIdParamSchema, 'params'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Documents endpoints not yet implemented',
      error: 'NOT_IMPLEMENTED',
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * @route POST /api/v1/employees/:id/documents
 * @desc Add document for an employee
 * @access admin, manager, hr
 */
router.post('/:id/documents',
  requireRole(['admin', 'manager', 'hr']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(createDocumentSchema, 'body'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Documents endpoints not yet implemented',
      error: 'NOT_IMPLEMENTED',
      timestamp: new Date().toISOString()
    });
  }
);

// ============================================================================
// EMPLOYEE CERTIFICATIONS ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/employees/:id/certifications
 * @desc Get employee certifications
 * @access admin, manager, hr, supervisor, employee (own certifications)
 */
router.get('/:id/certifications',
  requireRole(['admin', 'manager', 'hr', 'supervisor', 'employee']),
  validateRequest(employeeIdParamSchema, 'params'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Certifications endpoints not yet implemented',
      error: 'NOT_IMPLEMENTED',
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * @route POST /api/v1/employees/:id/certifications
 * @desc Add certification for an employee
 * @access admin, manager, hr
 */
router.post('/:id/certifications',
  requireRole(['admin', 'manager', 'hr']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(createCertificationSchema, 'body'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Certifications endpoints not yet implemented',
      error: 'NOT_IMPLEMENTED',
      timestamp: new Date().toISOString()
    });
  }
);

// ============================================================================
// EMPLOYEE PAY RATES ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/employees/:id/pay-rates
 * @desc Get employee pay rates
 * @access admin, manager, hr, employee (own pay rates)
 */
router.get('/:id/pay-rates',
  requireRole(['admin', 'manager', 'hr', 'employee']),
  validateRequest(employeeIdParamSchema, 'params'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Pay rates endpoints not yet implemented',
      error: 'NOT_IMPLEMENTED',
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * @route POST /api/v1/employees/:id/pay-rates
 * @desc Add pay rate for an employee
 * @access admin, hr
 */
router.post('/:id/pay-rates',
  requireRole(['admin', 'hr']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(createPayRateSchema, 'body'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Pay rates endpoints not yet implemented',
      error: 'NOT_IMPLEMENTED',
      timestamp: new Date().toISOString()
    });
  }
);

// ============================================================================
// EMPLOYEE BENEFITS ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/employees/:id/benefits
 * @desc Get employee benefits
 * @access admin, manager, hr, employee (own benefits)
 */
router.get('/:id/benefits',
  requireRole(['admin', 'manager', 'hr', 'employee']),
  validateRequest(employeeIdParamSchema, 'params'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Benefits endpoints not yet implemented',
      error: 'NOT_IMPLEMENTED',
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * @route POST /api/v1/employees/:id/benefits
 * @desc Add benefit for an employee
 * @access admin, hr
 */
router.post('/:id/benefits',
  requireRole(['admin', 'hr']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(createBenefitSchema, 'body'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Benefits endpoints not yet implemented',
      error: 'NOT_IMPLEMENTED',
      timestamp: new Date().toISOString()
    });
  }
);

// ============================================================================
// EMPLOYEE INCIDENTS ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/employees/:id/incidents
 * @desc Get employee incidents
 * @access admin, manager, hr, supervisor
 */
router.get('/:id/incidents',
  requireRole(['admin', 'manager', 'hr', 'supervisor']),
  validateRequest(employeeIdParamSchema, 'params'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Incidents endpoints not yet implemented',
      error: 'NOT_IMPLEMENTED',
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * @route POST /api/v1/employees/:id/incidents
 * @desc Add incident for an employee
 * @access admin, manager, hr, supervisor
 */
router.post('/:id/incidents',
  requireRole(['admin', 'manager', 'hr', 'supervisor']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(createIncidentSchema, 'body'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Incidents endpoints not yet implemented',
      error: 'NOT_IMPLEMENTED',
      timestamp: new Date().toISOString()
    });
  }
);

// ============================================================================
// EMPLOYEE EQUIPMENT ENDPOINTS
// ============================================================================

/**
 * @route GET /api/v1/employees/:id/equipment
 * @desc Get employee equipment
 * @access admin, manager, hr, supervisor, employee (own equipment)
 */
router.get('/:id/equipment',
  requireRole(['admin', 'manager', 'hr', 'supervisor', 'employee']),
  validateRequest(employeeIdParamSchema, 'params'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Equipment endpoints not yet implemented',
      error: 'NOT_IMPLEMENTED',
      timestamp: new Date().toISOString()
    });
  }
);

/**
 * @route POST /api/v1/employees/:id/equipment
 * @desc Add equipment for an employee
 * @access admin, manager, hr
 */
router.post('/:id/equipment',
  requireRole(['admin', 'manager', 'hr']),
  validateRequest(employeeIdParamSchema, 'params'),
  validateRequest(createEquipmentSchema, 'body'),
  (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Equipment endpoints not yet implemented',
      error: 'NOT_IMPLEMENTED',
      timestamp: new Date().toISOString()
    });
  }
);

// ============================================================================
// 404 HANDLER
// ============================================================================

router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Employee endpoint not found',
    error: 'ENDPOINT_NOT_FOUND',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
