const express = require('express');
const router = express.Router();

// Import controllers
const customerController = require('../controllers/customerController');
const customerContactsController = require('../controllers/customerContactsController');
const customerAddressesController = require('../controllers/customerAddressesController');
const customerTagsController = require('../controllers/customerTagsController');
const customerNotesController = require('../controllers/customerNotesController');
const customerCommunicationsController = require('../controllers/customerCommunicationsController');
const customerPreferencesController = require('../controllers/customerPreferencesController');
const customerServiceHistoryController = require('../controllers/customerServiceHistoryController');
const customerReportsController = require('../controllers/customerReportsController');

// Import middleware
const { auth, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const customerValidation = require('../validations/customerValidation');

// ============================================================================
// HEALTH CHECK AND UTILITY ROUTES (No authentication required)
// ============================================================================

// Health check for customers module
router.get('/health', customerController.healthCheck);

// Get API documentation
router.get('/docs', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Customers API Documentation',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET /': 'Get all customers with filtering and pagination',
      'GET /:id': 'Get customer by ID with full details',
      'POST /': 'Create new customer',
      'PUT /:id': 'Update customer',
      'DELETE /:id': 'Soft delete customer',
      'GET /search': 'Search customers with advanced criteria',
      'GET /:id/contacts': 'Get customer contacts',
      'POST /:id/contacts': 'Add customer contact',
      'GET /:id/addresses': 'Get customer addresses',
      'POST /:id/addresses': 'Add customer address',
      'GET /:id/tags': 'Get customer tags',
      'POST /:id/tags': 'Assign tag to customer',
      'GET /:id/notes': 'Get customer notes',
      'POST /:id/notes': 'Add customer note',
      'GET /:id/communications': 'Get customer communications',
      'POST /:id/communications': 'Log customer communication',
      'GET /:id/preferences': 'Get customer preferences',
      'PUT /:id/preferences': 'Update customer preferences',
      'GET /:id/service-history': 'Get customer service history',
      'POST /:id/service-history': 'Create service history entry',
      'GET /reports/summary': 'Get customer summary report',
      'GET /reports/analytics': 'Get customer analytics',
      'GET /reports/export': 'Export customers data',
      'GET /reports/insights': 'Get customer insights and recommendations'
    }
  });
});

// ============================================================================
// CORE CUSTOMER ROUTES (Authentication required)
// ============================================================================

// Apply authentication middleware to all routes below
router.use(auth);

// 1. Get All Customers
router.get('/', 
  validateRequest(customerValidation.getCustomers, 'query'),
  customerController.getAllCustomers
);

// 2. Get Customer by ID
router.get('/:id', 
  validateRequest(customerValidation.customerId, 'params'),
  customerController.getCustomerById
);

// 3. Create New Customer
router.post('/', 
  requireRole(['admin', 'manager', 'sales']),
  validateRequest(customerValidation.createCustomer, 'body'),
  customerController.createCustomer
);

// 4. Update Customer
router.put('/:id', 
  requireRole(['admin', 'manager', 'sales']),
  validateRequest(customerValidation.customerId, 'params'),
  validateRequest(customerValidation.updateCustomer, 'body'),
  customerController.updateCustomer
);

// 5. Delete Customer (Soft Delete)
router.delete('/:id', 
  requireRole(['admin', 'manager']),
  validateRequest(customerValidation.customerId, 'params'),
  customerController.deleteCustomer
);

// 6. Search Customers
router.get('/search', 
  validateRequest(customerValidation.searchCustomers, 'query'),
  customerController.searchCustomers
);

// ============================================================================
// CUSTOMER CONTACTS ROUTES
// ============================================================================

// 7. Get Customer Contacts
router.get('/:id/contacts', 
  validateRequest(customerValidation.customerId, 'params'),
  customerContactsController.getCustomerContacts
);

// 8. Add Customer Contact
router.post('/:id/contacts', 
  requireRole(['admin', 'manager', 'sales']),
  validateRequest(customerValidation.customerId, 'params'),
  validateRequest(customerValidation.createCustomerContact, 'body'),
  customerContactsController.addCustomerContact
);

// 9. Update Customer Contact
router.put('/:id/contacts/:contactId', 
  requireRole(['admin', 'manager', 'sales']),
  validateRequest(customerValidation.contactId, 'params'),
  validateRequest(customerValidation.updateCustomerContact, 'body'),
  customerContactsController.updateCustomerContact
);

// 10. Delete Customer Contact
router.delete('/:id/contacts/:contactId', 
  requireRole(['admin', 'manager', 'sales']),
  validateRequest(customerValidation.contactId, 'params'),
  customerContactsController.deleteCustomerContact
);

// Get specific contact
router.get('/:id/contacts/:contactId', 
  validateRequest(customerValidation.contactId, 'params'),
  customerContactsController.getCustomerContactById
);

