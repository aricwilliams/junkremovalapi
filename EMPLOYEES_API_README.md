# Employees API

A comprehensive REST API for managing employee information, schedules, performance, time tracking, training, payroll, and reports in a junk removal business.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MySQL 8.0+
- JWT authentication setup

### Installation
```bash
# Install dependencies
npm install

# Run database migration
npm run migrate:employees

# Start the server
npm start

# Test the API
npm run test:employees
```

### Base URL
```
http://localhost:3000/api/v1/employees
```

## 🔐 Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📋 Core Features

### 1. Employee Management
- **CRUD Operations**: Create, read, update, and delete employees
- **Comprehensive Information**: Personal details, employment info, compensation, schedules
- **Status Management**: Active, inactive, on-leave, terminated, suspended, probation
- **Soft Delete**: Employees are marked as terminated rather than permanently deleted

### 2. Employee Scheduling
- **Flexible Schedules**: Support for regular, overtime, on-call, training schedules
- **Availability Management**: Track employee availability and identify conflicts
- **Team Scheduling**: Consolidated view of team schedules
- **Schedule Updates**: Modify schedules with effective dates and reasons

### 3. Performance Management
- **Performance Reviews**: Annual, quarterly, monthly, probation, promotion reviews
- **Rating System**: 1.0-5.0 rating scale with detailed metrics
- **Goal Setting**: Track employee goals and achievements
- **Improvement Areas**: Identify and track areas for development

### 4. Time Tracking
- **Clock In/Out**: Real-time time tracking with location support
- **Break Management**: Start and end break periods
- **Hours Calculation**: Automatic calculation of regular, overtime, holiday, weekend hours
- **Team Overview**: Consolidated time tracking for teams and departments

### 5. Training & Certifications
- **Training Records**: Track completed training with scores and certificates
- **Certification Management**: Monitor certification status and expiration dates
- **Required Training**: Position and department-based training requirements
- **Training Analytics**: Completion rates, costs, and effectiveness metrics

### 6. Payroll Management
- **Pay Rate Management**: Support for hourly, salary, commission, and piece-rate structures
- **Overtime Calculation**: Automatic overtime rate calculations with multipliers
- **Deductions**: Tax, benefits, and retirement contribution calculations
- **Payroll Reports**: Comprehensive payroll analytics and cost analysis

### 7. Reporting & Analytics
- **Employee Summary**: Comprehensive employee statistics and trends
- **Performance Reports**: Detailed performance analysis and recommendations
- **Turnover Analysis**: Hiring trends, termination analysis, and retention metrics
- **Training Analytics**: Training completion rates and effectiveness metrics

## 📚 API Endpoints

### Core Employee Endpoints

#### Get All Employees
```http
GET /api/v1/employees
```
**Query Parameters:**
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Number of employees per page (default: 20)
- `search` (string): Search by name, email, or phone
- `status` (string): Filter by employee status
- `department` (string): Filter by department
- `position` (string): Filter by position
- `hire_date_from` (date): Filter by hire date range
- `hire_date_to` (date): Filter by hire date range
- `sort_by` (string): Sort field (default: last_name)
- `sort_order` (string): Sort direction (asc/desc, default: asc)

**Response:**
```json
{
  "success": true,
  "message": "Employees retrieved successfully",
  "data": {
    "employees": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    },
    "summary": {
      "total_employees": 150,
      "active_employees": 142,
      "inactive_employees": 5,
      "terminated_employees": 3
    }
  }
}
```

#### Create Employee
```http
POST /api/v1/employees
```
**Request Body:**
```json
{
  "personal_info": {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@company.com",
    "phone": "555-0100"
  },
  "employment_info": {
    "department": "operations",
    "position": "driver",
    "hire_date": "2024-01-15"
  },
  "compensation": {
    "current_salary": 45000,
    "hourly_rate": 18.50
  },
  "schedule": {
    "work_schedule": "monday_friday",
    "start_time": "08:00",
    "end_time": "17:00",
    "break_duration": 60
  }
}
```

#### Get Employee by ID
```http
GET /api/v1/employees/:id
```
**Response includes:**
- Basic employee information
- Emergency contacts
- Current pay rate
- Schedule information
- Performance data
- Time tracking summary
- Certifications
- Benefits

#### Update Employee
```http
PUT /api/v1/employees/:id
```
**Request Body:** Partial updates supported for any employee fields

#### Delete Employee
```http
DELETE /api/v1/employees/:id
```
**Note:** Soft delete - sets status to 'terminated' and marks as inactive

### Employee Schedule Endpoints

