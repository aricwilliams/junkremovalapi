const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const {
  createEventSchema,
  updateEventSchema,
  createRecurringEventSchema,
  updateRecurringPatternSchema,
  createCategorySchema,
  addAttendeeSchema,
  updateAttendeeResponseSchema,
  setReminderSchema,
  addHolidaySchema,
  checkAvailabilitySchema
} = require('../validations/calendarValidation');

const {
  getCalendarEvents,
  getEventById,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarView,
  createRecurringEvent,
  updateRecurringPattern,
  getEventCategories,
  createEventCategory,
  addEventAttendee,
  updateAttendeeResponse,
  setEventReminder,
  getEventReminders,
  checkCrewAvailability,
  getWorkingHours,
  getCalendarHolidays,
  addCompanyHoliday,
  getCalendarSummaryReport
} = require('../controllers/calendarController');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Calendar Events Endpoints
router.get('/events', validateRequest(getEventsQuerySchema, 'query'), getCalendarEvents);
router.get('/events/:id', getEventById);
router.post('/events', requireRole(['admin', 'manager', 'dispatcher']), validateRequest(createEventSchema), createCalendarEvent);
router.put('/events/:id', requireRole(['admin', 'manager', 'dispatcher']), validateRequest(updateEventSchema), updateCalendarEvent);
router.delete('/events/:id', requireRole(['admin', 'manager']), deleteCalendarEvent);

// Calendar View Endpoints
router.get('/view', validateRequest(getCalendarViewSchema, 'query'), getCalendarView);

// Recurring Events Endpoints
router.post('/events/recurring', requireRole(['admin', 'manager', 'dispatcher']), validateRequest(createRecurringEventSchema), createRecurringEvent);
router.put('/events/:id/recurring', requireRole(['admin', 'manager', 'dispatcher']), validateRequest(updateRecurringPatternSchema), updateRecurringPattern);

// Event Categories Endpoints
router.get('/categories', getEventCategories);
router.post('/categories', requireRole(['admin', 'manager']), validateRequest(createCategorySchema), createEventCategory);

// Event Attendees Endpoints
router.post('/events/:id/attendees', requireRole(['admin', 'manager', 'dispatcher']), validateRequest(addAttendeeSchema), addEventAttendee);
router.put('/events/:id/attendees/:attendeeId', requireRole(['admin', 'manager', 'dispatcher']), validateRequest(updateAttendeeResponseSchema), updateAttendeeResponse);

// Event Reminders Endpoints
router.post('/events/:id/reminders', requireRole(['admin', 'manager', 'dispatcher']), validateRequest(setReminderSchema), setEventReminder);
router.get('/events/:id/reminders', getEventReminders);

// Calendar Availability Endpoints
router.get('/availability/crew', validateRequest(checkAvailabilitySchema, 'query'), checkCrewAvailability);
router.get('/working-hours', getWorkingHours);

// Calendar Holidays Endpoints
router.get('/holidays', getCalendarHolidays);
router.post('/holidays', requireRole(['admin', 'manager']), validateRequest(addHolidaySchema), addCompanyHoliday);

// Calendar Reports Endpoints
router.get('/reports/summary', requireRole(['admin', 'manager']), getCalendarSummaryReport);

module.exports = router;
