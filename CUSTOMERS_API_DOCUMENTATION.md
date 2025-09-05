# Customers API Documentation

## Base URL
```
/api/v1/customers
```

## Authentication
All customer endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### 1. Get All Customers
**GET** `/api/v1/customers`

Retrieves a paginated list of customers for the authenticated business.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter by customer status |
| `customer_type` | string | - | Filter by customer type |
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 20 | Number of items per page |
| `sort_by` | string | 'created_at' | Field to sort by |
| `sort_order` | string | 'desc' | Sort order (asc/desc) |

#### Valid Status Values
- `new`
- `quoted`
- `scheduled`
- `completed`
- `inactive`
- `blacklisted`

#### Valid Customer Type Values
- `residential`
- `commercial`
- `industrial`
- `government`

#### Request Example
```javascript
GET /api/v1/customers?status=new&customer_type=residential&page=1&limit=10&sort_by=name&sort_order=asc
```

#### Response
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": 1,
        "business_id": 1,
        "name": "John Doe",
        "email": "john.doe@example.com",
        "phone": "5551234567",
        "address": "123 Main St",
        "city": "Anytown",
        "state": "CA",
        "zip_code": "12345",
        "customer_type": "residential",
        "status": "new",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 100,
      "items_per_page": 20
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Get Single Customer
**GET** `/api/v1/customers/:id`

Retrieves a specific customer by ID.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Customer ID |

#### Request Example
```javascript
GET /api/v1/customers/1
```

#### Success Response
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": 1,
      "business_id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "5551234567",
      "address": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zip_code": "12345",
      "customer_type": "residential",
      "status": "new",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Error Response (404)
```json
{
  "success": false,
  "message": "Customer not found",
  "error": "CUSTOMER_NOT_FOUND",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 3. Create Customer
**POST** `/api/v1/customers`

Creates a new customer for the authenticated business.

#### Request Body
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "5551234567",
  "address": "123 Main St",
  "city": "Anytown",
  "state": "CA",
  "zip_code": "12345",
  "customer_type": "residential",
  "status": "new"
}
```

#### Field Validation Rules
| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| `name` | string | Yes | 2-255 characters |
| `email` | string | Yes | Valid email format |
| `phone` | string | Yes | Valid phone number pattern |
| `address` | string | Yes | 5-255 characters |
| `city` | string | Yes | 2-100 characters |
| `state` | string | Yes | Exactly 2 characters |
| `zip_code` | string | Yes | Valid US zip code (12345 or 12345-6789) |
| `customer_type` | string | No | One of: residential, commercial, industrial, government |
| `status` | string | No | One of: new, quoted, scheduled, completed, inactive, blacklisted |

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": 1,
      "business_id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "5551234567",
      "address": "123 Main St",
      "city": "Anytown",
      "state": "CA",
      "zip_code": "12345",
      "customer_type": "residential",
      "status": "new",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  },
  "message": "Customer created successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Error Response (400) - Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    },
    {
      "field": "phone",
      "message": "Phone must be a valid phone number"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Error Response (400) - Duplicate Email
```json
{
  "success": false,
  "message": "Customer with this email already exists",
  "error": "CUSTOMER_EXISTS",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 4. Update Customer
**PUT** `/api/v1/customers/:id`

Updates an existing customer. All fields are optional in the request body.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Customer ID |

#### Request Body
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com",
  "phone": "5559876543",
  "address": "456 Oak Ave",
  "city": "Newtown",
  "state": "NY",
  "zip_code": "54321",
  "customer_type": "commercial",
  "status": "quoted"
}
```

#### Success Response
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": 1,
      "business_id": 1,
      "name": "John Smith",
      "email": "john.smith@example.com",
      "phone": "5559876543",
      "address": "456 Oak Ave",
      "city": "Newtown",
      "state": "NY",
      "zip_code": "54321",
      "customer_type": "commercial",
      "status": "quoted",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T11:45:00.000Z"
    }
  },
  "message": "Customer updated successfully",
  "timestamp": "2024-01-15T11:45:00.000Z"
}
```

#### Error Response (404)
```json
{
  "success": false,
  "message": "Customer not found",
  "error": "CUSTOMER_NOT_FOUND",
  "timestamp": "2024-01-15T11:45:00.000Z"
}
```

#### Error Response (400) - No Valid Fields
```json
{
  "success": false,
  "message": "No valid fields to update",
  "error": "NO_VALID_FIELDS",
  "timestamp": "2024-01-15T11:45:00.000Z"
}
```

---

### 5. Delete Customer
**DELETE** `/api/v1/customers/:id`

Deletes a customer. Cannot delete customers with associated jobs.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | number | Yes | Customer ID |

#### Request Example
```javascript
DELETE /api/v1/customers/1
```

#### Success Response
```json
{
  "success": true,
  "message": "Customer deleted successfully",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

#### Error Response (404)
```json
{
  "success": false,
  "message": "Customer not found",
  "error": "CUSTOMER_NOT_FOUND",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

#### Error Response (409) - Customer Has Jobs
```json
{
  "success": false,
  "message": "Cannot delete customer with associated jobs",
  "error": "CUSTOMER_HAS_JOBS",
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `CUSTOMER_NOT_FOUND` | Customer with specified ID does not exist or doesn't belong to the business |
| `CUSTOMER_EXISTS` | Customer with the same email already exists |
| `CUSTOMER_HAS_JOBS` | Cannot delete customer because they have associated jobs |
| `NO_VALID_FIELDS` | No valid fields provided for update |
| `RATE_LIMIT_EXCEEDED` | Too many requests from this IP |

---

## Frontend Usage Examples

### JavaScript/Fetch API
```javascript
// Get all customers
const getCustomers = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/v1/customers?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Create customer
const createCustomer = async (customerData) => {
  const response = await fetch('/api/v1/customers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(customerData)
  });
  return response.json();
};

// Update customer
const updateCustomer = async (id, updateData) => {
  const response = await fetch(`/api/v1/customers/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updateData)
  });
  return response.json();
};

// Delete customer
const deleteCustomer = async (id) => {
  const response = await fetch(`/api/v1/customers/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1/customers',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get all customers
const getCustomers = (filters) => api.get('/', { params: filters });

// Get single customer
const getCustomer = (id) => api.get(`/${id}`);

// Create customer
const createCustomer = (data) => api.post('/', data);

// Update customer
const updateCustomer = (id, data) => api.put(`/${id}`, data);

// Delete customer
const deleteCustomer = (id) => api.delete(`/${id}`);
```

---

## Notes

1. **Business Isolation**: All customer operations are automatically scoped to the authenticated business user.

2. **Email Uniqueness**: Email addresses must be unique within each business.

3. **Soft Delete Prevention**: Customers with associated jobs cannot be deleted to maintain data integrity.

4. **Pagination**: The list endpoint supports pagination with configurable page size and sorting.

5. **Validation**: All input data is validated using Joi schemas with detailed error messages.

6. **Timestamps**: All responses include ISO 8601 timestamps for tracking and debugging.