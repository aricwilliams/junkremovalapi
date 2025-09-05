# Jobs API Documentation

Base URL: `http://localhost:3000/api/v1/jobs`

⚠️ **IMPORTANT**: All endpoints require authentication via Bearer token in the Authorization header.

## Authentication
```
Authorization: Bearer <your_jwt_token>
```

### Getting a Token
You need to authenticate first using the auth endpoints to get a JWT token. Include this token in every request header.

### Example with curl:
```bash
curl -X PUT http://localhost:3000/api/v1/jobs/6 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"customer_id": 1, "title": "Updated Job Title"}'
```

### Example with JavaScript fetch:
```javascript
fetch('http://localhost:3000/api/v1/jobs/6', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer_id: 1,
    title: 'Updated Job Title'
  })
})
```

---

## 1. Get All Jobs
**GET** `/api/v1/jobs`

### Query Parameters
- `status` (optional): Filter by job status (`scheduled`, `in_progress`, `completed`, `cancelled`)
- `customer_id` (optional): Filter by customer ID
- `employee_id` (optional): Filter by assigned employee ID
- `date_from` (optional): Filter jobs from this date (YYYY-MM-DD)
- `date_to` (optional): Filter jobs to this date (YYYY-MM-DD)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sort_by` (optional): Sort field (`scheduled_date`, `completion_date`, `created_at`, `total_cost`, `status`)
- `sort_order` (optional): Sort order (`asc`, `desc`)

### Example Request
```
GET /api/v1/jobs?status=scheduled&page=1&limit=10&sort_by=scheduled_date&sort_order=asc
```

### Response
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": 1,
        "business_id": 1,
        "customer_id": 1,
        "estimate_id": 1,
        "assigned_employee_id": 1,
        "title": "Office Cleanout",
        "description": "Complete office furniture removal",
        "scheduled_date": "2024-01-15T09:00:00.000Z",
        "completion_date": null,
        "status": "scheduled",
        "total_cost": 500.00,
        "created_at": "2024-01-10T10:30:00.000Z",
        "updated_at": "2024-01-10T10:30:00.000Z",
        "customer": {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "555-0123",
          "address": "123 Main St",
          "city": "Anytown",
          "state": "CA",
          "zip_code": "12345"
        },
        "employee": {
          "id": 1,
          "first_name": "Jane",
          "last_name": "Smith",
          "email": "jane@company.com",
          "phone": "555-0456",
          "job_title": "Team Lead"
        },
        "estimate": {
          "id": 1,
          "title": "Office Cleanout Estimate",
          "amount": 500.00,
          "status": "approved"
        }
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 100,
      "items_per_page": 20
    }
  },
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 2. Get Job Statistics
**GET** `/api/v1/jobs/stats`

### Response
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_jobs": 100,
      "scheduled_jobs": 25,
      "in_progress_jobs": 15,
      "completed_jobs": 55,
      "cancelled_jobs": 5,
      "total_revenue": 25000.00,
      "average_job_value": 250.00,
      "jobs_today": 3,
      "scheduled_today": 2
    }
  },
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 3. Get Single Job
**GET** `/api/v1/jobs/:id`

### Path Parameters
- `id`: Job ID

### Response
```json
{
  "success": true,
  "data": {
    "job": {
      "id": 1,
      "business_id": 1,
      "customer_id": 1,
      "estimate_id": 1,
      "assigned_employee_id": 1,
      "title": "Office Cleanout",
      "description": "Complete office furniture removal",
      "scheduled_date": "2024-01-15T09:00:00.000Z",
      "completion_date": null,
      "status": "scheduled",
      "total_cost": 500.00,
      "created_at": "2024-01-10T10:30:00.000Z",
      "updated_at": "2024-01-10T10:30:00.000Z",
      "customer": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "555-0123",
        "address": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "zip_code": "12345"
      },
      "employee": {
        "id": 1,
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@company.com",
        "phone": "555-0456",
        "job_title": "Team Lead"
      },
      "estimate": {
        "id": 1,
        "title": "Office Cleanout Estimate",
        "amount": 500.00,
        "status": "approved"
      },
      "items": [
        {
          "id": 1,
          "job_id": 1,
          "name": "Office Desk",
          "category": "Furniture",
          "quantity": 2,
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
          "filename": "office_before.jpg",
          "file_path": "/uploads/jobs/1/office_before.jpg",
          "uploaded_at": "2024-01-10T10:30:00.000Z"
        }
      ],
      "notes": [
        {
          "id": 1,
          "job_id": 1,
          "employee_id": 1,
          "note_type": "general",
          "content": "Customer requested early morning start",
          "is_important": false,
          "created_at": "2024-01-10T10:30:00.000Z",
          "employee_first_name": "Jane",
          "employee_last_name": "Smith",
          "employee_name": "Jane Smith"
        }
      ],
      "status_history": [
        {
          "id": 1,
          "job_id": 1,
          "old_status": null,
          "new_status": "scheduled",
          "changed_by": 1,
          "notes": "Job created",
          "changed_at": "2024-01-10T10:30:00.000Z",
          "employee_first_name": "Jane",
          "employee_last_name": "Smith",
          "employee_name": "Jane Smith"
        }
      ]
    }
  },
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 4. Get Job Status History
**GET** `/api/v1/jobs/:id/status-history`

