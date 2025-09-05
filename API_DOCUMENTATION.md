# Junk Removal Business API Documentation

This document outlines all the API endpoints for the junk removal business management system.

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All endpoints (except auth endpoints) require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

## Response Format
All API responses follow this standard format:
```json
{
  "success": boolean,
  "data": object,
  "timestamp": string,
  "message"?: string
}
```

## Error Response Format
```json
{
  "success": false,
  "message": string,
  "error"?: string,
  "timestamp": string
}
```

---

## Authentication Endpoints

### 1. Business Signup
**POST** `/auth/signup`

Creates a new business account and returns a JWT token.

**Request Body:**
```json
{
  "business_name": "ABC Junk Removal",
  "business_phone": "+1234567890",
  "business_address": "123 Main St",
  "business_city": "Los Angeles",
  "business_state": "CA",
  "business_zip_code": "90210",
  "owner_first_name": "John",
  "owner_last_name": "Smith",
  "owner_email": "john@abcjunkremoval.com",
  "owner_phone": "+1234567890",
  "username": "abcjunkremoval",
  "password": "SecurePass123!",
  "license_number": "LIC123456",
  "insurance_number": "INS123456",
  "service_radius": 25,
  "number_of_trucks": 2,
  "years_in_business": 5
}
```

### 2. Business Login
**POST** `/auth/login`

Authenticates a business and returns a JWT token.

**Request Body:**
```json
{
  "username": "abcjunkremoval",
  "password": "SecurePass123!"
}
```

### 3. Get Business Profile
**GET** `/auth/profile`

Retrieves the authenticated business's profile information.

### 4. Update Business Profile
**PUT** `/auth/profile`

Updates the authenticated business's profile information.

---

## Customer Endpoints

### 1. Get Customers List
**GET** `/customers`

Retrieve a paginated list of customers with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by customer status
- `customer_type` (optional): Filter by customer type
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sort_by` (optional): Sort field (default: 'created_at')
- `sort_order` (optional): Sort order 'asc' or 'desc' (default: 'desc')

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": 1,
        "business_id": 1,
        "name": "John Smith",
        "email": "john@example.com",
        "phone": "555-0123",
        "address": "123 Main St",
        "city": "Wilmington",
        "state": "NC",
        "zip_code": "28401",
        "customer_type": "residential",
        "status": "new",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 95,
      "items_per_page": 20
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Get Single Customer
**GET** `/customers/{id}`

Retrieve a single customer by ID.

### 3. Create Customer
**POST** `/customers`

Create a new customer.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "555-0123",
  "address": "123 Main St",
  "city": "Wilmington",
  "state": "NC",
  "zip_code": "28401",
  "customer_type": "residential",
  "status": "new"
}
```

### 4. Update Customer
**PUT** `/customers/{id}`

Update an existing customer.

### 5. Delete Customer
**DELETE** `/customers/{id}`

Delete a customer (only if no associated jobs exist).

---

## Employee Endpoints

### 1. Get Employees List
**GET** `/employees`

Retrieve a paginated list of employees with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by employee status
- `position` (optional): Filter by position
- `employee_type` (optional): Filter by employee type
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sort_by` (optional): Sort field (default: 'created_at')
- `sort_order` (optional): Sort order 'asc' or 'desc' (default: 'desc')

**Response:**
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": 1,
        "business_id": 1,
        "first_name": "Mike",
        "last_name": "Johnson",
        "email": "mike@company.com",
        "phone": "555-0456",
        "job_title": "Driver",
        "employee_type": "regular",
        "position": "driver",
        "status": "active",
        "hire_date": "2024-01-01",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 3,
      "total_items": 45,
      "items_per_page": 20
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Get Single Employee
**GET** `/employees/{id}`

Retrieve a single employee by ID.

### 3. Create Employee
**POST** `/employees`

Create a new employee.

**Request Body:**
```json
{
  "first_name": "Mike",
  "last_name": "Johnson",
  "email": "mike@company.com",
  "phone": "555-0456",
  "job_title": "Driver",
  "employee_type": "regular",
  "position": "driver",
  "status": "active",
  "hire_date": "2024-01-01"
}
```

### 4. Update Employee
**PUT** `/employees/{id}`

Update an existing employee.

### 5. Delete Employee
**DELETE** `/employees/{id}`

Delete an employee (only if no associated jobs exist).

---

## Estimate Endpoints

### 1. Get Estimates List
**GET** `/estimates`

Retrieve a paginated list of estimates with optional filtering.

**Query Parameters:**
- `status` (optional): Filter by estimate status
- `customer_id` (optional): Filter by customer ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sort_by` (optional): Sort field (default: 'created_at')
- `sort_order` (optional): Sort order 'asc' or 'desc' (default: 'desc')

