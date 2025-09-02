const Joi = require('joi');

// Query validation for getting calendar events
const getEventsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
  date_from: Joi.date().iso(),
  date_to: Joi.date().iso().min(Joi.ref('date_from')),
  event_type: Joi.string().valid('job', 'meeting', 'maintenance', 'training', 'other'),
  customer_id: Joi.string().uuid(),
  crew_id: Joi.string().uuid(),
  status: Joi.string().valid('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled'),
  view: Joi.string().valid('day', 'week', 'month', 'agenda'),
  include_recurring: Joi.boolean().default(true)
});

// Query validation for calendar view
const getCalendarViewSchema = Joi.object({
  view: Joi.string().valid('day', 'week', 'month', 'agenda').required(),
  date: Joi.date().iso().default(() => new Date().toISOString().split('T')[0]),
  customer_id: Joi.string().uuid(),
  crew_id: Joi.string().uuid(),
  event_type: Joi.string().valid('job', 'meeting', 'maintenance', 'training', 'other')
});

// Validation for creating calendar events
const createEventSchema = Joi.object({
  title: Joi.string().max(255).required(),
  description: Joi.string().max(1000),
  event_type: Joi.string().valid('job', 'meeting', 'maintenance', 'training', 'other').default('job'),
  start_date: Joi.date().iso().required(),
  start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')),
  end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  is_all_day: Joi.boolean().default(false),
  location: Joi.string().max(500),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  customer_id: Joi.string().uuid(),
  crew_id: Joi.string().uuid(),
  related_job_id: Joi.string().uuid(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  categories: Joi.array().items(Joi.string().uuid()),
  attendees: Joi.array().items(Joi.string().uuid()),
  reminders: Joi.array().items(Joi.object({
    type: Joi.string().valid('email', 'sms', 'push', 'popup').required(),
    minutes_before: Joi.number().integer().min(1).required(),
    message: Joi.string().max(500)
  })),
  notes: Joi.string().max(1000)
});

// Validation for updating calendar events
const updateEventSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().max(1000),
  event_type: Joi.string().valid('job', 'meeting', 'maintenance', 'training', 'other'),
  start_date: Joi.date().iso(),
  start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  end_date: Joi.date().iso(),
  end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  is_all_day: Joi.boolean(),
  location: Joi.string().max(500),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/),
  customer_id: Joi.string().uuid(),
  crew_id: Joi.string().uuid(),
  related_job_id: Joi.string().uuid(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  status: Joi.string().valid('scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rescheduled'),
  notes: Joi.string().max(1000)
});

// Validation for creating recurring events
const createRecurringEventSchema = Joi.object({
  title: Joi.string().max(255).required(),
  description: Joi.string().max(1000),
  event_type: Joi.string().valid('job', 'meeting', 'maintenance', 'training', 'other').default('job'),
  start_date: Joi.date().iso().required(),
  start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
  end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  location: Joi.string().max(500),
  crew_id: Joi.string().uuid(),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).default('#3B82F6'),
  recurring_pattern: Joi.object({
    frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').required(),
    interval: Joi.number().integer().min(1).default(1),
    end_date: Joi.date().iso(),
    weekdays: Joi.array().items(Joi.number().integer().min(0).max(6)),
    month_day: Joi.number().integer().min(1).max(31),
    month_week: Joi.number().integer().min(1).max(5),
    month_weekday: Joi.number().integer().min(0).max(6),
    year_month: Joi.number().integer().min(1).max(12),
    year_day: Joi.number().integer().min(1).max(366),
    end_after_occurrences: Joi.number().integer().min(1),
    exceptions: Joi.array().items(Joi.date().iso())
  }).required()
});

// Validation for updating recurring patterns
const updateRecurringPatternSchema = Joi.object({
  recurring_pattern: Joi.object({
    frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly'),
    interval: Joi.number().integer().min(1),
    end_date: Joi.date().iso(),
    weekdays: Joi.array().items(Joi.number().integer().min(0).max(6)),
    month_day: Joi.number().integer().min(1).max(31),
    month_week: Joi.number().integer().min(1).max(5),
    month_weekday: Joi.number().integer().min(0).max(6),
    year_month: Joi.number().integer().min(1).max(12),
    year_day: Joi.number().integer().min(1).max(366),
    end_after_occurrences: Joi.number().integer().min(1),
    exceptions: Joi.array().items(Joi.date().iso())
  }).required()
});

// Validation for creating event categories
const createCategorySchema = Joi.object({
  name: Joi.string().max(100).required(),
  color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).required(),
  icon: Joi.string().max(50),
  description: Joi.string().max(500),
  sort_order: Joi.number().integer().min(0).default(0)
});

// Validation for adding event attendees
const addAttendeeSchema = Joi.object({
  attendee_type: Joi.string().valid('employee', 'customer', 'vendor', 'other').required(),
  attendee_id: Joi.string().uuid().required(),
  attendee_name: Joi.string().max(255).required(),
  attendee_email: Joi.string().email().max(255),
  attendee_phone: Joi.string().max(20),
  notes: Joi.string().max(500)
});

// Validation for updating attendee responses
const updateAttendeeResponseSchema = Joi.object({
  response_status: Joi.string().valid('pending', 'accepted', 'declined', 'tentative').required(),
  notes: Joi.string().max(500)
});

// Validation for setting event reminders
const setReminderSchema = Joi.object({
  reminder_type: Joi.string().valid('email', 'sms', 'push', 'popup').required(),
  minutes_before: Joi.number().integer().min(1).required(),
  message: Joi.string().max(500),
  recipient_id: Joi.string().uuid(),
  recipient_type: Joi.string().valid('employee', 'customer', 'all').default('all')
});

// Validation for adding company holidays
const addHolidaySchema = Joi.object({
  name: Joi.string().max(255).required(),
  date: Joi.date().iso().required(),
  description: Joi.string().max(500),
  is_paid_holiday: Joi.boolean().default(true)
});

// Validation for checking crew availability
const checkAvailabilitySchema = Joi.object({
  crew_id: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
  end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required(),
  exclude_event_id: Joi.string().uuid()
});

module.exports = {
  getEventsQuerySchema,
  getCalendarViewSchema,
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
};
