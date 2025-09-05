# Jobs API Data Shapes

This document provides the complete data shapes and examples for all Jobs API endpoints.

## 🚀 Base Configuration

### Base URL
```
http://localhost:3000/api/v1
```

### Required Headers
```javascript
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

---

## 📊 GET /jobs - List Jobs

### Query Parameters
```javascript
{
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
  customer_id?: number,
  employee_id?: number,
  date_from?: string, // ISO date string (YYYY-MM-DD)
  date_to?: string,   // ISO date string (YYYY-MM-DD)
  page?: number,      // Default: 1
  limit?: number,     // Default: 20
  sort_by?: 'scheduled_date' | 'completion_date' | 'created_at' | 'total_cost' | 'status',
  sort_order?: 'asc' | 'desc' // Default: 'desc'
}
```

### Example Requests
```javascript
// Get all jobs
GET /jobs

// Get jobs with filters
GET /jobs?status=scheduled&page=1&limit=10&sort_by=scheduled_date&sort_order=asc

// Get jobs with date range
GET /jobs?date_from=2024-01-01&date_to=2024-01-31&customer_id=123

// Get jobs by employee
GET /jobs?employee_id=789&status=in_progress
```

### Response Data Shape
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": 1,
        "business_id": 1,
        "customer_id": 123,
        "estimate_id": 456,
        "assigned_employee_id": 789,
        "title": "Residential Cleanout",
        "description": "Remove old furniture and appliances",
        "scheduled_date": "2024-01-15T09:00:00.000Z",
        "completion_date": null,
        "status": "scheduled",
        "total_cost": 250.00,
        "created_at": "2024-01-10T10:30:00.000Z",
        "updated_at": "2024-01-10T10:30:00.000Z",
        "customer": {
          "id": 123,
          "name": "John Smith",
          "email": "john@example.com",
          "phone": "555-0123",
          "address": "123 Main St",
          "city": "Wilmington",
          "state": "NC",
          "zip_code": "28401"
        },
        "employee": {
          "id": 789,
          "first_name": "Mike",
          "last_name": "Johnson",
          "email": "mike@company.com",
          "phone": "555-0456",
          "job_title": "Driver"
        },
        "estimate": {
          "id": 456,
          "title": "Residential Cleanout Estimate",
          "amount": 250.00,
          "status": "accepted"
        }
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 95,
      "items_per_page": 20
    }
  },
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

### Empty State Response
```json
{
  "success": true,
  "data": {
    "jobs": [],
    "pagination": {
      "current_page": 1,
      "total_pages": 0,
      "total_items": 0,
      "items_per_page": 20
    }
  },
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 📝 POST /jobs - Create Job

### Request Body
```json
{
  "customer_id": 123,
  "estimate_id": 456,           // Optional
  "assigned_employee_id": 789,  // Optional
  "title": "Residential Cleanout",
  "description": "Remove old furniture and appliances", // Optional
  "scheduled_date": "2024-01-15T09:00:00.000Z",
  "total_cost": 250.00          // Optional
}
```

### Response Data Shape
```json
{
  "success": true,
  "data": {
    "job": {
      "id": 1,
      "business_id": 1,
      "customer_id": 123,
      "estimate_id": 456,
      "assigned_employee_id": 789,
      "title": "Residential Cleanout",
      "description": "Remove old furniture and appliances",
      "scheduled_date": "2024-01-15T09:00:00.000Z",
      "completion_date": null,
      "status": "scheduled",
      "total_cost": 250.00,
      "created_at": "2024-01-10T10:30:00.000Z",
      "updated_at": "2024-01-10T10:30:00.000Z"
    }
  },
  "message": "Job created successfully",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## ✏️ PUT /jobs/{id} - Update Job

### Request Body (All Fields Optional)
```json
{
  "customer_id": 123,
  "estimate_id": 456,
  "assigned_employee_id": 789,
  "title": "Updated Job Title",
  "description": "Updated description",
  "scheduled_date": "2024-01-15T09:00:00.000Z",
  "completion_date": "2024-01-15T14:30:00.000Z",
  "status": "in_progress",
  "total_cost": 275.00
}
```

### Response Data Shape
```json
{
  "success": true,
  "data": {
    "job": {
      "id": 1,
      "business_id": 1,
      "customer_id": 123,
      "estimate_id": 456,
      "assigned_employee_id": 789,
      "title": "Updated Job Title",
      "description": "Updated description",
      "scheduled_date": "2024-01-15T09:00:00.000Z",
      "completion_date": "2024-01-15T14:30:00.000Z",
      "status": "in_progress",
      "total_cost": 275.00,
      "created_at": "2024-01-10T10:30:00.000Z",
      "updated_at": "2024-01-10T11:45:00.000Z"
    }
  },
  "message": "Job updated successfully",
  "timestamp": "2024-01-10T11:45:00.000Z"
}
```

---

## 🔍 GET /jobs/{id} - Get Single Job

### Response Data Shape (Full Details)
```json
{
  "success": true,
  "data": {
    "job": {
      "id": 1,
      "business_id": 1,
      "customer_id": 123,
      "estimate_id": 456,
      "assigned_employee_id": 789,
      "title": "Residential Cleanout",
      "description": "Remove old furniture and appliances",
      "scheduled_date": "2024-01-15T09:00:00.000Z",
      "completion_date": null,
      "status": "scheduled",
      "total_cost": 250.00,
      "created_at": "2024-01-10T10:30:00.000Z",
      "updated_at": "2024-01-10T10:30:00.000Z",
      "customer": {
        "id": 123,
        "name": "John Smith",
        "email": "john@example.com",
        "phone": "555-0123",
        "address": "123 Main St",
        "city": "Wilmington",
        "state": "NC",
        "zip_code": "28401"
      },
      "employee": {
        "id": 789,
        "first_name": "Mike",
        "last_name": "Johnson",
        "email": "mike@company.com",
        "phone": "555-0456",
        "job_title": "Driver"
      },
      "estimate": {
        "id": 456,
        "title": "Residential Cleanout Estimate",
        "amount": 250.00,
        "status": "accepted"
      },
      "items": [
        {
          "id": 1,
          "job_id": 1,
          "name": "Couch",
          "category": "furniture",
          "quantity": 1,
          "base_price": 50.00,
          "difficulty": "medium",
          "estimated_time": 30,
          "created_at": "2024-01-10T10:30:00.000Z"
        }
      ],
      "photos": [
        {
          "id": 1,
          "job_id": 1,
          "photo_type": "before",
          "photo_url": "https://storage.example.com/jobs/1/before1.jpg",
          "caption": "Living room before cleanup",
          "uploaded_at": "2024-01-10T10:30:00.000Z"
        }
      ],
      "notes": [
        {
          "id": 1,
          "job_id": 1,
          "employee_id": 789,
          "note_type": "general",
          "content": "Customer requested early morning pickup",
          "is_important": false,
          "created_at": "2024-01-10T10:30:00.000Z",
          "employee_name": "Mike Johnson"
        }
      ],
      "status_history": [
        {
          "id": 1,
          "job_id": 1,
          "old_status": null,
          "new_status": "scheduled",
          "changed_by": 789,
          "notes": "Job created",
          "changed_at": "2024-01-10T10:30:00.000Z",
          "employee_name": "Mike Johnson"
        }
      ]
    }
  },
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 🗑️ DELETE /jobs/{id} - Delete Job

### Response Data Shape
```json
{
  "success": true,
  "message": "Job deleted successfully",
  "timestamp": "2024-01-10T11:45:00.000Z"
}
```

---

## 📊 GET /jobs/stats - Job Statistics

### Response Data Shape
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_jobs": 95,
      "scheduled_jobs": 12,
      "in_progress_jobs": 3,
      "completed_jobs": 78,
      "cancelled_jobs": 2,
      "total_revenue": 23750.00,
      "average_job_value": 250.00,
      "jobs_today": 5,
      "scheduled_today": 2
    }
  },
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 📦 Job Items Management