**Response:**
```json
{
  "success": true,
  "data": {
    "estimates": [
      {
        "id": 1,
        "business_id": 1,
        "customer_id": 123,
        "title": "Residential Cleanout Estimate",
        "amount": 250.00,
        "status": "accepted",
        "sent_date": "2024-01-01T10:00:00.000Z",
        "expiry_date": "2024-01-15T10:00:00.000Z",
        "notes": "Customer requested early morning pickup",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z",
        "customer_name": "John Smith",
        "customer_email": "john@example.com",
        "customer_phone": "555-0123"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 2,
      "total_items": 25,
      "items_per_page": 20
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Get Single Estimate
**GET** `/estimates/{id}`

Retrieve a single estimate by ID with customer details.

### 3. Create Estimate
**POST** `/estimates`

Create a new estimate.

**Request Body:**
```json
{
  "customer_id": 123,
  "title": "Residential Cleanout Estimate",
  "amount": 250.00,
  "status": "draft",
  "sent_date": "2024-01-01T10:00:00.000Z",
  "expiry_date": "2024-01-15T10:00:00.000Z",
  "notes": "Customer requested early morning pickup"
}
```

### 4. Update Estimate
**PUT** `/estimates/{id}`

Update an existing estimate.

### 5. Delete Estimate
**DELETE** `/estimates/{id}`

Delete an estimate (only if no associated jobs exist).

---

## Job Endpoints

### 1. Get Jobs List
**GET** `/jobs`

Retrieve a paginated list of jobs with optional filtering and sorting.

**Query Parameters:**
- `status` (optional): Filter by job status
- `customer_id` (optional): Filter by customer ID
- `employee_id` (optional): Filter by assigned employee ID
- `date_from` (optional): Filter jobs from date (ISO date string)
- `date_to` (optional): Filter jobs to date (ISO date string)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sort_by` (optional): Sort field (default: 'scheduled_date')
- `sort_order` (optional): Sort order 'asc' or 'desc' (default: 'desc')

**Response:**
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
        "scheduled_date": "2024-01-15T09:00:00Z",
        "completion_date": null,
        "status": "scheduled",
        "total_cost": 250.00,
        "created_at": "2024-01-10T10:30:00Z",
        "updated_at": "2024-01-10T10:30:00Z",
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
  "timestamp": "2024-01-10T10:30:00Z"
}
```

### 2. Get Single Job
**GET** `/jobs/{id}`

Retrieve a single job by ID with full details including items, photos, notes, and status history.

**Response:**
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
      "scheduled_date": "2024-01-15T09:00:00Z",
      "completion_date": null,
      "status": "scheduled",
      "total_cost": 250.00,
      "created_at": "2024-01-10T10:30:00Z",
      "updated_at": "2024-01-10T10:30:00Z",
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
          "created_at": "2024-01-10T10:30:00Z"
        }
      ],
      "photos": [
        {
          "id": 1,
          "job_id": 1,
          "photo_type": "before",
          "photo_url": "https://storage.example.com/jobs/1/before1.jpg",
          "caption": "Living room before cleanup",
          "uploaded_at": "2024-01-10T10:30:00Z"
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
          "created_at": "2024-01-10T10:30:00Z",
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
          "changed_at": "2024-01-10T10:30:00Z",
          "employee_name": "Mike Johnson"
        }
      ]
    }
  },
  "timestamp": "2024-01-10T10:30:00Z"
}
```

### 3. Create Job
**POST** `/jobs`

Create a new job.

**Request Body:**
```json
{
  "customer_id": 123,
  "estimate_id": 456,
  "assigned_employee_id": 789,
  "title": "Residential Cleanout",
  "description": "Remove old furniture and appliances",
  "scheduled_date": "2024-01-15T09:00:00Z",
  "total_cost": 250.00
}
```

