const express = require('express');
const router = express.Router();

// Import controllers
const portalUsersController = require('../controllers/portalUsersController');
const portalAuthController = require('../controllers/portalAuthController');
const portalServiceRequestsController = require('../controllers/portalServiceRequestsController');
const portalJobHistoryController = require('../controllers/portalJobHistoryController');
const portalInvoiceController = require('../controllers/portalInvoiceController');
const portalClientProfileController = require('../controllers/portalClientProfileController');
const portalReportsController = require('../controllers/portalReportsController');
const portalSettingsController = require('../controllers/portalSettingsController');

// Import validations
const {
  getAllPortalUsersSchema,
  getPortalUserByIdSchema,
  createPortalUserSchema,
  updatePortalUserSchema,
  deletePortalUserSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  getAllServiceRequestsSchema,
  getServiceRequestByIdSchema,
  createServiceRequestSchema,
  updateServiceRequestSchema,
  cancelServiceRequestSchema,
  getJobHistorySchema,
  getJobDetailsSchema,
  getInvoicesSchema,
  getInvoiceDetailsSchema,
  payInvoiceSchema,
  getClientProfileSchema,
  updateClientProfileSchema,
  changePasswordSchema,
  getServiceSummaryReportSchema,
  getPortalSettingsSchema,
  updatePortalSettingsSchema
} = require('../validations/clientPortalValidation');

// Import middleware
const { validateRequest } = require('../middleware/validation');
const { auth, requireRole } = require('../middleware/auth');

// Portal Users Routes (Admin only)
router.get('/users', 
  auth, 
  requireRole(['admin', 'manager']), 
  validateRequest(getAllPortalUsersSchema, 'query'), 
  portalUsersController.getAllPortalUsers
);

router.get('/users/:id', 
  auth, 
  requireRole(['admin', 'manager']), 
  validateRequest(getPortalUserByIdSchema, 'params'), 
  portalUsersController.getPortalUserById
);

router.post('/users', 
  auth, 
  requireRole(['admin']), 
  validateRequest(createPortalUserSchema, 'body'), 
  portalUsersController.createPortalUser
);

router.put('/users/:id', 
  auth, 
  requireRole(['admin', 'manager']), 
  validateRequest(getPortalUserByIdSchema, 'params'),
  validateRequest(updatePortalUserSchema, 'body'), 
  portalUsersController.updatePortalUser
);

router.delete('/users/:id', 
  auth, 
  requireRole(['admin']), 
  validateRequest(deletePortalUserSchema, 'params'), 
  portalUsersController.deletePortalUser
);

// Portal Authentication Routes (Public)
router.post('/auth/login', 
  validateRequest(loginSchema, 'body'), 
  portalAuthController.login
);

router.post('/auth/logout', 
  portalAuthController.verifyToken, 
  portalAuthController.logout
);

router.post('/auth/refresh', 
  validateRequest(refreshTokenSchema, 'body'), 
  portalAuthController.refreshToken
);

// Service Requests Routes (Authenticated users)
router.get('/requests', 
  portalAuthController.verifyToken, 
  validateRequest(getAllServiceRequestsSchema, 'query'), 
  portalServiceRequestsController.getAllServiceRequests
);

router.get('/requests/:id', 
  portalAuthController.verifyToken, 
  validateRequest(getServiceRequestByIdSchema, 'params'), 
  portalServiceRequestsController.getServiceRequestById
);

router.post('/requests', 
  portalAuthController.verifyToken, 
  validateRequest(createServiceRequestSchema, 'body'), 
  portalServiceRequestsController.createServiceRequest
);

router.put('/requests/:id', 
  portalAuthController.verifyToken, 
  validateRequest(getServiceRequestByIdSchema, 'params'),
  validateRequest(updateServiceRequestSchema, 'body'), 
  portalServiceRequestsController.updateServiceRequest
);

router.put('/requests/:id/cancel', 
  portalAuthController.verifyToken, 
  validateRequest(getServiceRequestByIdSchema, 'params'),
  validateRequest(cancelServiceRequestSchema, 'body'), 
  portalServiceRequestsController.cancelServiceRequest
);

// Job History Routes (Authenticated users)
router.get('/jobs', 
  portalAuthController.verifyToken, 
  validateRequest(getJobHistorySchema, 'query'), 
  portalJobHistoryController.getJobHistory
);

router.get('/jobs/:id', 
  portalAuthController.verifyToken, 
  validateRequest(getJobDetailsSchema, 'params'), 
  portalJobHistoryController.getJobDetails
);

// Invoice Management Routes (Authenticated users)
router.get('/invoices', 
  portalAuthController.verifyToken, 
  validateRequest(getInvoicesSchema, 'query'), 
  portalInvoiceController.getInvoices
);

router.get('/invoices/:id', 
  portalAuthController.verifyToken, 
  validateRequest(getInvoiceDetailsSchema, 'params'), 
  portalInvoiceController.getInvoiceDetails
);

router.post('/invoices/:id/pay', 
  portalAuthController.verifyToken, 
  validateRequest(getInvoiceDetailsSchema, 'params'),
  validateRequest(payInvoiceSchema, 'body'), 
  portalInvoiceController.payInvoice
);

// Client Profile Routes (Authenticated users)
router.get('/profile', 
  portalAuthController.verifyToken, 
  portalClientProfileController.getClientProfile
);

router.put('/profile', 
  portalAuthController.verifyToken, 
  validateRequest(updateClientProfileSchema, 'body'), 
  portalClientProfileController.updateClientProfile
);

router.put('/profile/password', 
  portalAuthController.verifyToken, 
  validateRequest(changePasswordSchema, 'body'), 
  portalClientProfileController.changePassword
);

// Portal Reports Routes (Authenticated users with report permissions)
router.get('/reports/service-summary', 
  portalAuthController.verifyToken, 
  validateRequest(getServiceSummaryReportSchema, 'query'), 
  portalReportsController.getServiceSummaryReport
);

router.get('/reports/available-types', 
  portalAuthController.verifyToken, 
  portalReportsController.getAvailableReportTypes
);

router.get('/reports/history', 
  portalAuthController.verifyToken, 
  portalReportsController.getReportHistory
);

// Portal Settings Routes (Authenticated users)
router.get('/settings', 
  portalAuthController.verifyToken, 
  portalSettingsController.getPortalSettings
);

router.put('/settings', 
  portalAuthController.verifyToken, 
  validateRequest(updatePortalSettingsSchema, 'body'), 
  portalSettingsController.updatePortalSettings
);

router.get('/settings/options', 
  portalAuthController.verifyToken, 
  portalSettingsController.getSettingOptions
);

router.post('/settings/reset', 
  portalAuthController.verifyToken, 
  portalSettingsController.resetSettingsToDefaults
);

// Health check route
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Client Portal API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