#### Get Employee Schedule
```http
GET /api/v1/employees/:id/schedule
```
**Query Parameters:**
- `date_from` (date): Start date for schedule period
- `date_to` (date): End date for schedule period

#### Update Employee Schedule
```http
PUT /api/v1/employees/:id/schedule
```
**Request Body:**
```json
{
  "schedule_changes": {
    "monday": {
      "start_time": "09:00",
      "end_time": "18:00",
      "break_start": "12:00",
      "break_end": "13:00"
    }
  },
  "effective_date": "2024-02-01",
  "reason": "Schedule adjustment for new project"
}
```

#### Get Employee Availability
```http
GET /api/v1/employees/:id/availability
```
**Returns:** Availability status and potential conflicts for a date range

#### Get Team Schedule
```http
GET /api/v1/employees/team/schedule
```
**Returns:** Consolidated schedule view for entire team

### Employee Payroll Endpoints

#### Get Employee Payroll
```http
GET /api/v1/employees/:id/payroll
```
**Query Parameters:**
- `pay_period` (string): weekly, biweekly, monthly
- `date_from` (date): Start date for payroll period
- `date_to` (date): End date for payroll period

**Response includes:**
- Regular hours and pay
- Overtime hours and pay
- Holiday and weekend pay
- Deductions and net pay
- YTD totals

#### Get Payroll Summary
```http
GET /api/v1/employees/payroll/summary
```
**Query Parameters:**
- `date_from` (date): Required start date
- `date_to` (date): Required end date
- `department` (string): Filter by department

#### Get Payroll Reports
```http
GET /api/v1/employees/payroll/reports
```
**Query Parameters:**
- `report_type` (string): overtime_analysis, cost_analysis, comprehensive
- `date_from` (date): Required start date
- `date_to` (date): Required end date
- `department` (string): Filter by department

### Employee Training Endpoints

#### Get Employee Training
```http
GET /api/v1/employees/:id/training
```
**Query Parameters:**
- `status` (string): Filter by training status
- `type` (string): Filter by training type
- `date_from` (date): Filter by start date
- `date_to` (date): Filter by end date

#### Add Training Record
```http
POST /api/v1/employees/:id/training
```
**Request Body:**
```json
{
  "course_name": "Safety Training",
  "type": "safety",
  "completion_date": "2024-01-15",
  "duration_hours": 8,
  "score": 95,
  "certificate_number": "SAF-2024-001"
}
```

#### Get Training Analytics
```http
GET /api/v1/employees/training/analytics
```
**Query Parameters:**
- `date_from` (date): Required start date
- `date_to` (date): Required end date
- `department` (string): Filter by department
- `type` (string): Filter by training type

### Employee Time Tracking Endpoints

#### Clock In/Out
```http
POST /api/v1/employees/:id/clock
```
**Request Body:**
```json
{
  "action": "clock_in",
  "timestamp": "2024-01-15T08:00:00Z",
  "location": "Main Office",
  "notes": "Starting morning shift"
}
```
**Actions:** `clock_in`, `clock_out`, `break_start`, `break_end`

#### Get Employee Time Logs
```http
GET /api/v1/employees/:id/time-logs
```
**Query Parameters:**
- `date_from` (date): Filter by start date
- `date_to` (date): Filter by end date
- `status` (string): Filter by status

#### Get Team Time Tracking
```http
GET /api/v1/employees/time-tracking/team
```
**Query Parameters:**
- `date_from` (date): Required start date
- `date_to` (date): Required end date
- `department` (string): Filter by department
- `crew_id` (string): Filter by crew

#### Get Time Tracking Analytics
```http
GET /api/v1/employees/time-tracking/analytics
```
**Query Parameters:**
- `report_type` (string): attendance_analysis, overtime_analysis, comprehensive
- `date_from` (date): Required start date
- `date_to` (date): Required end date
- `department` (string): Filter by department

### Employee Reports Endpoints

#### Get Employee Summary Report
```http
GET /api/v1/employees/reports/summary
```
**Query Parameters:**
- `date_from` (date): Required start date
- `date_to` (date): Required end date
- `department` (string): Filter by department
- `format` (string): json, pdf

#### Get Employee Performance Report
```http
GET /api/v1/employees/reports/performance
```
**Query Parameters:**
- `date_from` (date): Required start date
- `date_to` (date): Required end date
- `department` (string): Filter by department
- `performance_threshold` (number): Performance rating threshold
- `format` (string): json, pdf

#### Get Employee Turnover Analysis
```http
GET /api/v1/employees/reports/turnover
```
**Query Parameters:**
- `date_from` (date): Required start date
- `date_to` (date): Required end date
- `department` (string): Filter by department
- `format` (string): json, pdf