### 4. Update Job
**PUT** `/jobs/{id}`

Update an existing job.

**Request Body:**
```json
{
  "status": "in_progress",
  "assigned_employee_id": 789,
  "total_cost": 275.00,
  "completion_date": "2024-01-15T14:30:00Z",
  "description": "Updated description with additional items"
}
```

### 5. Delete Job
**DELETE** `/jobs/{id}`

Delete a job.

### 6. Get Job Statistics
**GET** `/jobs/stats`

Get job statistics and analytics.

**Response:**
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
  "timestamp": "2024-01-10T10:30:00Z"
}
```

---

## Job Items Endpoints

### 1. Add Job Item
**POST** `/jobs/{id}/items`

Add an item to a job.

**Request Body:**
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

### 2. Update Job Item
**PUT** `/jobs/{jobId}/items/{itemId}`

Update a job item.

**Request Body:**
```json
{
  "quantity": 2,
  "base_price": 80.00
}
```

### 3. Delete Job Item
**DELETE** `/jobs/{jobId}/items/{itemId}`

Delete a job item.

---

## Job Notes Endpoints

### 1. Add Job Note
**POST** `/jobs/{id}/notes`

Add a note to a job.

**Request Body:**
```json
{
  "note_type": "customer_communication",
  "content": "Customer called to confirm pickup time",
  "is_important": false
}
```

### 2. Update Job Note
**PUT** `/jobs/{jobId}/notes/{noteId}`

Update a job note.

**Request Body:**
```json
{
  "content": "Updated note content",
  "is_important": true
}
```

### 3. Delete Job Note
**DELETE** `/jobs/{jobId}/notes/{noteId}`

Delete a job note.

---

## Job Status History Endpoints

### 1. Get Job Status History
**GET** `/jobs/{id}/status-history`

Get the status change history for a job.

**Response:**
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
        "changed_at": "2024-01-10T10:30:00Z",
        "employee_name": "Mike Johnson"
      },
      {
        "id": 2,
        "job_id": 1,
        "old_status": "scheduled",
        "new_status": "in_progress",
        "changed_by": 789,
        "notes": "Job started by crew",
        "changed_at": "2024-01-15T09:15:00Z",
        "employee_name": "Mike Johnson"
      }
    ]
  },
  "timestamp": "2024-01-10T10:30:00Z"
}
```

---

## Data Types

### Job Status
```typescript
type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
```

### Customer Type
```typescript
type CustomerType = 'residential' | 'commercial' | 'industrial' | 'government';
```

### Customer Status
```typescript
type CustomerStatus = 'new' | 'quoted' | 'scheduled' | 'completed' | 'inactive' | 'blacklisted';
```

### Employee Type
```typescript
type EmployeeType = 'manager' | 'regular' | '1099';
```

### Employee Position
```typescript
type EmployeePosition = 'driver' | 'helper' | 'supervisor' | 'manager' | 'admin';
```

### Employee Status
```typescript
type EmployeeStatus = 'active' | 'inactive' | 'on-leave' | 'terminated';
```

### Estimate Status
```typescript
type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
```

### Photo Type
```typescript
type PhotoType = 'before' | 'after';
```

### Note Type
```typescript
type NoteType = 'general' | 'customer_communication' | 'internal' | 'issue' | 'resolution';
```

### Difficulty Level
```typescript
type Difficulty = 'easy' | 'medium' | 'hard';
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Business rule violation |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |

---

## Frontend Integration Notes

1. **Authentication**: All requests must include the Bearer token in the Authorization header
2. **Error Handling**: Use the standardized error response format for consistent error handling
3. **Pagination**: List endpoints support pagination for large datasets
4. **Filtering**: Multiple filter options are available for list endpoints
5. **Business Isolation**: All endpoints automatically filter by the authenticated user's business_id
6. **Date Formats**: All dates are in ISO 8601 format (UTC)
7. **Validation**: All input data is validated on the server side
8. **Relationships**: Related data is included in responses where appropriate

---

## Testing

To test the API endpoints:

1. Start the server: `npm start`
2. Use the authentication endpoints to get a JWT token
3. Include the token in the Authorization header for all other requests
4. Test the endpoints using tools like Postman, curl, or your frontend application

---

**Current Version:** 1.0.0  
**Last Updated:** January 2024
