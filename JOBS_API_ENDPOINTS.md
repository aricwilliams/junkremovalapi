# Jobs API Endpoints for Frontend

This guide provides frontend developers with the specific API endpoints needed for the Jobs tab functionality.

## 🚀 Quick Start

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

---

## 💼 Job Management Endpoints

### 1. Get Jobs List
**GET** `/jobs`

Retrieve a paginated list of jobs with optional filtering and sorting.

**Query Parameters:**
```javascript
{
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled',
  customer_id: number,
  employee_id: number,
  date_from: string, // ISO date string
  date_to: string,   // ISO date string
  page: number,      // Default: 1
  limit: number,     // Default: 20
  sort_by: 'scheduled_date' | 'completion_date' | 'created_at' | 'total_cost' | 'status',
  sort_order: 'asc' | 'desc' // Default: 'desc'
}
```

**Frontend Example:**
```javascript
const token = localStorage.getItem('authToken');

// Get all jobs
const response = await fetch('http://localhost:3000/api/v1/jobs', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

// Get jobs with filtering
const params = new URLSearchParams({
  status: 'scheduled',
  page: '1',
  limit: '20',
  sort_by: 'scheduled_date',
  sort_order: 'asc'
});

const response = await fetch(`http://localhost:3000/api/v1/jobs?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.data.jobs - array of jobs
// result.data.pagination - pagination info
```

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

---

### 2. Get Single Job (Full Details)
**GET** `/jobs/{id}`

Retrieve a single job by ID with full details including items, photos, notes, and status history.

**Frontend Example:**
```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.data.job - job with full details
```

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

---

### 3. Create Job
**POST** `/jobs`

Create a new job.

**Frontend Example:**
```javascript
const token = localStorage.getItem('authToken');
const jobData = {
  customer_id: 123,
  estimate_id: 456,
  assigned_employee_id: 789,
  title: "Residential Cleanout",
  description: "Remove old furniture and appliances",
  scheduled_date: "2024-01-15T09:00:00Z",
  total_cost: 250.00
};

const response = await fetch('http://localhost:3000/api/v1/jobs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(jobData)
});

const result = await response.json();
// result.data.job - created job
```

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
      "updated_at": "2024-01-10T10:30:00Z"
    }
  },
  "message": "Job created successfully",
  "timestamp": "2024-01-10T10:30:00Z"
}
```

---

### 4. Update Job
**PUT** `/jobs/{id}`

Update an existing job.

**Frontend Example:**
```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;
const updateData = {
  status: "in_progress",
  assigned_employee_id: 789,
  total_cost: 275.00,
  completion_date: "2024-01-15T14:30:00Z",
  description: "Updated description with additional items"
};

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData)
});

const result = await response.json();
// result.data.job - updated job
```

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
      "description": "Updated description with additional items",
      "scheduled_date": "2024-01-15T09:00:00Z",
      "completion_date": "2024-01-15T14:30:00Z",
      "status": "in_progress",
      "total_cost": 275.00,
      "created_at": "2024-01-10T10:30:00Z",
      "updated_at": "2024-01-10T11:45:00Z"
    }
  },
  "message": "Job updated successfully",
  "timestamp": "2024-01-10T11:45:00Z"
}
```

---

### 5. Delete Job
**DELETE** `/jobs/{id}`

Delete a job.

**Frontend Example:**
```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.message - success message
```

**Response:**
```json
{
  "success": true,
  "message": "Job deleted successfully",
  "timestamp": "2024-01-10T11:45:00Z"
}
```

---

### 6. Get Job Statistics
**GET** `/jobs/stats`

Get job statistics and analytics for dashboard.

**Frontend Example:**
```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:3000/api/v1/jobs/stats', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.data.stats - statistics object
```

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

## 📦 Job Items Management

### 1. Add Job Item
**POST** `/jobs/{id}/items`

Add an item to a job.

**Frontend Example:**
```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;
const itemData = {
  name: "Refrigerator",
  category: "appliances",
  quantity: 1,
  base_price: 75.00,
  difficulty: "hard",
  estimated_time: 45
};

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}/items`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(itemData)
});

const result = await response.json();
// result.data.item - created item
```

### 2. Update Job Item
**PUT** `/jobs/{jobId}/items/{itemId}`

Update a job item.