### Path Parameters
- `id`: Job ID

### Response
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
        "changed_by": 1,
        "notes": "Job created",
        "changed_at": "2024-01-10T10:30:00.000Z",
        "employee_first_name": "Jane",
        "employee_last_name": "Smith",
        "employee_name": "Jane Smith"
      },
      {
        "id": 2,
        "job_id": 1,
        "old_status": "scheduled",
        "new_status": "in_progress",
        "changed_by": 1,
        "notes": "Status updated",
        "changed_at": "2024-01-15T09:00:00.000Z",
        "employee_first_name": "Jane",
        "employee_last_name": "Smith",
        "employee_name": "Jane Smith"
      }
    ]
  },
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 5. Create Job
**POST** `/api/v1/jobs`

### Request Body
```json
{
  "customer_id": 1,
  "estimate_id": 1,
  "assigned_employee_id": 1,
  "title": "Office Cleanout",
  "description": "Complete office furniture removal",
  "scheduled_date": "2024-01-15T09:00:00.000Z",
  "total_cost": 500.00
}
```

### Required Fields
- `customer_id` (integer): Customer ID
- `title` (string, 2-255 chars): Job title
- `scheduled_date` (date): When the job is scheduled

### Optional Fields
- `estimate_id` (integer): Associated estimate ID
- `assigned_employee_id` (integer): Assigned employee ID
- `description` (string, max 1000 chars): Job description
- `completion_date` (date): When job was completed
- `status` (string): Job status (`scheduled`, `in_progress`, `completed`, `cancelled`)
- `total_cost` (number): Total job cost