// ============================================================================
// CUSTOMER ADDRESSES ROUTES
// ============================================================================

// 11. Get Customer Addresses
router.get('/:id/addresses', 
  validateRequest(customerValidation.customerId, 'params'),
  customerAddressesController.getCustomerAddresses
);

// 12. Add Customer Address
router.post('/:id/addresses', 
  requireRole(['admin', 'manager', 'sales']),
  validateRequest(customerValidation.customerId, 'params'),
  validateRequest(customerValidation.createCustomerAddress, 'body'),
  customerAddressesController.addCustomerAddress
);

// Update Customer Address
router.put('/:id/addresses/:addressId', 
  requireRole(['admin', 'manager', 'sales']),
  validateRequest(customerValidation.addressId, 'params'),
  validateRequest(customerValidation.updateCustomerAddress, 'body'),
  customerAddressesController.updateCustomerAddress
);

// Delete Customer Address
router.delete('/:id/addresses/:addressId', 
  requireRole(['admin', 'manager', 'sales']),
  validateRequest(customerValidation.addressId, 'params'),
  customerAddressesController.deleteCustomerAddress
);

// Get specific address
router.get('/:id/addresses/:addressId', 
  validateRequest(customerValidation.addressId, 'params'),
  customerAddressesController.getCustomerAddressById
);

// ============================================================================
// CUSTOMER TAGS ROUTES
// ============================================================================

// 13. Get Customer Tags
router.get('/:id/tags', 
  validateRequest(customerValidation.customerId, 'params'),
  customerTagsController.getCustomerTags
);

// 14. Assign Tag to Customer
router.post('/:id/tags', 
  requireRole(['admin', 'manager', 'sales']),
  validateRequest(customerValidation.customerId, 'params'),
  validateRequest(customerValidation.assignCustomerTag, 'body'),
  customerTagsController.assignTagToCustomer
);

// 15. Remove Tag from Customer
router.delete('/:id/tags/:tagId', 
  requireRole(['admin', 'manager', 'sales']),
  validateRequest(customerValidation.tagId, 'params'),
  customerTagsController.removeTagFromCustomer
);

// Get all available tags
router.get('/tags/available', 
  customerTagsController.getAllTags
);

// Create new tag (admin only)
router.post('/tags', 
  requireRole(['admin']),
  validateRequest(customerValidation.createTag, 'body'),
  customerTagsController.createTag
);

// Update tag (admin only)
router.put('/tags/:tagId', 
  requireRole(['admin']),
  validateRequest(customerValidation.updateTag, 'body'),
  customerTagsController.updateTag
);

// Delete tag (admin only)
router.delete('/tags/:tagId', 
  requireRole(['admin']),
  customerTagsController.deleteTag
);

// ============================================================================
// CUSTOMER NOTES ROUTES
// ============================================================================

// 16. Get Customer Notes
router.get('/:id/notes', 
  validateRequest(customerValidation.customerId, 'params'),
  customerNotesController.getCustomerNotes
);

// 17. Add Customer Note
router.post('/:id/notes', 
  requireRole(['admin', 'manager', 'sales', 'driver']),
  validateRequest(customerValidation.customerId, 'params'),
  validateRequest(customerValidation.createCustomerNote, 'body'),
  customerNotesController.addCustomerNote
);

// Update Customer Note
router.put('/:id/notes/:noteId', 
  requireRole(['admin', 'manager', 'sales', 'driver']),
  validateRequest(customerValidation.noteId, 'params'),
  validateRequest(customerValidation.updateCustomerNote, 'body'),
  customerNotesController.updateCustomerNote
);

// Delete Customer Note
router.delete('/:id/notes/:noteId', 
  requireRole(['admin', 'manager']),
  validateRequest(customerValidation.noteId, 'params'),
  customerNotesController.deleteCustomerNote
);

// Get specific note
router.get('/:id/notes/:noteId', 
  validateRequest(customerValidation.noteId, 'params'),
  customerNotesController.getCustomerNoteById
);

// Mark note as completed
router.patch('/:id/notes/:noteId/complete', 
  requireRole(['admin', 'manager', 'sales', 'driver']),
  validateRequest(customerValidation.noteId, 'params'),
  customerNotesController.completeCustomerNote
);

// ============================================================================
// CUSTOMER COMMUNICATIONS ROUTES
// ============================================================================

// 18. Get Customer Communications
router.get('/:id/communications', 
  validateRequest(customerValidation.customerId, 'params'),
  customerCommunicationsController.getCustomerCommunications
);

// 19. Log Customer Communication
router.post('/:id/communications', 
  requireRole(['admin', 'manager', 'sales', 'driver']),
  validateRequest(customerValidation.customerId, 'params'),
  validateRequest(customerValidation.createCustomerCommunication, 'body'),
  customerCommunicationsController.logCustomerCommunication
);

