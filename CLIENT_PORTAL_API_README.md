# Client Portal API Documentation

This document outlines the complete REST API implementation for the Client Portal functionality in your junk removal management system. Built with Node.js, Express, and MySQL.

## Quick Start

### Prerequisites
- Node.js 16+ 
- MySQL 8.0+
- All dependencies installed (`npm install`)

### Database Setup
```bash
# Run the Client Portal migration
npm run migrate:client-portal

# Or manually
node scripts/client-portal-migration.js
```

### Testing
```bash
# Test the Client Portal API
npm run test:client-portal

# Or manually
node test-client-portal-api.js
```

## Base Configuration

### Base URL
```
http://localhost:3000/api/v1/portal
```

### Authentication
Most endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

**Public endpoints** (no authentication required):
- `POST /auth/login` - User login
- `POST /auth/refresh` - Token refresh

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

## API Endpoints

### 1. Portal Users Management (Admin/Manager Only)

#### Get All Portal Users
- **GET** `/users`
- **Authentication**: Required (Admin/Manager)
- **Query Parameters**: 
  - `page`, `limit`, `search`, `status`, `user_type`, `date_from`, `date_to`, `sort_by`, `sort_order`
- **Response**: Paginated list of portal users with summary statistics

#### Get Portal User by ID
- **GET** `/users/:id`
- **Authentication**: Required (Admin/Manager)
- **Response**: Comprehensive user information including service history and recent activity

#### Create Portal User
- **POST** `/users`
- **Authentication**: Required (Admin only)
- **Body**: User credentials, personal info, preferences
- **Response**: Created user details

#### Update Portal User
- **PUT** `/users/:id`
- **Authentication**: Required (Admin/Manager)
- **Body**: Fields to update
- **Response**: Update confirmation

#### Delete Portal User
- **DELETE** `/users/:id`
- **Authentication**: Required (Admin only)
- **Response**: Soft delete confirmation (status set to 'inactive')

### 2. Portal Authentication

#### User Login
- **POST** `/auth/login`
- **Authentication**: None (Public)
- **Body**: `username` or `email`, `password`
- **Response**: JWT token, user info, refresh token

#### User Logout
- **POST** `/auth/logout`
- **Authentication**: Required
- **Response**: Logout confirmation

#### Refresh Token
- **POST** `/auth/refresh`
- **Authentication**: None (Public)
- **Body**: `refresh_token`
- **Response**: New JWT token

### 3. Service Requests

#### Get All Service Requests
- **GET** `/requests`
- **Authentication**: Required
- **Query Parameters**: `page`, `limit`, `status`, `request_type`, `date_from`, `date_to`, `sort_by`, `sort_order`
- **Response**: Paginated list of user's service requests

#### Get Service Request by ID
- **GET** `/requests/:id`
- **Authentication**: Required
- **Response**: Detailed request information with attachments and status history

#### Create Service Request
- **POST** `/requests`
- **Authentication**: Required
- **Body**: Request details, location, scheduling, materials
- **Response**: Created request confirmation

#### Update Service Request
- **PUT** `/requests/:id`
- **Authentication**: Required
- **Body**: Fields to update
- **Response**: Update confirmation

#### Cancel Service Request
- **PUT** `/requests/:id/cancel`
- **Authentication**: Required
- **Body**: Cancellation reason and notes
- **Response**: Cancellation confirmation

### 4. Job History

#### Get Job History
- **GET** `/jobs`
- **Authentication**: Required
- **Query Parameters**: `page`, `limit`, `status`, `date_from`, `date_to`, `sort_by`, `sort_order`
- **Response**: Paginated list of completed jobs

#### Get Job Details
- **GET** `/jobs/:id`
- **Authentication**: Required
- **Response**: Comprehensive job information including crew, progress, photos

### 5. Invoice Management

#### Get All Invoices
- **GET** `/invoices`
- **Authentication**: Required
- **Query Parameters**: `page`, `limit`, `status`, `date_from`, `date_to`, `sort_by`, `sort_order`
- **Response**: Paginated list of user's invoices

#### Get Invoice Details
- **GET** `/invoices/:id`
- **Authentication**: Required
- **Response**: Detailed invoice with line items and payment history

#### Pay Invoice
- **POST** `/invoices/:id/pay`
- **Authentication**: Required
- **Body**: Payment method, amount, reference
- **Response**: Payment confirmation

### 6. Client Profile

#### Get Client Profile
- **GET** `/profile`
- **Authentication**: Required
- **Response**: Complete profile information including addresses and preferences

#### Update Client Profile
- **PUT** `/profile`
- **Authentication**: Required
- **Body**: Fields to update
- **Response**: Update confirmation

#### Change Password
- **PUT** `/profile/password`
- **Authentication**: Required
- **Body**: Current password, new password, confirmation
- **Response**: Password change confirmation

### 7. Portal Reports

#### Get Service Summary Report
- **GET** `/reports/service-summary`
- **Authentication**: Required
- **Query Parameters**: `date_from`, `date_to`, `format`
- **Response**: Comprehensive service analysis and statistics

#### Get Available Report Types
- **GET** `/reports/available-types`
- **Authentication**: Required
- **Response**: List of available reports based on user permissions

