# Estimates API Documentation

A comprehensive REST API for managing estimates, client requests, pricing, and templates for junk removal services.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MySQL 8.0+
- JWT authentication setup

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migration
npm run migrate:estimates

# Start the server
npm start
```

### Environment Variables
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_DATABASE=junk_removal_db
JWT_SECRET=your_jwt_secret
```

## 📋 Base Configuration

### Base URL
```
https://api.junkremoval.com/api/v1/estimates
```

### Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### Response Format
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔐 Authentication & Authorization

### Required Roles
- **admin**: Full access to all endpoints
- **manager**: Access to most endpoints, limited deletion
- **sales**: Access to create/update estimates and client requests
- **viewer**: Read-only access to estimates and reports

### JWT Token
```bash
curl -H "Authorization: Bearer <your_jwt_token>" \
     https://api.junkremoval.com/api/v1/estimates/health
```

## 📊 Core Endpoints

### 1. Client Requests

#### Get All Client Requests
```http
GET /client-requests?page=1&limit=20&status=pending&type=service
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search by name, email, or phone
- `status` (optional): Filter by status
- `type` (optional): Filter by service type
- `priority` (optional): Filter by priority
- `date_from` (optional): Filter from date (ISO format)
- `date_to` (optional): Filter to date (ISO format)
- `sort_by` (optional): Sort field (default: created_at)
- `sort_order` (optional): Sort direction (asc/desc, default: desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "client_requests": [
      {
        "id": "uuid",
        "customer_name": "John Doe",
        "customer_email": "john@example.com",
        "service_type": "service",
        "status": "pending",
        "priority": "medium",
        "location": "123 Main St, City, ST",
        "estimated_value": 500,
        "requested_date": "2024-01-15",
        "created": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    },
    "summary": {
      "total_requests": 100,
      "pending_requests": 25,
      "total_potential_value": 50000
    }
  }
}
```

#### Get Client Request by ID
```http
GET /client-requests/{id}
```

#### Create Client Request
```http
POST /client-requests
```

**Request Body:**
```json
{
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "555-123-4567",
  "service_address": "123 Main Street",
  "city": "Anytown",
  "state": "CA",
  "zip_code": "12345",
  "type": "service",
  "priority": "medium",
  "subject": "House Cleanout Needed",
  "description": "Need to clean out entire house before moving",
  "requested_date": "2024-01-15",
  "preferred_date": "2024-01-20",
  "approximate_volume": "2-3 truckloads",
  "material_types": ["furniture", "electronics", "clothing"],
  "hazardous_material": false,
  "heavy_lifting_required": true
}
```

#### Update Client Request
```http
PUT /client-requests/{id}
```

#### Delete Client Request
```http
DELETE /client-requests/{id}
```
*Soft delete - sets status to 'cancelled'*

### 2. Estimates

