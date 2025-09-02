# Customers API Documentation

This document outlines the complete REST API endpoints for the Customers tab functionality in your junk removal management system. Built with Node.js, Express, and MySQL.

## 🚀 Quick Start

### 1. Run Database Migration
```bash
# Create all customer-related tables
node scripts/customers-migration.js
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
curl http://localhost:3000/api/v1/customers/health

# Get all customers (requires JWT token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/v1/customers
```

## 📋 Table of Contents

- [Base Configuration](#base-configuration)
- [Core Customer Endpoints](#core-customer-endpoints)
- [Customer Contacts](#customer-contacts)
- [Customer Addresses](#customer-addresses)
- [Customer Tags](#customer-tags)
- [Customer Notes](#customer-notes)
- [Customer Communications](#customer-communications)
- [Customer Preferences](#customer-preferences)
- [Customer Service History](#customer-service-history)
- [Customer Reports](#customer-reports)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Testing Examples](#testing-examples)

## 🔧 Base Configuration

### Base URL
```
http://localhost:3000/api/v1/customers
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

## 👥 Core Customer Endpoints

### 1. Get All Customers
**GET** `/customers`

Retrieve all customers with optional filtering, sorting, and pagination.

**Query Parameters:**
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Number of items per page (default: 20, max: 100)
- `search` (string): Search term for customer name, email, or phone
- `status` (string): Filter by customer status
- `customer_type` (string): Filter by customer type
- `city` (string): Filter by city
- `state` (string): Filter by state
- `sort_by` (string): Sort field (default: 'name')
- `sort_order` (string): Sort order - 'asc' or 'desc' (default: 'asc')
- `include_inactive` (boolean): Include inactive customers (default: false)

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/v1/customers?page=1&limit=20&status=active&customer_type=commercial&sort_by=name&sort_order=asc"
```

**Example Response:**
```json
{
  "success": true,
  "message": "Customers retrieved successfully",
  "data": {
    "customers": [
      {
        "id": "cust-1",
        "name": "Downtown Office Complex",
        "customer_type": "commercial",
        "status": "active",
        "primary_contact": {
          "email": "john.smith@downtownoffice.com",
          "phone": "555-0100"
        },
        "primary_address": {
          "street": "321 Commerce St",
          "city": "Wilmington",
          "state": "NC",
          "zip_code": "28401"
        },
        "total_jobs": 45,
        "total_spent": 12500.00,
        "last_job_date": "2024-01-10",
        "created": "2023-06-15T10:30:00.000Z",
        "updated": "2024-01-10T15:45:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "pages": 8
    },
    "summary": {
      "total_customers": 156,
      "active_customers": 142,
      "commercial_customers": 89,
      "residential_customers": 67,
      "total_revenue": 450000.00
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Get Customer by ID
**GET** `/customers/:id`

Retrieve a specific customer by ID with all related information.

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/v1/customers/cust-1"
```

**Example Response:**
```json
{
  "success": true,
  "message": "Customer retrieved successfully",
  "data": {
    "customer": {
      "id": "cust-1",
      "name": "Downtown Office Complex",
      "customer_type": "commercial",
      "status": "active",
      "company_details": {
        "legal_name": "Downtown Office Complex LLC",
        "industry": "Real Estate",
        "employee_count": 150
      },
      "contacts": [...],
      "addresses": [...],
      "tags": [...],
      "preferences": {...},
      "service_history": {...}
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 3. Create New Customer
**POST** `/customers`

Create a new customer with all required information.

**Required Role:** `admin`, `manager`, `sales`

**Example Request:**
```bash
curl -X POST -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Riverside Apartments",
    "email": "info@riversideapts.com",
    "phone": "555-0200",
    "address": "456 River Rd",
    "city": "Wilmington",
    "state": "NC",
    "zip_code": "28403",
    "customer_type": "commercial",
    "contacts": [
      {
        "first_name": "Sarah",
        "last_name": "Johnson",
        "title": "Property Manager",
        "email": "sarah.johnson@riversideapts.com",
        "phone": "555-0200",
        "is_primary_contact": true
      }
    ]
  }' \
  "http://localhost:3000/api/v1/customers"
```

### 4. Update Customer
**PUT** `/customers/:id`

Update an existing customer by ID.

**Required Role:** `admin`, `manager`, `sales`

**Example Request:**
```bash
curl -X PUT -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Riverside Apartments",
    "status": "active"
  }' \
  "http://localhost:3000/api/v1/customers/cust-2"
```

### 5. Delete Customer
**DELETE** `/customers/:id`

Delete a customer by ID (soft delete - sets status to 'blacklisted').

**Required Role:** `admin`, `manager`

### 6. Search Customers
**GET** `/customers/search`

Advanced customer search with multiple criteria.

**Query Parameters:**
- `q` (string): Search query (required)
- `search_fields` (string): Comma-separated fields to search
- `customer_type` (string): Filter by customer type
- `status` (string): Filter by status
- `city` (string): Filter by city
- `state` (string): Filter by state
- `min_total_spent` (number): Minimum total amount spent
- `max_total_spent` (number): Maximum total amount spent

**Example Request:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3000/api/v1/customers/search?q=office&search_fields=name,address&customer_type=commercial"
```

## 📞 Customer Contacts

### 7. Get Customer Contacts
**GET** `/customers/:id/contacts`

Get all contacts for a specific customer.

### 8. Add Customer Contact
**POST** `/customers/:id/contacts`

Add a new contact to an existing customer.

**Required Role:** `admin`, `manager`, `sales`

### 9. Update Customer Contact
**PUT** `/customers/:id/contacts/:contactId`

Update an existing contact for a customer.

**Required Role:** `admin`, `manager`, `sales`

### 10. Delete Customer Contact
**DELETE** `/customers/:id/contacts/:contactId`

Delete a contact from a customer.

**Required Role:** `admin`, `manager`, `sales`

## 🏠 Customer Addresses

### 11. Get Customer Addresses
**GET** `/customers/:id/addresses`

Get all addresses for a specific customer.

### 12. Add Customer Address
**POST** `/customers/:id/addresses`

Add a new address to an existing customer.

**Required Role:** `admin`, `manager`, `sales`

## 🏷️ Customer Tags

### 13. Get Customer Tags
**GET** `/customers/:id/tags`

Get all tags assigned to a specific customer.

### 14. Assign Tag to Customer
**POST** `/customers/:id/tags`

Assign a tag to a customer.

**Required Role:** `admin`, `manager`, `sales`

### 15. Remove Tag from Customer
**DELETE** `/customers/:id/tags/:tagId`

Remove a tag from a customer.

**Required Role:** `admin`, `manager`, `sales`

### Tag Management (Admin Only)
- **GET** `/customers/tags/available` - Get all available tags
- **POST** `/customers/tags` - Create a new tag
- **PUT** `/customers/tags/:tagId` - Update a tag
- **DELETE** `/customers/tags/:tagId` - Delete a tag

## 📝 Customer Notes

### 16. Get Customer Notes
**GET** `/customers/:id/notes`

Get all notes for a specific customer.

**Query Parameters:**
- `note_type` (string): Filter by note type
- `created_by` (string): Filter by user who created the note
- `date_from` (date): Filter notes from this date
- `date_to` (date): Filter notes to this date

### 17. Add Customer Note
**POST** `/customers/:id/notes`

Add a new note to a customer.

**Required Role:** `admin`, `manager`, `sales`, `driver`

### Note Management
- **PUT** `/customers/:id/notes/:noteId` - Update customer note
- **DELETE** `/customers/:id/notes/:noteId` - Delete customer note
- **PATCH** `/customers/:id/notes/:noteId/complete` - Mark note as completed

## 📞 Customer Communications

### 18. Get Customer Communications
**GET** `/customers/:id/communications`

Get all communications with a specific customer.

**Query Parameters:**
- `communication_type` (string): Filter by type
- `direction` (string): Filter by direction (inbound/outbound)
- `date_from` (date): Filter communications from this date
- `date_to` (date): Filter communications to this date

### 19. Log Customer Communication
**POST** `/customers/:id/communications`

Log a new communication with a customer.

**Required Role:** `admin`, `manager`, `sales`, `driver`

### Communication Management
- **PUT** `/customers/:id/communications/:communicationId` - Update communication
- **DELETE** `/customers/:id/communications/:communicationId` - Delete communication
- **PATCH** `/customers/:id/communications/:communicationId/complete` - Mark as completed

## ⚙️ Customer Preferences

### 20. Get Customer Preferences
**GET** `/customers/:id/preferences`

Get customer preferences and settings.

### 21. Update Customer Preferences
**PUT** `/customers/:id/preferences`

Update customer preferences and settings.

**Required Role:** `admin`, `manager`, `sales`

### Preference Management
- **POST** `/customers/:id/preferences` - Create single preference
- **PUT** `/customers/:id/preferences/:preferenceId` - Update single preference
- **DELETE** `/customers/:id/preferences/:preferenceId` - Delete single preference

## 📊 Customer Service History

### 22. Get Customer Service History
**GET** `/customers/:id/service-history`

Get detailed service history for a specific customer.

**Query Parameters:**
- `date_from` (date): Filter services from this date
- `date_to` (date): Filter services to this date
- `service_type` (string): Filter by service type
- `status` (string): Filter by service status
- `page` (number): Page number for pagination
- `limit` (number): Number of items per page

### Service History Management
- **POST** `/customers/:id/service-history` - Create service history entry
- **PUT** `/customers/:id/service-history/:serviceHistoryId` - Update service history entry
- **DELETE** `/customers/:id/service-history/:serviceHistoryId` - Delete service history entry

## 📈 Customer Reports

### 23. Get Customer Summary Report
**GET** `/customers/reports/summary`

Get a summary report of all customers with analytics.

**Required Role:** `admin`, `manager`

**Query Parameters:**
- `date_from` (date): Start date for report
- `date_to` (date): End date for report
- `customer_type` (string): Filter by customer type
- `status` (string): Filter by customer status
- `format` (string): 'json' or 'pdf'

### Additional Reports
- **GET** `/customers/reports/analytics` - Get customer analytics dashboard data
- **GET** `/customers/reports/export` - Export customers data
- **GET** `/customers/reports/insights` - Get customer insights and recommendations

## 🚨 Error Codes

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
- `CUSTOMER_NOT_FOUND` - Customer with specified ID not found
- `DUPLICATE_CUSTOMER` - Customer with same email/phone already exists
- `INVALID_CUSTOMER_TYPE` - Invalid customer type specified
- `CONTACT_NOT_FOUND` - Contact with specified ID not found
- `ADDRESS_NOT_FOUND` - Address with specified ID not found
- `TAG_NOT_FOUND` - Tag with specified ID not found
- `NOTE_NOT_FOUND` - Note with specified ID not found
- `COMMUNICATION_NOT_FOUND` - Communication with specified ID not found
- `PREFERENCE_NOT_FOUND` - Preference with specified ID not found
- `SERVICE_HISTORY_NOT_FOUND` - Service history entry not found
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions

## 🚦 Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **General endpoints**: 100 requests per minute per IP
- **Search endpoints**: 50 requests per minute per IP
- **Report endpoints**: 20 requests per minute per IP

## 🧪 Testing Examples

### Test Environment Setup
```bash
# Set environment variables
export DB_HOST=localhost
export DB_USER=root
export DB_PASSWORD=your_password
export DB_DATABASE=junk_removal_db
export JWT_SECRET=your_jwt_secret

# Run migration
node scripts/customers-migration.js

# Start server
npm run dev
```

### Sample Test Data
```bash
# Create test customer
curl -X POST http://localhost:3000/api/v1/customers \
  -H "Authorization: Bearer test_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Office Complex",
    "email": "test@officecomplex.com",
    "phone": "555-9999",
    "address": "123 Test St",
    "city": "Test City",
    "state": "NC",
    "zip_code": "28401",
    "customer_type": "commercial"
  }'

# Search customers
curl -X GET "http://localhost:3000/api/v1/customers/search?q=office" \
  -H "Authorization: Bearer test_token"

# Get customer summary report
curl -X GET "http://localhost:3000/api/v1/customers/reports/summary" \
  -H "Authorization: Bearer test_token"
```

### JWT Token Testing
```bash
# Login to get JWT token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Use the returned token in subsequent requests
export JWT_TOKEN="your_jwt_token_here"

curl -H "Authorization: Bearer $JWT_TOKEN" \
  "http://localhost:3000/api/v1/customers"
```

## 🔐 Role-Based Access Control

### Admin Role
- Full access to all endpoints
- Can create, update, and delete tags
- Can access all reports and analytics

### Manager Role
- Full access to customer management
- Can access reports and analytics
- Cannot manage system tags

### Sales Role
- Can create and update customers
- Can manage customer contacts, addresses, and preferences
- Cannot delete customers or access detailed reports

### Driver Role
- Can view customer information
- Can add notes and log communications
- Can create service history entries
- Limited access to customer management

## 📚 Additional Resources

### Database Schema
The complete database schema is defined in `scripts/customers-migration.js` and includes:
- 12 main tables for comprehensive customer management
- Proper foreign key relationships
- Optimized indexes for performance
- Sample data for testing

### Validation Schemas
All input validation is handled by Joi schemas in `validations/customerValidation.js`:
- Comprehensive validation for all endpoints
- Custom error messages
- Type checking and format validation

### Middleware
The API uses several middleware components:
- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Validation**: Request validation using Joi
- **Error Handling**: Centralized error handling
- **Rate Limiting**: API rate limiting

## 🚀 Deployment

### Production Considerations
1. **Environment Variables**: Set all required environment variables
2. **Database**: Use production MySQL instance with proper backups
3. **Security**: Enable HTTPS, set secure JWT secrets
4. **Monitoring**: Implement logging and monitoring
5. **Backup**: Regular database backups and API response logging

### Environment Variables
```bash
# Database
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=your_db_name

# JWT
JWT_SECRET=your_secure_jwt_secret

# Server
PORT=3000
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📞 Support

For questions or issues with the Customers API:
1. Check the API documentation at `/api/v1/customers/docs`
2. Review the health check at `/api/v1/customers/health`
3. Check server logs for detailed error information
4. Verify database connectivity and schema

---

**Version:** 1.0.0  
**Last Updated:** January 2024  
**Maintainer:** Development Team
