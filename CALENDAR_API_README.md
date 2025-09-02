# Calendar API Documentation

This document outlines the complete REST API endpoints for the Calendar functionality in your junk removal management system.

## 🚀 Quick Start

### 1. Run Database Migration
First, create the calendar database tables:

```bash
node scripts/calendar-migration.js
```

### 2. Start Your Server
```bash
npm start
# or
node server.js
```

### 3. Test the API
The calendar API is now available at: `http://localhost:3000/api/v1/calendar`

## 📅 Available Endpoints

### Calendar Events

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/api/v1/calendar/events` | Get all calendar events | ✅ | Any authenticated user |
| GET | `/api/v1/calendar/events/:id` | Get specific event | ✅ | Any authenticated user |
| POST | `/api/v1/calendar/events` | Create new event | ✅ | Admin, Manager, Dispatcher |
| PUT | `/api/v1/calendar/events/:id` | Update event | ✅ | Admin, Manager, Dispatcher |
| DELETE | `/api/v1/calendar/events/:id` | Delete event | ✅ | Admin, Manager |

### Calendar Views

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/api/v1/calendar/view` | Get calendar view (day/week/month/agenda) | ✅ | Any authenticated user |

### Recurring Events

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/api/v1/calendar/events/recurring` | Create recurring event | ✅ | Admin, Manager, Dispatcher |
| PUT | `/api/v1/calendar/events/:id/recurring` | Update recurring pattern | ✅ | Admin, Manager, Dispatcher |

### Event Categories

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/api/v1/calendar/categories` | Get all categories | ✅ | Any authenticated user |
| POST | `/api/v1/calendar/categories` | Create new category | ✅ | Admin, Manager |

### Event Attendees

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/api/v1/calendar/events/:id/attendees` | Add attendee | ✅ | Admin, Manager, Dispatcher |
| PUT | `/api/v1/calendar/events/:id/attendees/:attendeeId` | Update attendee response | ✅ | Admin, Manager, Dispatcher |

### Event Reminders

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| POST | `/api/v1/calendar/events/:id/reminders` | Set reminder | ✅ | Admin, Manager, Dispatcher |
| GET | `/api/v1/calendar/events/:id/reminders` | Get event reminders | ✅ | Any authenticated user |

### Availability & Working Hours

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/api/v1/calendar/availability/crew` | Check crew availability | ✅ | Any authenticated user |
| GET | `/api/v1/calendar/working-hours` | Get working hours | ✅ | Any authenticated user |

### Holidays

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/api/v1/calendar/holidays` | Get calendar holidays | ✅ | Any authenticated user |
| POST | `/api/v1/calendar/holidays` | Add company holiday | ✅ | Admin, Manager |

### Reports

| Method | Endpoint | Description | Auth Required | Role Required |
|--------|----------|-------------|---------------|---------------|
| GET | `/api/v1/calendar/reports/summary` | Get calendar summary report | ✅ | Admin, Manager |

## 🔐 Authentication

All endpoints require a valid JWT token in the Authorization header:

```bash
Authorization: Bearer <your_jwt_token>
```

## 📝 Example Usage

### 1. Get All Calendar Events

```bash
curl -X GET "http://localhost:3000/api/v1/calendar/events?date_from=2024-01-01&date_to=2024-01-31&event_type=job" \
  -H "Authorization: Bearer your_jwt_token"
```

### 2. Create a New Calendar Event

```bash
curl -X POST "http://localhost:3000/api/v1/calendar/events" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Office Cleanout - Downtown Complex",
    "description": "Complete office cleanout including furniture and electronics",
    "event_type": "job",
    "start_date": "2024-01-16",
    "start_time": "09:00:00",
    "end_date": "2024-01-16",
    "end_time": "17:00:00",
    "location": "321 Commerce St, Wilmington, NC",
    "customer_id": "customer-uuid-here",
    "crew_id": "crew-uuid-here",
    "priority": "medium",
    "color": "#3B82F6"
  }'
```

### 3. Get Calendar Week View

```bash
curl -X GET "http://localhost:3000/api/v1/calendar/view?view=week&date=2024-01-15" \
  -H "Authorization: Bearer your_jwt_token"
```

### 4. Check Crew Availability

```bash
curl -X GET "http://localhost:3000/api/v1/calendar/availability/crew?crew_id=crew-uuid&date=2024-01-16&start_time=09:00&end_time=17:00" \
  -H "Authorization: Bearer your_jwt_token"
```

### 5. Create Event Category

```bash
curl -X POST "http://localhost:3000/api/v1/calendar/categories" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emergency Cleanup",
    "description": "Urgent and emergency cleanup jobs",
    "color": "#EF4444",
    "icon": "alert-triangle"
  }'
```

## 🗄️ Database Schema

The calendar system uses the following main tables:

- **calendar_events** - Main events table
- **calendar_recurring_patterns** - Recurring event patterns
- **calendar_attendees** - Event attendees
- **calendar_reminders** - Event reminders
- **calendar_categories** - Event categories
- **calendar_working_hours** - Working hours configuration
- **calendar_holidays** - Company holidays
- **calendar_availability** - Resource availability tracking

## 🔧 Configuration

### Working Hours
Default working hours are set to:
- **Monday-Friday**: 8:00 AM - 5:00 PM
- **Saturday**: 9:00 AM - 3:00 PM
- **Sunday**: Closed

### Event Types
Supported event types:
- `job` - Junk removal jobs
- `meeting` - Team meetings
- `maintenance` - Equipment maintenance
- `training` - Employee training
- `other` - Miscellaneous events

### Priority Levels
- `low` - Low priority
- `medium` - Medium priority (default)
- `high` - High priority
- `urgent` - Urgent priority

## 📊 Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## ❌ Error Handling

Error responses include:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Common error codes:
- `EVENT_NOT_FOUND` - Event with specified ID not found
- `INVALID_DATE_RANGE` - Invalid date range for event
- `CREW_NOT_AVAILABLE` - Specified crew is not available
- `DUPLICATE_EVENT` - Event already exists for this time slot
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions

## 🧪 Testing

### Test with Postman
1. Import the calendar endpoints into Postman
2. Set the Authorization header with your JWT token
3. Test each endpoint with sample data

### Test with cURL
Use the examples above to test with cURL commands

### Test in Browser
For GET requests, you can test directly in the browser (with proper authentication)

## 🚨 Rate Limiting

API endpoints are rate-limited:
- **General endpoints**: 100 requests per minute per IP
- **Calendar view endpoints**: 200 requests per minute per IP
- **Availability checking**: 50 requests per minute per IP

## 🔗 Integration

The calendar system integrates with:
- **Jobs system** - Link events to existing jobs
- **Employee management** - Assign events to employees/crews
- **Customer management** - Associate events with customers
- **Notification system** - Send reminders and updates

## 📱 Frontend Integration

To integrate with your frontend:

1. **Calendar Component**: Use the `/view` endpoint to display calendar views
2. **Event Management**: Use CRUD endpoints for event management
3. **Real-time Updates**: Implement webhook support for live updates
4. **Drag & Drop**: Use the update endpoints for drag-and-drop functionality

## 🆘 Support

If you encounter issues:

1. Check the server logs for error details
2. Verify your JWT token is valid
3. Ensure you have the required role permissions
4. Check that the database tables were created successfully

## 🔄 Updates

The calendar API is designed to be extensible. Future enhancements may include:
- Google Calendar integration
- Outlook Calendar sync
- Mobile push notifications
- Advanced recurring patterns
- Resource conflict resolution

---

**Happy Scheduling! 🎉**
