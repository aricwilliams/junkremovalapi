# Employees API Documentation

Base URL: `http://localhost:3000/api/v1/employees`

⚠️ **IMPORTANT**: All endpoints require authentication via Bearer token in the Authorization header.

## Authentication
```
Authorization: Bearer <your_jwt_token>
```

### Getting a Token
You need to authenticate first using the auth endpoints to get a JWT token. Include this token in every request header.

### Example with curl:
```bash
curl -X GET http://localhost:3000/api/v1/employees \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Example with JavaScript fetch:
```javascript
fetch('http://localhost:3000/api/v1/employees', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
    'Content-Type': 'application/json'
  }
})
```

---

## 1. Get All Employees
**GET** `/api/v1/employees`

### Query Parameters
- `status` (optional): Filter by employee status (`active`, `inactive`, `on-leave`, `terminated`)
- `position` (optional): Filter by position (`driver`, `helper`, `supervisor`, `manager`, `admin`)
- `employee_type` (optional): Filter by employee type (`manager`, `regular`, `1099`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sort_by` (optional): Sort field (default: `created_at`)
- `sort_order` (optional): Sort order (`asc`, `desc`)

### Example Request
```
GET /api/v1/employees?status=active&position=driver&page=1&limit=10&sort_by=first_name&sort_order=asc
```

### Response
```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": 1,
        "business_id": 1,
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@company.com",
        "phone": "555-0456",
        "job_title": "Team Lead",
        "employee_type": "regular",
        "position": "supervisor",
        "status": "active",
        "hire_date": "2024-01-01T00:00:00.000Z",
        "created_at": "2024-01-10T10:30:00.000Z",
        "updated_at": "2024-01-10T10:30:00.000Z"
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

## 2. Get Single Employee
**GET** `/api/v1/employees/:id`

### Path Parameters
- `id`: Employee ID

### Response
```json
{
  "success": true,
  "data": {
    "employee": {
      "id": 1,
      "business_id": 1,
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane@company.com",
      "phone": "555-0456",
      "job_title": "Team Lead",
      "employee_type": "regular",
      "position": "supervisor",
      "status": "active",
      "hire_date": "2024-01-01T00:00:00.000Z",
      "created_at": "2024-01-10T10:30:00.000Z",
      "updated_at": "2024-01-10T10:30:00.000Z"
    }
  },
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 3. Create Employee
**POST** `/api/v1/employees`

### Request Body
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@company.com",
  "phone": "555-0456",
  "job_title": "Team Lead",
  "employee_type": "regular",
  "position": "supervisor",
  "status": "active",
  "hire_date": "2024-01-01T00:00:00.000Z"
}
```

### Required Fields
- `first_name` (string, 2-100 chars): Employee first name
- `last_name` (string, 2-100 chars): Employee last name
- `email` (string, valid email): Employee email address
- `phone` (string, valid phone): Employee phone number
- `job_title` (string, 2-100 chars): Employee job title
- `hire_date` (date): Employee hire date

### Optional Fields
- `employee_type` (string): Employee type (`manager`, `regular`, `1099`)
- `position` (string): Employee position (`driver`, `helper`, `supervisor`, `manager`, `admin`)
- `status` (string): Employee status (`active`, `inactive`, `on-leave`, `terminated`)

### Response
```json
{
  "success": true,
  "data": {
    "employee": {
      "id": 1,
      "business_id": 1,
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane@company.com",
      "phone": "555-0456",
      "job_title": "Team Lead",
      "employee_type": "regular",
      "position": "supervisor",
      "status": "active",
      "hire_date": "2024-01-01T00:00:00.000Z",
      "created_at": "2024-01-10T10:30:00.000Z",
      "updated_at": "2024-01-10T10:30:00.000Z"
    }
  },
  "message": "Employee created successfully",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 4. Update Employee
**PUT** `/api/v1/employees/:id`

### Path Parameters
- `id`: Employee ID

### Request Body
```json
{
  "first_name": "Jane",
  "last_name": "Johnson",
  "email": "jane.johnson@company.com",
  "job_title": "Senior Team Lead",
  "position": "manager",
  "status": "active"
}
```

### Updatable Fields
- `first_name` (string, 2-100 chars)
- `last_name` (string, 2-100 chars)
- `email` (string, valid email)
- `phone` (string, valid phone)
- `job_title` (string, 2-100 chars)
- `employee_type` (string)
- `position` (string)
- `status` (string)
- `hire_date` (date)

### Response
```json
{
  "success": true,
  "data": {
    "employee": {
      "id": 1,
      "business_id": 1,
      "first_name": "Jane",
      "last_name": "Johnson",
      "email": "jane.johnson@company.com",
      "phone": "555-0456",
      "job_title": "Senior Team Lead",
      "employee_type": "regular",
      "position": "manager",
      "status": "active",
      "hire_date": "2024-01-01T00:00:00.000Z",
      "created_at": "2024-01-10T10:30:00.000Z",
      "updated_at": "2024-01-10T11:00:00.000Z"
    }
  },
  "message": "Employee updated successfully",
  "timestamp": "2024-01-10T11:00:00.000Z"
}
```

---

## 5. Delete Employee
**DELETE** `/api/v1/employees/:id`

### Path Parameters
- `id`: Employee ID

### Response
```json
{
  "success": true,
  "message": "Employee deleted successfully",
  "timestamp": "2024-01-10T11:00:00.000Z"
}
```

**Note**: Employee cannot be deleted if they have associated jobs.

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "first_name",
      "message": "First name is required"
    },
    {
      "field": "email",
      "message": "Email must be a valid email address"
    }
  ],
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Employee not found",
  "error": "EMPLOYEE_NOT_FOUND",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