## 🗄️ Database Schema

The API uses 14 main tables:

1. **employees** - Core employee information
2. **employee_portal_credentials** - Login credentials and permissions
3. **employee_emergency_contacts** - Emergency contact information
4. **employee_documents** - Employee documents and files
5. **employee_certifications** - Professional certifications
6. **employee_pay_rates** - Pay rate history and current rates
7. **employee_schedules** - Work schedules and availability
8. **employee_performance** - Performance reviews and ratings
9. **employee_performance_metrics** - Detailed performance metrics
10. **employee_training** - Training records and completion
11. **employee_time_logs** - Time tracking and attendance
12. **employee_benefits** - Benefits and insurance information
13. **employee_incidents** - Safety incidents and disciplinary actions
14. **employee_equipment** - Equipment assignments and tracking

## 🔒 Role-Based Access Control

### Admin
- Full access to all endpoints
- Can create, update, and delete any employee
- Access to all reports and analytics

### HR
- Full access to employee information
- Can manage payroll, benefits, and training
- Access to HR-specific reports

### Manager
- Access to direct reports and team members
- Can view team schedules and time tracking
- Limited access to sensitive information

### Supervisor
- Access to assigned crew members
- Can view schedules and time tracking
- Limited administrative capabilities

### Employee
- Access to own information only
- Can view own schedule, time logs, and training
- Limited to clock in/out functionality

## 📊 Response Format

All API responses follow a consistent format:

```json
{
  "success": true|false,
  "message": "Human-readable message",
  "data": {
    // Response data
  },
  "timestamp": "ISO 8601 timestamp"
}
```

### Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "ISO 8601 timestamp"
}
```

## 🚨 Error Handling

### Common Error Codes
- `EMPLOYEE_NOT_FOUND` - Employee ID doesn't exist
- `DUPLICATE_EMAIL` - Email already exists
- `INVALID_DATE_RANGE` - Date range is invalid
- `MISSING_DATES` - Required date parameters missing
- `UNAUTHORIZED` - Insufficient permissions
- `VALIDATION_ERROR` - Request validation failed

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## 🧪 Testing

### Run Tests
```bash
# Test all endpoints
npm run test:employees

# Test specific functionality
npm test
```

### Test Coverage
The test suite covers:
- All CRUD operations
- Validation and error handling
- Authentication and authorization
- Business logic and calculations
- Edge cases and error scenarios

## 🔧 Configuration

### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=junkremoval

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=development
```

### Database Configuration
```javascript
// config/database.js
module.exports = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'junkremoval',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
```

## 📈 Performance Considerations

### Database Optimization
- Indexes on frequently queried fields
- Efficient JOIN operations
- Pagination for large datasets
- Connection pooling

### API Optimization
- Response caching for static data
- Rate limiting to prevent abuse
- Efficient validation schemas
- Optimized SQL queries

## 🔄 Rate Limiting

The API implements rate limiting to prevent abuse:
- **Default**: 100 requests per 15 minutes per IP
- **Authenticated users**: 1000 requests per 15 minutes
- **Admin users**: 5000 requests per 15 minutes

## 📝 Logging

### Log Levels
- `ERROR` - Application errors and exceptions
- `WARN` - Warning conditions
- `INFO` - General information
- `DEBUG` - Detailed debugging information

### Log Format
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "message": "Employee created successfully",
  "employee_id": "emp-123",
  "user_id": "user-456",
  "ip": "192.168.1.100"
}
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure secure database credentials
- [ ] Set strong JWT secret
- [ ] Enable HTTPS
- [ ] Configure logging and monitoring
- [ ] Set up backup and recovery procedures
- [ ] Configure rate limiting
- [ ] Set up error tracking

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

### Development Setup
```bash
# Clone repository
git clone <repository-url>

# Install dependencies
npm install

# Set up database
npm run migrate:employees

# Run tests
npm test

# Start development server
npm run dev
```

### Code Style
- Follow ESLint configuration
- Use consistent naming conventions
- Add JSDoc comments for functions
- Write comprehensive tests
- Follow REST API best practices

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- API documentation: `/api/v1/employees/health`
- Database schema: See migration files
- Validation schemas: See validation files

### Issues
- Report bugs via GitHub Issues
- Include error logs and request details
- Provide steps to reproduce

### Contact
- Development team: dev@company.com
- API support: api-support@company.com
- Emergency: on-call@company.com

---

**Version:** 1.0.0  
**Last Updated:** January 2024  
**Maintainer:** Development Team