#### Get Report History
- **GET** `/reports/history`
- **Authentication**: Required
- **Query Parameters**: `page`, `limit`
- **Response**: Paginated list of generated reports

### 8. Portal Settings

#### Get Portal Settings
- **GET** `/settings`
- **Authentication**: Required
- **Response**: All user settings and preferences

#### Update Portal Settings
- **PUT** `/settings`
- **Authentication**: Required
- **Body**: Settings to update
- **Response**: Update confirmation

#### Get Setting Options
- **GET** `/settings/options`
- **Authentication**: Required
- **Response**: Available options for each setting type

#### Reset Settings to Defaults
- **POST** `/settings/reset`
- **Authentication**: Required
- **Response**: Reset confirmation

## Database Schema

The Client Portal API uses 10 core tables:

1. **portal_users** - User accounts and credentials
2. **portal_requests** - Service requests submitted by users
3. **portal_request_attachments** - Files and photos attached to requests
4. **portal_request_status_history** - Audit trail of request status changes
5. **portal_notifications** - User notification system
6. **portal_reports** - Generated reports and analytics
7. **portal_activity_logs** - User activity tracking
8. **portal_settings** - User-specific portal configurations
9. **portal_templates** - Email and notification templates
10. **portal_scheduled_tasks** - Automated portal operations

## Key Features

### **Portal User Management:**
- Secure user authentication with JWT tokens
- Role-based access control (owner, manager, employee, viewer)
- Two-factor authentication support
- Account security features (login attempts, account locking)

### **Service Request System:**
- Comprehensive request forms with detailed project information
- File upload support for photos and videos
- Material type and condition tracking
- Safety hazard identification and management
- Priority and status management with full audit trail

### **Job Tracking & History:**
- Complete job lifecycle tracking
- Progress updates and status changes
- Crew information and scheduling
- Before/after photos and documentation
- Customer feedback and ratings

### **Invoice Management:**
- Invoice generation and tracking
- Payment processing and status management
- Payment method management
- Financial history and reporting

### **Client Profile Management:**
- Personal information management
- Address and contact management
- Preference and notification settings
- Password and security management

### **Reporting & Analytics:**
- Service summary reports with date filtering
- Cost analysis and spending trends
- Service type breakdowns
- Rating and review analytics
- Monthly trend analysis

### **Portal Customization:**
- Language and timezone settings
- Notification preferences
- Privacy and security settings
- User experience customization

## Security Features

### **Authentication & Authorization:**
- JWT-based authentication with configurable expiration
- Refresh token mechanism
- Role-based permissions system
- Session management and timeout

### **Account Security:**
- Password hashing with bcrypt
- Account lockout after failed login attempts
- Two-factor authentication support
- Password complexity requirements

### **Data Protection:**
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting and abuse prevention

## Error Handling

### **HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `500` - Internal Server Error

### **Application Error Codes:**
- `USER_NOT_FOUND` - Portal user not found
- `INVALID_CREDENTIALS` - Login authentication failed
- `ACCOUNT_LOCKED` - Account locked due to security
- `SERVICE_REQUEST_NOT_FOUND` - Service request not found
- `INVALID_REQUEST_STATUS` - Invalid request status for operation
- `INVOICE_NOT_FOUND` - Invoice not found
- `INVALID_PAYMENT_AMOUNT` - Payment amount exceeds balance

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **General endpoints**: 100 requests per minute per IP
- **Authentication endpoints**: 20 requests per minute per IP
- **Report endpoints**: 10 requests per minute per IP

## Testing

### **Test Environment Setup:**
```bash
# Install test dependencies
npm install

# Run Client Portal tests
npm run test:client-portal

# Run specific test suites
npm test -- --testNamePattern="Client Portal"
```

### **Sample Test Data:**
The migration script creates sample data including:
- 3 portal users with different roles
- 2 sample service requests
- Portal settings and templates
- Scheduled tasks

### **Test Coverage:**
- All 24 API endpoints
- Authentication and authorization
- Data validation and error handling
- Database operations and transactions
- Security features and rate limiting

## Integration Features

### **Payment Gateway Integration:**
- Support for multiple payment methods
- Payment processing and confirmation
- Transaction tracking and history

### **Notification System:**
- Email notifications
- SMS notifications (configurable)
- Push notifications
- Marketing communications (opt-in)

### **File Management:**
- Secure file upload and storage
- Multiple file type support
- File organization and categorization
- Access control and permissions

### **Mobile App Support:**
- RESTful API design
- JSON response format
- Token-based authentication
- Rate limiting and security

## Deployment

### **Environment Variables:**
```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=junkremovalapi

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=production
```

### **Production Considerations:**
- Use strong JWT secrets
- Enable HTTPS
- Configure proper CORS origins
- Set up database connection pooling
- Implement logging and monitoring
- Configure backup and recovery

## Support & Maintenance

### **Monitoring:**
- Health check endpoint: `GET /health`
- Activity logging for all user actions
- Error tracking and reporting
- Performance metrics

### **Updates:**
- Database migrations for schema changes
- API versioning for backward compatibility
- Feature flags for gradual rollouts
- Automated testing and deployment

This Client Portal API provides a robust foundation for managing customer interactions, service requests, and portal functionality in your junk removal management system.