### Response
```json
{
  "success": true,
  "data": {
    "job": {
      "id": 1,
      "business_id": 1,
      "customer_id": 1,
      "estimate_id": 1,
      "assigned_employee_id": 1,
      "title": "Office Cleanout",
      "description": "Complete office furniture removal",
      "scheduled_date": "2024-01-15T09:00:00.000Z",
      "completion_date": null,
      "status": "scheduled",
      "total_cost": 500.00,
      "created_at": "2024-01-10T10:30:00.000Z",
      "updated_at": "2024-01-10T10:30:00.000Z"
    }
  },
  "message": "Job created successfully",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 6. Update Job
**PUT** `/api/v1/jobs/:id`

### Path Parameters
- `id`: Job ID

### Request Body
```json
{
  "title": "Updated Office Cleanout",
  "description": "Updated description",
  "status": "in_progress",
  "assigned_employee_id": 2,
  "total_cost": 600.00
}
```

### Updatable Fields
- `customer_id` (integer)
- `estimate_id` (integer)
- `assigned_employee_id` (integer)
- `title` (string, 2-255 chars)
- `description` (string, max 1000 chars)
- `scheduled_date` (date)
- `completion_date` (date)
- `status` (string)
- `total_cost` (number)

### Response
```json
{
  "success": true,
  "data": {
    "job": {
      "id": 1,
      "business_id": 1,
      "customer_id": 1,
      "estimate_id": 1,
      "assigned_employee_id": 2,
      "title": "Updated Office Cleanout",
      "description": "Updated description",
      "scheduled_date": "2024-01-15T09:00:00.000Z",
      "completion_date": null,
      "status": "in_progress",
      "total_cost": 600.00,
      "created_at": "2024-01-10T10:30:00.000Z",
      "updated_at": "2024-01-10T11:00:00.000Z"
    }
  },
  "message": "Job updated successfully",
  "timestamp": "2024-01-10T11:00:00.000Z"
}
```

---

## 7. Delete Job
**DELETE** `/api/v1/jobs/:id`

### Path Parameters
- `id`: Job ID

### Response
```json
{
  "success": true,
  "message": "Job deleted successfully",
  "timestamp": "2024-01-10T11:00:00.000Z"
}
```

---

## 8. Add Job Item
**POST** `/api/v1/jobs/:id/items`

### Path Parameters
- `id`: Job ID

### Request Body
```json
{
  "name": "Office Desk",
  "category": "Furniture",
  "quantity": 2,
  "base_price": 50.00,
  "difficulty": "medium",
  "estimated_time": 30
}
```

### Required Fields
- `name` (string, 2-255 chars): Item name
- `category` (string, 2-100 chars): Item category
- `quantity` (integer, min 1): Quantity
- `base_price` (number, min 0): Base price per item
- `estimated_time` (integer, min 1): Estimated time in minutes

### Optional Fields
- `difficulty` (string): Difficulty level (`easy`, `medium`, `hard`)

### Response
```json
{
  "success": true,
  "data": {
    "item": {
      "id": 1,
      "job_id": 1,
      "name": "Office Desk",
      "category": "Furniture",
      "quantity": 2,
      "base_price": 50.00,
      "difficulty": "medium",
      "estimated_time": 30,
      "created_at": "2024-01-10T10:30:00.000Z"
    }
  },
  "message": "Job item added successfully",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 9. Update Job Item
**PUT** `/api/v1/jobs/:jobId/items/:itemId`

### Path Parameters
- `jobId`: Job ID
- `itemId`: Item ID

### Request Body
```json
{
  "name": "Updated Office Desk",
  "quantity": 3,
  "base_price": 60.00,
  "difficulty": "hard"
}
```

### Updatable Fields
- `name` (string, 2-255 chars)
- `category` (string, 2-100 chars)
- `quantity` (integer, min 1)
- `base_price` (number, min 0)
- `difficulty` (string)
- `estimated_time` (integer, min 1)

### Response
```json
{
  "success": true,
  "data": {
    "item": {
      "id": 1,
      "job_id": 1,
      "name": "Updated Office Desk",
      "category": "Furniture",
      "quantity": 3,
      "base_price": 60.00,
      "difficulty": "hard",
      "estimated_time": 30,
      "created_at": "2024-01-10T10:30:00.000Z"
    }
  },
  "message": "Job item updated successfully",
  "timestamp": "2024-01-10T11:00:00.000Z"
}
```

---

## 10. Delete Job Item
**DELETE** `/api/v1/jobs/:jobId/items/:itemId`

### Path Parameters
- `jobId`: Job ID
- `itemId`: Item ID

### Response
```json
{
  "success": true,
  "message": "Job item deleted successfully",
  "timestamp": "2024-01-10T11:00:00.000Z"
}
```

---

## 11. Add Job Note
**POST** `/api/v1/jobs/:id/notes`

### Path Parameters
- `id`: Job ID

### Request Body
```json
{
  "note_type": "general",
  "content": "Customer requested early morning start",
  "is_important": false
}
```

### Required Fields
- `content` (string, 1-1000 chars): Note content

### Optional Fields
- `note_type` (string): Note type (`general`, `customer_communication`, `internal`, `issue`, `resolution`)
- `is_important` (boolean): Whether the note is important

### Response
```json
{
  "success": true,
  "data": {
    "note": {
      "id": 1,
      "job_id": 1,
      "employee_id": 1,
      "note_type": "general",
      "content": "Customer requested early morning start",
      "is_important": false,
      "created_at": "2024-01-10T10:30:00.000Z",
      "employee_first_name": "Jane",
      "employee_last_name": "Smith"
    }
  },
  "message": "Job note added successfully",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 12. Update Job Note
**PUT** `/api/v1/jobs/:jobId/notes/:noteId`

### Path Parameters
- `jobId`: Job ID
- `noteId`: Note ID

### Request Body
```json
{
  "note_type": "customer_communication",
  "content": "Updated note content",
  "is_important": true
}
```

### Updatable Fields
- `note_type` (string)
- `content` (string, 1-1000 chars)
- `is_important` (boolean)

### Response
```json
{
  "success": true,
  "data": {
    "note": {
      "id": 1,
      "job_id": 1,
      "employee_id": 1,
      "note_type": "customer_communication",
      "content": "Updated note content",
      "is_important": true,
      "created_at": "2024-01-10T10:30:00.000Z",
      "employee_first_name": "Jane",
      "employee_last_name": "Smith"
    }
  },
  "message": "Job note updated successfully",
  "timestamp": "2024-01-10T11:00:00.000Z"
}
```

---

## 13. Delete Job Note
**DELETE** `/api/v1/jobs/:jobId/notes/:noteId`

### Path Parameters
- `jobId`: Job ID
- `noteId`: Note ID

### Response
```json
{
  "success": true,
  "message": "Job note deleted successfully",
  "timestamp": "2024-01-10T11:00:00.000Z"
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    },
    {
      "field": "customer_id",
      "message": "Customer ID must be a number"
    }
  ],
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Job not found",
  "error": "JOB_NOT_FOUND",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