#### Get All Estimates
```http
GET /?page=1&limit=20&status=sent&date_from=2024-01-01
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `search`: Search by customer name or estimate ID
- `status`: Filter by status (draft, sent, accepted, rejected, expired, converted)
- `client_request_id`: Filter by client request ID
- `date_from`, `date_to`: Date range filtering
- `min_total`, `max_total`: Total amount filtering
- `sort_by`: Sort field (created_at, sent_date, expiry_date, total, customer_name)
- `sort_order`: Sort direction (asc/desc)

#### Get Estimate by ID
```http
GET /{id}
```

#### Create Estimate
```http
POST /
```

**Request Body:**
```json
{
  "client_request_id": "uuid",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "555-123-4567",
  "address": "123 Main Street",
  "city": "Anytown",
  "state": "CA",
  "zip_code": "12345",
  "labor_hours": 4.5,
  "labor_rate": 50.00,
  "items": [
    {
      "name": "General Waste Removal",
      "category": "General Waste",
      "quantity": 2,
      "base_price": 150.00,
      "price_per_unit": 75.00,
      "difficulty": "medium",
      "estimated_time": 2.0,
      "description": "Household waste and debris"
    }
  ],
  "additional_fees": [
    {
      "fee_type": "travel",
      "description": "Travel fee for distance",
      "amount": 25.00
    }
  ],
  "expiry_date": "2024-02-15",
  "terms_conditions": "Standard terms apply",
  "payment_terms": "Net 30"
}
```

#### Update Estimate
```http
PUT /{id}
```

#### Send Estimate
```http
POST /{id}/send
```

**Request Body:**
```json
{
  "send_method": "email",
  "email_template": "standard",
  "additional_message": "Please review and let us know if you have any questions.",
  "cc_emails": ["manager@company.com"]
}
```

#### Update Estimate Status
```http
PUT /{id}/status
```

**Request Body:**
```json
{
  "status": "accepted",
  "status_notes": "Customer accepted the estimate",
  "accepted_date": "2024-01-20"
}
```

### 3. Estimate Items

#### Add Estimate Item
```http
POST /{id}/items
```

#### Update Estimate Item
```http
PUT /{id}/items/{itemId}
```

#### Delete Estimate Item
```http
DELETE /{id}/items/{itemId}
```

### 4. Additional Fees

#### Add Additional Fee
```http
POST /{id}/fees
```

#### Update Additional Fee
```http
PUT /{id}/fees/{feeId}
```

#### Delete Additional Fee
```http
DELETE /{id}/fees/{feeId}
```

## 🎯 Estimate Templates

### Get All Templates
```http
GET /templates
```

### Get Template by ID
```http
GET /templates/{id}
```

### Create Template
```http
POST /templates
```

**Request Body:**
```json
{
  "name": "Standard Residential Cleanout",
  "description": "Template for typical residential cleanout projects",
  "category": "residential",
  "items": [
    {
      "name": "General Waste",
      "category": "General Waste",
      "quantity": 1,
      "base_price": 150.00,
      "price_per_unit": 150.00,
      "difficulty": "medium",
      "estimated_time": 2.0
    }
  ]
}
```

### Update Template
```http
PUT /templates/{id}
```

### Delete Template
```http
DELETE /templates/{id}
```

### Create Estimate from Template
```http
POST /from-template
```

**Request Body:**
```json
{
  "template_id": "uuid",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "555-123-4567",
  "address": "123 Main Street",
  "city": "Anytown",
  "state": "CA",
  "zip_code": "12345",
  "customizations": {
    "items": [
      {
        "name": "Custom Item",
        "category": "Custom",
        "quantity": 1,
        "unit_price": 100.00
      }
    ]
  },
  "expiry_date": "2024-02-15"
}
```

## 💰 Pricing Management

### Pricing Items

#### Get All Pricing Items
```http
GET /pricing/items?category=General Waste&is_active=true
```

**Query Parameters:**
- `category`: Filter by category
- `is_active`: Filter by active status
- `search`: Search by name or description
- `difficulty`: Filter by difficulty level

#### Get Pricing Item by ID
```http
GET /pricing/items/{id}
```

#### Create Pricing Item
```http
POST /pricing/items
```

**Request Body:**
```json
{
  "name": "General Waste Removal",
  "category": "uuid",
  "base_price": 150.00,
  "price_per_unit": 75.00,
  "unit_type": "bag",
  "estimated_time": 2.0,
  "difficulty": "medium",
  "description": "General household and office waste",
  "volume_weight": 800.00,
  "volume_yardage": 12.00
}
```

#### Update Pricing Item
```http
PUT /pricing/items/{id}
```

#### Delete Pricing Item
```http
DELETE /pricing/items/{id}
```

#### Bulk Update Pricing Items
```http
PUT /pricing/items/bulk-update
```

**Request Body:**
```json
{
  "updates": [
    {
      "id": "uuid1",
      "base_price": 160.00
    },
    {
      "id": "uuid2",
      "base_price": 170.00
    }
  ]
}
```

### Pricing Categories

#### Get All Categories
```http
GET /pricing/categories
```

#### Get Category by ID
```http
GET /pricing/categories/{id}
```

#### Create Category
```http
POST /pricing/categories
```

**Request Body:**
```json
{
  "name": "General Waste",
  "description": "Household and office waste materials",
  "color": "#3B82F6",
  "icon": "trash",
  "sort_order": 1
}
```

#### Update Category
```http
PUT /pricing/categories/{id}
```

#### Delete Category
```http
DELETE /pricing/categories/{id}
```

#### Reorder Categories
```http
PUT /pricing/categories/reorder
```

**Request Body:**
```json
{
  "category_orders": [
    {
      "id": "uuid1",
      "sort_order": 1
    },
    {
      "id": "uuid2",
      "sort_order": 2
    }
  ]
}
```

## 📈 Reports & Analytics

### Summary Report
```http
GET /reports/summary?date_from=2024-01-01&date_to=2024-01-31&status=sent
```

**Query Parameters:**
- `date_from`, `date_to`: Required date range (ISO format)
- `status`: Filter by estimate status
- `service_type`: Filter by service type
- `format`: Response format (json/pdf, default: json)

**Response:**
```json
{
  "success": true,
  "data": {
    "report_period": {
      "date_from": "2024-01-01",
      "date_to": "2024-01-31"
    },
    "summary": {
      "total_estimates": 150,
      "total_value": 75000,
      "average_value": 500,
      "min_value": 100,
      "max_value": 2000
    },
    "status_breakdown": {
      "draft": 20,
      "sent": 80,
      "accepted": 30,
      "rejected": 15,
      "expired": 5
    },
    "conversion_rates": {
      "acceptance_rate": "37.5",
      "conversion_rate": "100.0",
      "overall_conversion_rate": "37.5"
    },
    "monthly_trends": [...],
    "top_categories": [...],
    "insights": [...]
  }
}
```

### Performance Report
```http
GET /reports/performance?date_from=2024-01-01&date_to=2024-01-31
```

**Response includes:**
- Performance metrics (acceptance rates, value analysis)
- Response time metrics
- Lifecycle metrics
- Customer behavior analysis
- Actionable recommendations

### Insights Report
```http
GET /reports/insights?date_from=2024-01-01&date_to=2024-01-31
```

**Response includes:**
- Trend analysis and growth rates
- Seasonal patterns
- Pricing insights and competitive analysis
- Customer insights and segmentation
- Actionable business insights

## 🔧 Error Handling

### Common Error Codes
- `CLIENT_REQUEST_NOT_FOUND`: Client request not found
- `ESTIMATE_NOT_FOUND`: Estimate not found
- `TEMPLATE_NOT_FOUND`: Estimate template not found
- `PRICING_ITEM_NOT_FOUND`: Pricing item not found
- `CATEGORY_NOT_FOUND`: Pricing category not found
- `INVALID_CATEGORY`: Invalid pricing category
- `DUPLICATE_CATEGORY_NAME`: Category name already exists
- `CATEGORY_HAS_ITEMS`: Cannot delete category with items
- `TEMPLATE_IN_USE`: Cannot delete template in use
- `PRICING_ITEM_IN_USE`: Cannot delete pricing item in use
- `INVALID_UPDATE_DATA`: No valid fields to update

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

## 📊 Rate Limiting

Rate limiting is implemented to prevent abuse:
- **General endpoints**: 100 requests per minute per IP
- **Report endpoints**: 20 requests per minute per IP
- **Bulk operations**: 10 requests per minute per IP

## 🧪 Testing

### Test Script
```bash
npm run test:estimates
```

### Manual Testing
```bash
# Test health endpoint
curl https://api.junkremoval.com/api/v1/estimates/health