### Employee Exists Error (400)
```json
{
  "success": false,
  "message": "Employee with this email already exists",
  "error": "EMPLOYEE_EXISTS",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

### Employee Has Jobs Error (409)
```json
{
  "success": false,
  "message": "Cannot delete employee with associated jobs",
  "error": "EMPLOYEE_HAS_JOBS",
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

## Field Validation Rules

### Employee Types
- `manager`: Manager employee
- `regular`: Regular employee
- `1099`: 1099 contractor

### Employee Positions
- `driver`: Driver position
- `helper`: Helper position
- `supervisor`: Supervisor position
- `manager`: Manager position
- `admin`: Admin position

### Employee Status
- `active`: Active employee
- `inactive`: Inactive employee
- `on-leave`: Employee on leave
- `terminated`: Terminated employee

### Phone Number Format
- Must be a valid phone number
- Can include country code with +
- Examples: `555-0456`, `+15550456`, `15550456`

### Date Format
- Must be a valid date
- ISO 8601 format preferred
- Examples: `2024-01-01T00:00:00.000Z`, `2024-01-01`

---

## Troubleshooting

### Common Issues

#### 1. Authentication Error: "Access denied. No token provided"
**Error**: `{"success":false,"message":"Access denied. No token provided.","error":"AUTHENTICATION_FAILED"}`

**Solution**: 
- Make sure you're including the Authorization header in your request
- Get a valid JWT token by authenticating first
- Include the token in the format: `Authorization: Bearer <your_token>`

#### 2. Validation Error: "First name is required"
**Error**: `{"success":false,"message":"Validation failed","errors":[{"field":"first_name","message":"First name is required"}]}`

**Solution**: 
- Make sure all required fields are included in your request
- Check field validation rules (min/max lengths, formats)
- Ensure email is valid and phone number follows the correct format

#### 3. Employee Exists Error
**Error**: `{"success":false,"message":"Employee with this email already exists","error":"EMPLOYEE_EXISTS"}`

**Solution**: 
- Check if an employee with this email already exists
- Use a different email address or update the existing employee

#### 4. Employee Has Jobs Error
**Error**: `{"success":false,"message":"Cannot delete employee with associated jobs","error":"EMPLOYEE_HAS_JOBS"}`

**Solution**: 
- Check if the employee has any associated jobs
- Reassign or complete the jobs before deleting the employee

#### 5. CORS Error
**Error**: Browser console shows CORS policy blocking the request

**Solution**: 
- Make sure your frontend is running on one of the allowed ports
- Check that your API server is running and CORS is configured properly

### Quick Test Commands

#### Test Authentication (replace with your actual token):
```bash
curl -X GET http://localhost:3000/api/v1/employees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Test Employee Creation (replace with your actual token):
```bash
curl -X POST http://localhost:3000/api/v1/employees \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@company.com",
    "phone": "555-0123",
    "job_title": "Driver",
    "hire_date": "2024-01-01T00:00:00.000Z"
  }'
```

#### Test Employee Update (replace with your actual token and employee ID):
```bash
curl -X PUT http://localhost:3000/api/v1/employees/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"job_title": "Senior Driver", "position": "supervisor"}'
```

#### Test Employee Filtering:
```bash
curl -X GET "http://localhost:3000/api/v1/employees?status=active&position=driver" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