### POST /jobs/{id}/items - Add Job Item

#### Request Body
```json
{
  "name": "Refrigerator",
  "category": "appliances",
  "quantity": 1,
  "base_price": 75.00,
  "difficulty": "hard",
  "estimated_time": 45
}
```

#### Response Data Shape
```json
{
  "success": true,
  "data": {
    "item": {
      "id": 2,
      "job_id": 1,
      "name": "Refrigerator",
      "category": "appliances",
      "quantity": 1,
      "base_price": 75.00,
      "difficulty": "hard",
      "estimated_time": 45,
      "created_at": "2024-01-10T11:45:00.000Z"
    }
  },
  "message": "Job item added successfully",
  "timestamp": "2024-01-10T11:45:00.000Z"
}
```

### PUT /jobs/{jobId}/items/{itemId} - Update Job Item

#### Request Body
```json
{
  "quantity": 2,
  "base_price": 80.00
}
```

#### Response Data Shape
```json
{
  "success": true,
  "data": {
    "item": {
      "id": 2,
      "job_id": 1,
      "name": "Refrigerator",
      "category": "appliances",
      "quantity": 2,
      "base_price": 80.00,
      "difficulty": "hard",
      "estimated_time": 45,
      "created_at": "2024-01-10T11:45:00.000Z"
    }
  },
  "message": "Job item updated successfully",
  "timestamp": "2024-01-10T11:45:00.000Z"
}
```

### DELETE /jobs/{jobId}/items/{itemId} - Delete Job Item

