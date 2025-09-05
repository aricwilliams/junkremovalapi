# Customers API Documentation

Base URL: `http://localhost:3000/api/v1/customers`

⚠️ **IMPORTANT**: All endpoints require authentication via Bearer token in the Authorization header.

## Authentication
```
Authorization: Bearer <your_jwt_token>
```

### Getting a Token
You need to authenticate first using the auth endpoints to get a JWT token. Include this token in every request header.

### Example with curl:
```bash
curl -X GET http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Example with JavaScript fetch:
```javascript
fetch('http://localhost:3000/api/v1/customers', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
    'Content-Type': 'application/json'
  }
})
```

---

## 1. Get All Customers
**GET** `/api/v1/customers`

### Query Parameters
- `status` (optional): Filter by customer status (`new`, `quoted`, `scheduled`, `completed`, `inactive`, `blacklisted`)
- `customer_type` (optional): Filter by customer type (`residential`, `commercial`, `industrial`, `government`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sort_by` (optional): Sort field (default: `created_at`)
- `sort_order` (optional): Sort order (`asc`, `desc`)

### Example Request
```
GET /api/v1/customers?status=new&customer_type=residential&page=1&limit=10&sort_by=name&sort_order=asc
```

### Response
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": 1,
        "business_id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "555-0123",
        "address": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "zip_code": "12345",
        "customer_type": "residential",
        "status": "new",
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

## 2. Get Single Customer
**GET** `/api/v1/customers/:id`

### Path Parameters
- `id`: Customer ID

### Response
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": 1,
      "business_id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-0123",
      "address": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zip_code": "12345",
      "customer_type": "residential",
      "status": "new",
      "created_at": "2024-01-10T10:30:00.000Z",
      "updated_at": "2024-01-10T10:30:00.000Z"
    }
  },
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 3. Create Customer
**POST** `/api/v1/customers`

### Request Body
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "555-0123",
  "address": "123 Main St",
  "city": "Anytown",
  "state": "CA",
  "zip_code": "12345",
  "customer_type": "residential",
  "status": "new"
}
```

### Required Fields
- `name` (string, 2-255 chars): Customer name
- `email` (string, valid email): Customer email address
- `phone` (string, valid phone): Customer phone number
- `address` (string, 5-255 chars): Customer address
- `city` (string, 2-100 chars): Customer city
- `state` (string, 2 chars): Customer state (US state code)
- `zip_code` (string, valid US zip): Customer zip code

### Optional Fields
- `customer_type` (string): Customer type (`residential`, `commercial`, `industrial`, `government`)
- `status` (string): Customer status (`new`, `quoted`, `scheduled`, `completed`, `inactive`, `blacklisted`)

### Response
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": 1,
      "business_id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-0123",
      "address": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zip_code": "12345",
      "customer_type": "residential",
      "status": "new",
      "created_at": "2024-01-10T10:30:00.000Z",
      "updated_at": "2024-01-10T10:30:00.000Z"
    }
  },
  "message": "Customer created successfully",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 4. Update Customer
**PUT** `/api/v1/customers/:id`

### Path Parameters
- `id`: Customer ID

### Request Body
```json
{
  "name": "John Smith",
  "email": "johnsmith@example.com",
  "phone": "555-0456",
  "status": "quoted"
}
```

### Updatable Fields
- `name` (string, 2-255 chars)
- `email` (string, valid email)
- `phone` (string, valid phone)
- `address` (string, 5-255 chars)
- `city` (string, 2-100 chars)
- `state` (string, 2 chars)
- `zip_code` (string, valid US zip)
- `customer_type` (string)
- `status` (string)

### Response
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": 1,
      "business_id": 1,
      "name": "John Smith",
      "email": "johnsmith@example.com",
      "phone": "555-0456",
      "address": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zip_code": "12345",
      "customer_type": "residential",
      "status": "quoted",
      "created_at": "2024-01-10T10:30:00.000Z",
      "updated_at": "2024-01-10T11:00:00.000Z"
    }
  },
  "message": "Customer updated successfully",
  "timestamp": "2024-01-10T11:00:00.000Z"
}
```

---

## 5. Delete Customer
**DELETE** `/api/v1/customers/:id`

### Path Parameters
- `id`: Customer ID

### Response
```json
{
  "success": true,
  "message": "Customer deleted successfully",
  "timestamp": "2024-01-10T11:00:00.000Z"
}
```

**Note**: Customer cannot be deleted if they have associated jobs.

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Customer name is required"
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
  "message": "Customer not found",
  "error": "CUSTOMER_NOT_FOUND",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

### Customer Exists Error (400)
```json
{
  "success": false,
  "message": "Customer with this email already exists",
  "error": "CUSTOMER_EXISTS",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

### Customer Has Jobs Error (409)
```json
{
  "success": false,
  "message": "Cannot delete customer with associated jobs",
  "error": "CUSTOMER_HAS_JOBS",
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

### Customer Types
- `residential`: Residential customers
- `commercial`: Commercial customers
- `industrial`: Industrial customers
- `government`: Government customers

### Customer Status
- `new`: New customer
- `quoted`: Customer has been quoted
- `scheduled`: Customer has scheduled jobs
- `completed`: Customer has completed jobs
- `inactive`: Inactive customer
- `blacklisted`: Blacklisted customer

### Phone Number Format
- Must be a valid phone number
- Can include country code with +
- Examples: `555-0123`, `+15550123`, `15550123`

### Zip Code Format
- Must be a valid US zip code
- Can be 5 digits or 5+4 format
- Examples: `12345`, `12345-6789`

### State Format
- Must be exactly 2 characters
- US state abbreviation
- Examples: `CA`, `NY`, `TX`

---

## Troubleshooting

### Common Issues

#### 1. Authentication Error: "Access denied. No token provided"
**Error**: `{"success":false,"message":"Access denied. No token provided.","error":"AUTHENTICATION_FAILED"}`

**Solution**: 
- Make sure you're including the Authorization header in your request
- Get a valid JWT token by authenticating first
- Include the token in the format: `Authorization: Bearer <your_token>`

#### 2. Validation Error: "Customer name is required"
**Error**: `{"success":false,"message":"Validation failed","errors":[{"field":"name","message":"Customer name is required"}]}`

**Solution**: 
- Make sure all required fields are included in your request
- Check field validation rules (min/max lengths, formats)
- Ensure email is valid and phone number follows the correct format

#### 3. Customer Exists Error
**Error**: `{"success":false,"message":"Customer with this email already exists","error":"CUSTOMER_EXISTS"}`

**Solution**: 
- Check if a customer with this email already exists
- Use a different email address or update the existing customer

#### 4. CORS Error
**Error**: Browser console shows CORS policy blocking the request

**Solution**: 
- Make sure your frontend is running on one of the allowed ports
- Check that your API server is running and CORS is configured properly

### Quick Test Commands

#### Test Authentication (replace with your actual token):
```bash
curl -X GET http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Test Customer Creation (replace with your actual token):
```bash
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "email": "test@example.com",
    "phone": "555-0123",
    "address": "123 Test St",
    "city": "Test City",
    "state": "CA",
    "zip_code": "12345"
  }'
```

#### Test Customer Update (replace with your actual token and customer ID):
```bash
curl -X PUT http://localhost:3000/api/v1/customers/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Customer Name", "status": "quoted"}'
```