**Frontend Example:**
```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;
const itemId = 201;
const updateData = {
  quantity: 2,
  base_price: 80.00
};

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}/items/${itemId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData)
});

const result = await response.json();
// result.data.item - updated item
```

### 3. Delete Job Item
**DELETE** `/jobs/{jobId}/items/{itemId}`

Delete a job item.

**Frontend Example:**
```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;
const itemId = 201;

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}/items/${itemId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.message - success message
```

---

## 📝 Job Notes Management

### 1. Add Job Note
**POST** `/jobs/{id}/notes`

Add a note to a job.

**Frontend Example:**
```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;
const noteData = {
  note_type: "customer_communication",
  content: "Customer called to confirm pickup time",
  is_important: false
};

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}/notes`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(noteData)
});

const result = await response.json();
// result.data.note - created note
```

### 2. Update Job Note
**PUT** `/jobs/{jobId}/notes/{noteId}`

Update a job note.

**Frontend Example:**
```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;
const noteId = 301;
const updateData = {
  content: "Updated note content",
  is_important: true
};

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}/notes/${noteId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData)
});

const result = await response.json();
// result.data.note - updated note
```

### 3. Delete Job Note
**DELETE** `/jobs/{jobId}/notes/{noteId}`

Delete a job note.

**Frontend Example:**
```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;
const noteId = 301;

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}/notes/${noteId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.message - success message
```

---

## 📊 Job Status History

### 1. Get Job Status History
**GET** `/jobs/{id}/status-history`

Get the status change history for a job.

**Frontend Example:**
```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}/status-history`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.data.status_history - array of status changes
```

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

## 🎨 Frontend Implementation Example

### React Hook for Jobs
```javascript
import { useState, useEffect } from 'react';

const useJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = async (url, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/v1${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'API call failed');
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const result = await apiCall(`/jobs?${params}`);
      setJobs(result.data.jobs);
      return result.data;
    } catch (err) {
      console.error('Failed to load jobs:', err);
    }
  };

  const getJob = async (jobId) => {
    try {
      const result = await apiCall(`/jobs/${jobId}`);
      return result.data.job;
    } catch (err) {
      console.error('Failed to get job:', err);
    }
  };

  const createJob = async (jobData) => {
    try {
      const result = await apiCall('/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData)
      });
      setJobs([...jobs, result.data.job]);
      return result.data.job;
    } catch (err) {
      console.error('Failed to create job:', err);
      throw err;
    }
  };

  const updateJob = async (jobId, updateData) => {
    try {
      const result = await apiCall(`/jobs/${jobId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      setJobs(jobs.map(job => job.id === jobId ? result.data.job : job));
      return result.data.job;
    } catch (err) {
      console.error('Failed to update job:', err);
      throw err;
    }
  };

  const deleteJob = async (jobId) => {
    try {
      await apiCall(`/jobs/${jobId}`, { method: 'DELETE' });
      setJobs(jobs.filter(job => job.id !== jobId));
    } catch (err) {
      console.error('Failed to delete job:', err);
      throw err;
    }
  };

  const getJobStats = async () => {
    try {
      const result = await apiCall('/jobs/stats');
      return result.data.stats;
    } catch (err) {
      console.error('Failed to get job stats:', err);
    }
  };

  return {
    jobs,
    loading,
    error,
    loadJobs,
    getJob,
    createJob,
    updateJob,
    deleteJob,
    getJobStats
  };
};

export default useJobs;
```

---

## ⚠️ Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Handling Example
```javascript
const handleJobOperation = async (operation) => {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    if (error.response) {
      const errorData = await error.response.json();
      return { 
        success: false, 
        message: errorData.message,
        errors: errorData.errors || []
      };
    } else {
      return { 
        success: false, 
        message: error.message 
      };
    }
  }
};
```

---

## 📊 Data Types

### Job Status
```typescript
type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
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

## 🚀 Quick Reference

### All Jobs Endpoints:
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

### Required Headers:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Common Query Parameters for Jobs List:
- `status` - Filter by job status
- `customer_id` - Filter by customer
- `employee_id` - Filter by assigned employee
- `date_from` / `date_to` - Date range filters
- `page` - Page number for pagination
- `limit` - Items per page
- `sort_by` - Sort field
- `sort_order` - Sort direction (asc/desc)