#### Response Data Shape
```json
{
  "success": true,
  "message": "Job item deleted successfully",
  "timestamp": "2024-01-10T11:45:00.000Z"
}
```

---

## 📝 Job Notes Management

### POST /jobs/{id}/notes - Add Job Note

#### Request Body
```json
{
  "note_type": "customer_communication",
  "content": "Customer called to confirm pickup time",
  "is_important": false
}
```

#### Response Data Shape
```json
{
  "success": true,
  "data": {
    "note": {
      "id": 2,
      "job_id": 1,
      "employee_id": 789,
      "note_type": "customer_communication",
      "content": "Customer called to confirm pickup time",
      "is_important": false,
      "created_at": "2024-01-10T11:45:00.000Z",
      "employee_name": "Mike Johnson"
    }
  },
  "message": "Job note added successfully",
  "timestamp": "2024-01-10T11:45:00.000Z"
}
```

### PUT /jobs/{jobId}/notes/{noteId} - Update Job Note

#### Request Body
```json
{
  "content": "Updated note content",
  "is_important": true
}
```

#### Response Data Shape
```json
{
  "success": true,
  "data": {
    "note": {
      "id": 2,
      "job_id": 1,
      "employee_id": 789,
      "note_type": "customer_communication",
      "content": "Updated note content",
      "is_important": true,
      "created_at": "2024-01-10T11:45:00.000Z",
      "employee_name": "Mike Johnson"
    }
  },
  "message": "Job note updated successfully",
  "timestamp": "2024-01-10T11:45:00.000Z"
}
```

### DELETE /jobs/{jobId}/notes/{noteId} - Delete Job Note

#### Response Data Shape
```json
{
  "success": true,
  "message": "Job note deleted successfully",
  "timestamp": "2024-01-10T11:45:00.000Z"
}
```

---

## 📊 Job Status History

### GET /jobs/{id}/status-history - Get Status History

#### Response Data Shape
```json
{
  "success": true,
  "data": {
    "status_history": [
      {
        "id": 1,
        "job_id": 1,
        "old_status": null,
        "new_status": "scheduled",
        "changed_by": 789,
        "notes": "Job created",
        "changed_at": "2024-01-10T10:30:00.000Z",
        "employee_name": "Mike Johnson"
      },
      {
        "id": 2,
        "job_id": 1,
        "old_status": "scheduled",
        "new_status": "in_progress",
        "changed_by": 789,
        "notes": "Job started by crew",
        "changed_at": "2024-01-15T09:15:00.000Z",
        "employee_name": "Mike Johnson"
      }
    ]
  },
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 📋 Data Types Reference

### Job Status
```typescript
type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
```

### Note Type
```typescript
type NoteType = 'general' | 'customer_communication' | 'internal' | 'issue' | 'resolution';
```

### Photo Type
```typescript
type PhotoType = 'before' | 'after';
```

### Difficulty Level
```typescript
type Difficulty = 'easy' | 'medium' | 'hard';
```

### Sort Fields
```typescript
type SortField = 'scheduled_date' | 'completion_date' | 'created_at' | 'total_cost' | 'status';
```

### Sort Order
```typescript
type SortOrder = 'asc' | 'desc';
```

---

## ⚠️ Error Response Format

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "field_name",
      "message": "Field validation error message"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## 🚀 Quick Reference

### All Jobs Endpoints
- **GET** `/jobs` - List jobs with filtering
- **GET** `/jobs/{id}` - Get single job with full details
- **POST** `/jobs` - Create new job
- **PUT** `/jobs/{id}` - Update job
- **DELETE** `/jobs/{id}` - Delete job
- **GET** `/jobs/stats` - Get job statistics
- **POST** `/jobs/{id}/items` - Add job item
- **PUT** `/jobs/{jobId}/items/{itemId}` - Update job item
- **DELETE** `/jobs/{jobId}/items/{itemId}` - Delete job item
- **POST** `/jobs/{id}/notes` - Add job note
- **PUT** `/jobs/{jobId}/notes/{noteId}` - Update job note
- **DELETE** `/jobs/{jobId}/notes/{noteId}` - Delete job note
- **GET** `/jobs/{id}/status-history` - Get status history

### Common Query Parameters for Jobs List
- `status` - Filter by job status
- `customer_id` - Filter by customer
- `employee_id` - Filter by assigned employee
- `date_from` / `date_to` - Date range filters
- `page` - Page number for pagination
- `limit` - Items per page
- `sort_by` - Sort field
- `sort_order` - Sort direction (asc/desc)

### Required Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Date Formats
- All dates are in ISO 8601 format (UTC)
- Example: `"2024-01-15T09:00:00.000Z"`

### Number Formats
- **Decimal**: For costs and prices (e.g., `250.00`)
- **Integer**: For IDs, quantities, and counts (e.g., `123`)
