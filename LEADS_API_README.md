# Leads API Documentation

This document outlines the complete REST API endpoints for the Leads tab functionality in your junk removal management system. Built with Node.js, Express, and MySQL.

## 🚀 Quick Start

### 1. Run Database Migration
```bash
# Create all lead-related tables
node scripts/leads-migration.js
```

### 2. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 3. Test the API
```bash
# Health check
curl http://localhost:3000/api/v1/leads/health

# Get all leads (requires JWT token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/v1/leads
```

## 📋 Table of Contents

- [Base Configuration](#base-configuration)
- [Core Lead Endpoints](#core-lead-endpoints)
- [Lead Contacts Endpoints](#lead-contacts-endpoints)
- [Lead Activities Endpoints](#lead-activities-endpoints)
- [Lead Notes Endpoints](#lead-notes-endpoints)
- [Lead Qualification Endpoints](#lead-qualification-endpoints)
- [Lead Follow-ups Endpoints](#lead-follow-ups-endpoints)
- [Lead Tags Endpoints](#lead-tags-endpoints)
- [Lead Reports Endpoints](#lead-reports-endpoints)
- [Lead Conversion Endpoints](#lead-conversion-endpoints)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Testing](#testing)

## 🔧 Base Configuration

### Base URL
```
http://localhost:3000/api/v1/leads
```

### Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Response Format
All API responses follow this standard format:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🎯 Core Lead Endpoints

### 1. Get All Leads
**GET** `/leads`

Retrieve all leads with optional filtering, sorting, and pagination.

**Query Parameters:**
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Number of items per page (default: 20, max: 100)
- `search` (string): Search term for lead name, company, email, or phone
- `status` (string): Filter by lead status
- `source` (string): Filter by lead source
- `priority` (string): Filter by priority
- `assigned_to` (string): Filter by assigned employee
- `date_from` (date): Filter leads from this date
- `date_to` (date): Filter leads to this date
- `sort_by` (string): Sort field (default: 'created_at')
- `sort_order` (string): Sort order - 'asc' or 'desc' (default: 'desc')

**Example Response:**
```json
{
  "success": true,
  "message": "Leads retrieved successfully",
  "data": {
    "leads": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    },
    "summary": {
      "total_leads": 45,
      "new_leads": 15,
      "qualified_leads": 20,
      "converted_leads": 8,
      "total_potential_value": 125000.00
    }
  }
}
```

### 2. Get Lead by ID
**GET** `/leads/:id`

Retrieve a specific lead by ID with all related information.

**Example Response:**
```json
{
  "success": true,
  "message": "Lead retrieved successfully",
  "data": {
    "lead": {
      "id": "lead-1",
      "name": "Coastal Retail Center",
      "company": "Coastal Retail Group",
      "email": "manager@coastalretail.com",
      "phone": "555-0300",
      "status": "new",
      "source": "website",
      "priority": "high",
      "estimated_value": 2500.00,
      "contacts": [...],
      "activities": [...],
      "notes": [...],
      "tags": [...],
      "qualification": {...}
    }
  }
}
```

### 3. Create New Lead
**POST** `/leads`

Create a new lead with all required information.

**Required Fields:**
- `name` (string): Lead name
- `email` (string): Lead email
- `phone` (string): Lead phone
- `address` (string): Lead address
- `city` (string): Lead city
- `state` (string): Lead state (2 characters)
- `zip_code` (string): Lead zip code

**Optional Fields:**
- `company` (string): Company name
- `mobile` (string): Mobile phone
- `status` (string): Lead status (default: 'new')
- `source` (string): Lead source (default: 'other')
- `estimated_value` (number): Estimated project value
- `service_type` (string): Type of service needed
- `priority` (string): Priority level (default: 'medium')
- `assigned_to` (string): Employee ID to assign lead to
- `contacts` (array): Array of contact information
- `tags` (array): Array of tag IDs

**Example Request:**
```json
{
  "name": "Downtown Office Building",
  "company": "Downtown Properties LLC",
  "email": "contact@downtownproperties.com",
  "phone": "555-0400",
  "address": "123 Main St",
  "city": "Wilmington",
  "state": "NC",
  "zip_code": "28401",
  "estimated_value": 3500.00,
  "service_type": "Office Cleanout",
  "priority": "medium",
  "source": "referral"
}
```

### 4. Update Lead
**PUT** `/leads/:id`

Update an existing lead by ID.

**Example Request:**
```json
{
  "status": "qualified",
  "priority": "high",
  "estimated_value": 4000.00
}
```

### 5. Delete Lead
**DELETE** `/leads/:id`

Delete a lead by ID (soft delete - sets status to 'deleted').

### 6. Search Leads
**GET** `/leads/search`

Advanced lead search with multiple criteria.

**Query Parameters:**
- `q` (string): Search query (required)
- `search_fields` (string): Comma-separated fields to search
- `status` (string): Filter by lead status
- `source` (string): Filter by lead source
- `priority` (string): Filter by priority
- `min_estimated_value` (number): Minimum estimated value
- `max_estimated_value` (number): Maximum estimated value

## 👥 Lead Contacts Endpoints

### Get Lead Contacts
**GET** `/leads/:id/contacts`

Get all contacts for a specific lead.

### Add Lead Contact
**POST** `/leads/:id/contacts`

Add a new contact to a lead.

**Required Fields:**
- `first_name` (string): Contact first name
- `last_name` (string): Contact last name

**Optional Fields:**
- `contact_type` (string): Type of contact
- `title` (string): Job title
- `email` (string): Contact email
- `phone` (string): Contact phone
- `mobile` (string): Contact mobile
- `relationship` (string): Relationship to lead
- `is_primary_contact` (boolean): Whether this is the primary contact
- `can_make_decisions` (boolean): Whether contact can make decisions
- `preferred_contact_method` (string): Preferred contact method

### Update Lead Contact
**PUT** `/leads/:id/contacts/:contactId`

Update an existing contact.

### Delete Lead Contact
**DELETE** `/leads/:id/contacts/:contactId`

Delete a contact from a lead.

### Get Lead Contact by ID
**GET** `/leads/:id/contacts/:contactId`

Get a specific contact by ID.

## 📞 Lead Activities Endpoints

### Get Lead Activities
**GET** `/leads/:id/activities`

Get all activities for a specific lead.

**Query Parameters:**
- `activity_type` (string): Filter by activity type
- `date_from` (date): Filter activities from this date
- `date_to` (date): Filter activities to this date

### Add Lead Activity
**POST** `/leads/:id/activities`

Add a new activity to a lead.

**Required Fields:**
- `type` (string): Activity type
- `description` (string): Activity description

**Optional Fields:**
- `subject` (string): Activity subject
- `activity_date` (date): Activity date
- `duration_minutes` (number): Duration in minutes
- `outcome` (string): Activity outcome
- `next_action` (string): Next action required
- `next_action_date` (date): Next action date
- `scheduled_follow_up` (date): Scheduled follow-up date
- `notes` (string): Additional notes

### Update Lead Activity
**PUT** `/leads/:id/activities/:activityId`

Update an existing activity.

### Complete Lead Activity
**PUT** `/leads/:id/activities/:activityId/complete`

Mark an activity as completed.

**Request Body:**
```json
{
  "outcome": "positive",
  "notes": "Customer was very interested"
}
```

### Delete Lead Activity
**DELETE** `/leads/:id/activities/:activityId`

Delete an activity.

### Get Lead Activity by ID
**GET** `/leads/:id/activities/:activityId`

Get a specific activity by ID.

## 📝 Lead Notes Endpoints

### Get Lead Notes
**GET** `/leads/:id/notes`

Get all notes for a specific lead.

**Query Parameters:**
- `note_type` (string): Filter by note type
- `created_by` (string): Filter by user who created the note
- `date_from` (date): Filter notes from this date
- `date_to` (date): Filter notes to this date

### Add Lead Note
**POST** `/leads/:id/notes`

Add a new note to a lead.

**Required Fields:**
- `title` (string): Note title
- `content` (string): Note content

**Optional Fields:**
- `type` (string): Note type (default: 'general')
- `is_internal` (boolean): Whether note is internal only
- `is_important` (boolean): Whether note is important
- `priority` (string): Note priority
- `due_date` (date): Due date for note

### Update Lead Note
**PUT** `/leads/:id/notes/:noteId`

Update an existing note.

### Complete Lead Note
**PUT** `/leads/:id/notes/:noteId/complete`

Mark a note as completed.

### Delete Lead Note
**DELETE** `/leads/:id/notes/:noteId`

Delete a note.

### Get Lead Note by ID
**GET** `/leads/:id/notes/:noteId`

Get a specific note by ID.

## 🎯 Lead Qualification Endpoints

### Get Lead Qualification
**GET** `/leads/:id/qualification`

Get lead qualification details and scoring.

### Update Lead Qualification
**PUT** `/leads/:id/qualification`

Update lead qualification status and scoring.

**Request Body:**
```json
{
  "is_qualified": true,
  "qualification_score": 85,
  "qualification_notes": "Customer has budget, clear timeline, and decision-making authority",
  "qualification_criteria": {
    "budget": "qualified",
    "timeline": "qualified",
    "authority": "qualified",
    "need": "qualified"
  }
}
```

## 📅 Lead Follow-ups Endpoints

### Get Lead Follow-ups
**GET** `/leads/:id/follow-ups`

Get all follow-up activities for a specific lead.

**Query Parameters:**
- `status` (string): Filter by follow-up status
- `date_from` (date): Filter follow-ups from this date
- `date_to` (date): Filter follow-ups to this date

### Schedule Lead Follow-up
**POST** `/leads/:id/follow-ups`

Schedule a new follow-up for a lead.

**Required Fields:**
- `type` (string): Follow-up type
- `subject` (string): Follow-up subject
- `scheduled_date` (date): Scheduled date

**Optional Fields:**
- `description` (string): Follow-up description
- `scheduled_time` (string): Scheduled time (HH:MM format)
- `priority` (string): Priority level
- `assigned_to` (string): Employee ID to assign to
- `notes` (string): Additional notes

### Update Lead Follow-up
**PUT** `/leads/:id/follow-ups/:followupId`

Update an existing follow-up.

### Complete Lead Follow-up
**PUT** `/leads/:id/follow-ups/:followupId/complete`

Mark a follow-up as completed.

**Request Body:**
```json
{
  "status": "completed",
  "completion_notes": "Site visit completed successfully",
  "outcome": "positive",
  "next_action": "Prepare detailed proposal"
}
```

### Delete Lead Follow-up
**DELETE** `/leads/:id/follow-ups/:followupId`

Delete a follow-up.

### Get Lead Follow-up by ID
**GET** `/leads/:id/follow-ups/:followupId`

Get a specific follow-up by ID.

## 🏷️ Lead Tags Endpoints

### Get Lead Tags
**GET** `/leads/:id/tags`

Get all tags assigned to a specific lead.

### Assign Tag to Lead
**POST** `/leads/:id/tags`

Assign a tag to a lead.

**Request Body:**
```json
{
  "tag_id": "tag-uuid-here"
}
```

### Remove Tag from Lead
**DELETE** `/leads/:id/tags/:tagId`

Remove a tag from a lead.

### Get All Tags
**GET** `/leads/tags`

Get all available lead tags.

### Create Tag
**POST** `/leads/tags`

Create a new lead tag.

**Required Fields:**
- `name` (string): Tag name

**Optional Fields:**
- `color` (string): Hex color code (default: '#3B82F6')
- `description` (string): Tag description
- `is_active` (boolean): Whether tag is active

### Update Tag
**PUT** `/leads/tags/:tagId`

Update an existing tag.

### Delete Tag
**DELETE** `/leads/tags/:tagId`

Delete a tag (only if not assigned to any leads).

## 📊 Lead Reports Endpoints

### Get Lead Summary Report
**GET** `/leads/reports/summary`

Get a summary report of all leads with analytics.

**Query Parameters:**
- `date_from` (date): Start date for report
- `date_to` (date): End date for report
- `status` (string): Filter by lead status
- `source` (string): Filter by lead source
- `assigned_to` (string): Filter by assigned employee
- `format` (string): 'json' or 'pdf'

### Get Lead Performance Report
**GET** `/leads/reports/performance`

Get detailed performance metrics for leads and sales team.

**Query Parameters:**
- `date_from` (date): Start date for report
- `date_to` (date): End date for report
- `employee_id` (string): Filter by specific employee
- `source` (string): Filter by lead source

### Get Lead Insights
**GET** `/leads/reports/insights`

Get lead insights and recommendations.

**Query Parameters:**
- `date_from` (date): Start date for insights
- `date_to` (date): End date for insights

## 🔄 Lead Conversion Endpoints

### Convert Lead to Customer
**POST** `/leads/:id/convert`

Convert a qualified lead to a customer.

**Required Fields:**
- `customer_name` (string): Customer name
- `customer_type` (string): Customer type ('residential' or 'commercial')
- `first_job_details` (object): Details of the first job

**Example Request:**
```json
{
  "customer_name": "Downtown Properties LLC",
  "customer_type": "commercial",
  "first_job_details": {
    "service_type": "Office Cleanout",
    "estimated_value": 4000.00,
    "preferred_date": "2024-02-01",
    "notes": "Converted from lead - urgent timeline"
  },
  "billing_info": {
    "billing_address": "123 Main St, Wilmington, NC 28401",
    "payment_terms": "Net 30"
  }
}
```

## ❌ Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

### Application Error Codes
- `LEAD_NOT_FOUND` - Lead with specified ID not found
- `DUPLICATE_LEAD` - Lead with same email/phone already exists
- `INVALID_LEAD_STATUS` - Invalid lead status specified
- `INVALID_LEAD_SOURCE` - Invalid lead source specified
- `CONTACT_NOT_FOUND` - Contact with specified ID not found
- `ACTIVITY_NOT_FOUND` - Activity with specified ID not found
- `NOTE_NOT_FOUND` - Note with specified ID not found
- `FOLLOWUP_NOT_FOUND` - Follow-up with specified ID not found
- `TAG_NOT_FOUND` - Tag with specified ID not found
- `TAG_ALREADY_ASSIGNED` - Tag is already assigned to lead
- `TAG_IN_USE` - Cannot delete tag that is assigned to leads
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions

## 🚦 Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **General endpoints**: 100 requests per minute per IP
- **Search endpoints**: 50 requests per minute per IP
- **Report endpoints**: 20 requests per minute per IP

## 🧪 Testing

### Test Environment
- **Base URL**: `http://localhost:3000/api/v1/leads`
- **Test Database**: Separate test database with sample data
- **Authentication**: Use test JWT tokens

### Sample Test Data
```bash
# Create test lead
curl -X POST http://localhost:3000/api/v1/leads \
  -H "Authorization: Bearer test_token" \
  -H "Content-Type: application/json" \
  -d @test_lead.json

# Search leads
curl -X GET "http://localhost:3000/api/v1/leads/search?q=office" \
  -H "Authorization: Bearer test_token"

# Get lead summary report
curl -X GET "http://localhost:3000/api/v1/leads/reports/summary" \
  -H "Authorization: Bearer test_token"
```

## 🔗 Integration Features

### Customer System Integration
- Lead conversion creates customer records
- Customer data is preserved during conversion
- First job is automatically created

### Job System Connection
- Converted leads create initial jobs
- Job details are captured during conversion
- Service history tracking begins

### Email Automation
- Welcome emails for new leads
- Follow-up reminders
- Status change notifications

### CRM Integration
- Lead scoring and qualification
- Activity tracking and history
- Performance analytics and reporting

## 📈 Lead Management Features

### **Core Lead Management:**
- Full CRUD operations for lead records
- Lead status tracking and lifecycle management
- Source attribution and tracking
- Priority classification and assignment

### **Lead Qualification:**
- Qualification scoring system (0-100)
- Qualification criteria tracking
- Automated qualification workflows
- Qualification status updates

### **Lead Activities:**
- Complete activity tracking
- Multiple activity types (calls, emails, meetings, etc.)
- Outcome recording and next action planning
- Activity completion tracking

### **Follow-up Management:**
- Scheduled follow-ups with reminders
- Follow-up completion tracking
- Automated follow-up scheduling
- Follow-up outcome recording

### **Lead Conversion:**
- Lead to customer conversion workflow
- First job creation and setup
- Customer record establishment
- Conversion value tracking

### **Tagging System:**
- Flexible tag creation and management
- Color-coded tag system
- Tag assignment and removal
- Tag-based filtering and reporting

### **Reporting & Analytics:**
- Lead performance metrics
- Conversion rate analysis
- Source effectiveness tracking
- Team performance monitoring
- Growth trend analysis
- Actionable insights and recommendations

## 🚀 Getting Started

1. **Run the migration script** to create all necessary database tables
2. **Start the server** and ensure the leads routes are loaded
3. **Test the health endpoint** to verify the API is working
4. **Create your first lead** using the POST endpoint
5. **Explore the various features** like contacts, activities, and follow-ups
6. **Generate reports** to analyze your lead performance

## 📚 Additional Resources

- [Database Schema](./scripts/leads-migration.js) - Complete database structure
- [Validation Schemas](./validations/leadValidation.js) - Request validation rules
- [API Controllers](./controllers/) - Business logic implementation
- [Error Handling](./middleware/errorHandler.js) - Centralized error management

This API provides a comprehensive foundation for managing leads, tracking their progression through the sales funnel, and converting them into customers for your junk removal business.