// Update Customer Communication
router.put('/:id/communications/:communicationId', 
  requireRole(['admin', 'manager', 'sales']),
  validateRequest(customerValidation.communicationId, 'params'),
  validateRequest(customerValidation.updateCustomerCommunication, 'body'),
  customerCommunicationsController.updateCustomerCommunication
);

// Delete Customer Communication
router.delete('/:id/communications/:communicationId', 
  requireRole(['admin', 'manager']),
  validateRequest(customerValidation.communicationId, 'params'),
  customerCommunicationsController.deleteCustomerCommunication
);

// Get specific communication
router.get('/:id/communications/:communicationId', 
  validateRequest(customerValidation.communicationId, 'params'),
  customerCommunicationsController.getCustomerCommunicationById
);

// Mark communication as completed
router.patch('/:id/communications/:communicationId/complete', 
  requireRole(['admin', 'manager', 'sales', 'driver']),
  validateRequest(customerValidation.communicationId, 'params'),
  customerCommunicationsController.completeCustomerCommunication
);

// ============================================================================
// CUSTOMER PREFERENCES ROUTES
// ============================================================================

// 20. Get Customer Preferences
router.get('/:id/preferences', 
  validateRequest(customerValidation.customerId, 'params'),
  customerPreferencesController.getCustomerPreferences
);

// 21. Update Customer Preferences
router.put('/:id/preferences', 
  requireRole(['admin', 'manager', 'sales']),
  validateRequest(customerValidation.customerId, 'params'),
  customerPreferencesController.updateCustomerPreferences
);

// Create single preference
router.post('/:id/preferences', 
  requireRole(['admin', 'manager', 'sales']),
  validateRequest(customerValidation.customerId, 'params'),
  validateRequest(customerValidation.createCustomerPreference, 'body'),
  customerPreferencesController.createCustomerPreference
);

// Update single preference
router.put('/:id/preferences/:preferenceId', 
  requireRole(['admin', 'manager', 'sales']),
  validateRequest(customerValidation.preferenceId, 'params'),
  validateRequest(customerValidation.updateCustomerPreference, 'body'),
  customerPreferencesController.updateCustomerPreference
);

// Delete single preference
router.delete('/:id/preferences/:preferenceId', 
  requireRole(['admin', 'manager']),
  validateRequest(customerValidation.preferenceId, 'params'),
  customerPreferencesController.deleteCustomerPreference
);

// Get specific preference
router.get('/:id/preferences/:preferenceId', 
  validateRequest(customerValidation.preferenceId, 'params'),
  customerPreferencesController.getCustomerPreferenceById
);

// ============================================================================
// CUSTOMER SERVICE HISTORY ROUTES
// ============================================================================

// 22. Get Customer Service History
router.get('/:id/service-history', 
  validateRequest(customerValidation.customerId, 'params'),
  customerServiceHistoryController.getCustomerServiceHistory
);

// Create service history entry
router.post('/:id/service-history', 
  requireRole(['admin', 'manager', 'sales', 'driver']),
  validateRequest(customerValidation.customerId, 'params'),
  validateRequest(customerValidation.createCustomerServiceHistory, 'body'),
  customerServiceHistoryController.createCustomerServiceHistory
);

// Update service history entry
router.put('/:id/service-history/:serviceHistoryId', 
  requireRole(['admin', 'manager', 'sales']),
  validateRequest(customerValidation.serviceHistoryId, 'params'),
  validateRequest(customerValidation.updateCustomerServiceHistory, 'body'),
  customerServiceHistoryController.updateCustomerServiceHistory
);

// Delete service history entry
router.delete('/:id/service-history/:serviceHistoryId', 
  requireRole(['admin', 'manager']),
  validateRequest(customerValidation.serviceHistoryId, 'params'),
  customerServiceHistoryController.deleteCustomerServiceHistory
);

// Get specific service history entry
router.get('/:id/service-history/:serviceHistoryId', 
  validateRequest(customerValidation.serviceHistoryId, 'params'),
  customerServiceHistoryController.getCustomerServiceHistoryById
);

// ============================================================================
// CUSTOMER REPORTS ROUTES
// ============================================================================

// 23. Get Customer Summary Report
router.get('/reports/summary', 
  requireRole(['admin', 'manager']),
  validateRequest(customerValidation.customerReport, 'query'),
  customerReportsController.getCustomerSummaryReport
);

// Get customer analytics
router.get('/reports/analytics', 
  requireRole(['admin', 'manager']),
  customerReportsController.getCustomerAnalytics
);

// Export customers
router.get('/reports/export', 
  requireRole(['admin', 'manager']),
  customerReportsController.exportCustomers
);

// Get customer insights
router.get('/reports/insights', 
  requireRole(['admin', 'manager']),
  customerReportsController.getCustomerInsights
);

module.exports = router;