### Unauthorized Error (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided.",
  "error": "UNAUTHORIZED",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## Status Values
- `scheduled`: Job is scheduled but not started
- `in_progress`: Job is currently being worked on
- `completed`: Job has been completed
- `cancelled`: Job has been cancelled

## Note Types
- `general`: General notes
- `customer_communication`: Communication with customer
- `internal`: Internal team notes
- `issue`: Issues encountered
- `resolution`: Problem resolutions

## Difficulty Levels
- `easy`: Easy to handle
- `medium`: Moderate difficulty
- `hard`: High difficulty

---

## Troubleshooting

### Common Issues

#### 1. Authentication Error: "Access denied. No token provided"
**Error**: `{"success":false,"message":"Access denied. No token provided.","error":"AUTHENTICATION_FAILED"}`

**Solution**: 
- Make sure you're including the Authorization header in your request
- Get a valid JWT token by authenticating first
- Include the token in the format: `Authorization: Bearer <your_token>`

#### 2. Validation Error: "Customer ID is required"
**Error**: `{"success":false,"message":"Validation failed","errors":[{"field":"customer_id","message":"Customer ID is required"}]}`

**Solution**: 
- For PUT requests, you must include at least one valid field to update
- `customer_id` is required when creating a job, but for updates you can send any of the updatable fields
- Make sure your request body includes valid data

#### 3. PUT Request Requirements
When updating a job with PUT, you need to send at least one of these fields:
- `customer_id` (integer)
- `estimate_id` (integer) 
- `assigned_employee_id` (integer)
- `title` (string, 2-255 chars)
- `description` (string, max 1000 chars)
- `scheduled_date` (date)
- `completion_date` (date)
- `status` (string)
- `total_cost` (number)

#### 4. CORS Error: "Access to fetch at 'http://localhost:3000/api/v1/jobs' from origin 'http://localhost:XXXX' has been blocked by CORS policy"
**Error**: Browser console shows CORS policy blocking the request

**Solution**: 
- Make sure your frontend is running on one of the allowed ports: 3000, 3001, 5173, 8080, 4200, 4000, 5000, 8000
- If your frontend is on a different port, add it to the CORS configuration in `server.js`
- For development, you can temporarily allow all origins by setting `ALLOW_ALL_ORIGINS=true` in your `.env` file
- Restart your API server after making CORS changes

#### 5. Testing Your Requests
Use these tools to test your API calls:
- **Postman**: Import the requests and add your token
- **curl**: Use the examples provided above
- **Browser DevTools**: Check the Network tab to see request headers and body

### Quick Test Commands

#### Test Authentication (replace with your actual token):
```bash
curl -X GET http://localhost:3000/api/v1/jobs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Test Job Update (replace with your actual token and job ID):
```bash
curl -X PUT http://localhost:3000/api/v1/jobs/6 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Job Title", "status": "in_progress"}'
```