# Test with authentication
curl -H "Authorization: Bearer <token>" \
     https://api.junkremoval.com/api/v1/estimates/client-requests
```

## 🔗 Integration Features

### Webhook Support
- Estimate status changes
- New client requests
- Estimate acceptance/rejection

### Email Integration
- Estimate sending
- Follow-up reminders
- Status notifications

### PDF Generation
- Estimate documents
- Reports (coming soon)

## 🚀 Lead Management Features

### Client Request Management
- **Portal Integration**: Customer self-service portal
- **Request Tracking**: Full lifecycle management
- **Status Updates**: Real-time status tracking
- **Communication**: Integrated messaging system

### Estimate Lifecycle
- **Creation**: From scratch or templates
- **Customization**: Item and fee management
- **Sending**: Multiple delivery methods
- **Tracking**: Status and response monitoring
- **Conversion**: To jobs and invoices

### Pricing Management
- **Category Organization**: Hierarchical pricing structure
- **Item Management**: Comprehensive pricing catalog
- **Bulk Operations**: Efficient mass updates
- **Template Integration**: Reusable pricing structures

### Reporting & Analytics
- **Summary Reports**: High-level overview
- **Performance Metrics**: Conversion rates and trends
- **Business Insights**: Actionable recommendations
- **Customer Analysis**: Behavior and segmentation

## 📚 Additional Resources

- [API Changelog](./CHANGELOG.md)
- [Database Schema](./database-schema.md)
- [Authentication Guide](./auth-guide.md)
- [Rate Limiting Details](./rate-limiting.md)
- [Webhook Configuration](./webhooks.md)

## 🤝 Support

For technical support or questions:
- **Email**: api-support@junkremoval.com
- **Documentation**: https://docs.junkremoval.com
- **Status Page**: https://status.junkremoval.com
