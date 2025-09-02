const express = require('express');
const router = express.Router();

// Import controllers
const leadController = require('../controllers/leadController');
const leadContactsController = require('../controllers/leadContactsController');
const leadActivitiesController = require('../controllers/leadActivitiesController');
const leadNotesController = require('../controllers/leadNotesController');
const leadQualificationController = require('../controllers/leadQualificationController');
const leadFollowUpsController = require('../controllers/leadFollowUpsController');
const leadTagsController = require('../controllers/leadTagsController');
const leadReportsController = require('../controllers/leadReportsController');

// Import middleware
const { auth, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { 
  createLead, updateLead, getLeads, searchLeads,
  createLeadContact, updateLeadContact,
  createLeadActivity, updateLeadActivity,
  createLeadNote, updateLeadNote,
  updateLeadQualification,
  createLeadFollowUp, updateLeadFollowUp,
  createTag, updateTag, assignTag,
  leadReport, leadPerformanceReport
} = require('../validations/leadValidation');

// Health check route (no authentication required)
router.get('/health', leadController.healthCheck);

// Core lead routes
router.get('/', auth, leadController.getAllLeads);
router.get('/search', auth, leadController.searchLeads);
router.get('/:id', auth, leadController.getLeadById);
router.post('/', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(createLead), leadController.createLead);
router.put('/:id', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(updateLead), leadController.updateLead);
router.delete('/:id', auth, requireRole(['admin', 'manager']), leadController.deleteLead);

// Lead conversion
router.post('/:id/convert', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(leadConversion), leadController.convertLead);

// Lead contacts routes
router.get('/:id/contacts', auth, leadContactsController.getLeadContacts);
router.post('/:id/contacts', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(createLeadContact), leadContactsController.addLeadContact);
router.get('/:id/contacts/:contactId', auth, leadContactsController.getLeadContactById);
router.put('/:id/contacts/:contactId', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(updateLeadContact), leadContactsController.updateLeadContact);
router.delete('/:id/contacts/:contactId', auth, requireRole(['admin', 'manager']), leadContactsController.deleteLeadContact);

// Lead activities routes
router.get('/:id/activities', auth, leadActivitiesController.getLeadActivities);
router.post('/:id/activities', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(createLeadActivity), leadActivitiesController.addLeadActivity);
router.get('/:id/activities/:activityId', auth, leadActivitiesController.getLeadActivityById);
router.put('/:id/activities/:activityId', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(updateLeadActivity), leadActivitiesController.updateLeadActivity);
router.delete('/:id/activities/:activityId', auth, requireRole(['admin', 'manager']), leadActivitiesController.deleteLeadActivity);
router.put('/:id/activities/:activityId/complete', auth, requireRole(['admin', 'manager', 'sales']), leadActivitiesController.completeLeadActivity);

// Lead notes routes
router.get('/:id/notes', auth, leadNotesController.getLeadNotes);
router.post('/:id/notes', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(createLeadNote), leadNotesController.addLeadNote);
router.get('/:id/notes/:noteId', auth, leadNotesController.getLeadNoteById);
router.put('/:id/notes/:noteId', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(updateLeadNote), leadNotesController.updateLeadNote);
router.delete('/:id/notes/:noteId', auth, requireRole(['admin', 'manager']), leadNotesController.deleteLeadNote);
router.put('/:id/notes/:noteId/complete', auth, requireRole(['admin', 'manager', 'sales']), leadNotesController.completeLeadNote);

// Lead qualification routes
router.get('/:id/qualification', auth, leadQualificationController.getLeadQualification);
router.put('/:id/qualification', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(updateLeadQualification), leadQualificationController.updateLeadQualification);

// Lead follow-ups routes
router.get('/:id/follow-ups', auth, leadFollowUpsController.getLeadFollowUps);
router.post('/:id/follow-ups', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(createLeadFollowUp), leadFollowUpsController.scheduleLeadFollowUp);
router.get('/:id/follow-ups/:followupId', auth, leadFollowUpsController.getLeadFollowUpById);
router.put('/:id/follow-ups/:followupId', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(updateLeadFollowUp), leadFollowUpsController.updateLeadFollowUp);
router.put('/:id/follow-ups/:followupId/complete', auth, requireRole(['admin', 'manager', 'sales']), leadFollowUpsController.completeLeadFollowUp);
router.delete('/:id/follow-ups/:followupId', auth, requireRole(['admin', 'manager']), leadFollowUpsController.deleteLeadFollowUp);

// Lead tags routes
router.get('/:id/tags', auth, leadTagsController.getLeadTags);
router.post('/:id/tags', auth, requireRole(['admin', 'manager', 'sales']), validateRequest(assignTag), leadTagsController.assignTagToLead);
router.delete('/:id/tags/:tagId', auth, requireRole(['admin', 'manager']), leadTagsController.removeTagFromLead);

// Tag management routes
router.get('/tags', auth, leadTagsController.getAllTags);
router.post('/tags', auth, requireRole(['admin', 'manager']), validateRequest(createTag), leadTagsController.createTag);
router.put('/tags/:tagId', auth, requireRole(['admin', 'manager']), validateRequest(updateTag), leadTagsController.updateTag);
router.delete('/tags/:tagId', auth, requireRole(['admin', 'manager']), leadTagsController.deleteTag);

// Lead reports routes
router.get('/reports/summary', auth, requireRole(['admin', 'manager']), validateRequest(leadReport), leadReportsController.getLeadSummaryReport);
router.get('/reports/performance', auth, requireRole(['admin', 'manager']), validateRequest(leadPerformanceReport), leadReportsController.getLeadPerformanceReport);
router.get('/reports/insights', auth, requireRole(['admin', 'manager']), leadReportsController.getLeadInsights);

module.exports = router;
