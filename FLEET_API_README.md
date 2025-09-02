# Fleet Management API Documentation

This document outlines the complete REST API endpoints needed to support the Fleet Management tab functionality in your junk removal management system. Built with Node.js, Express, and MySQL.

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- MySQL 8.0+
- JWT authentication system

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migration
npm run migrate:fleet

# Start the server
npm start
```

### Base Configuration

#### Base URL
```
http://localhost:3000/api/v1/fleet
```

#### Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

#### Response Format
All API responses follow this standard format:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Core Endpoints

### 🚛 Vehicles Management

#### Get All Vehicles
- **GET** `/vehicles`
- **Description**: Retrieve all vehicles with filtering, sorting, and pagination
- **Query Parameters**:
  - `page` (number): Page number for pagination (default: 1)
  - `limit` (number): Number of items per page (default: 20, max: 100)
  - `search` (string): Search term for vehicle name, make, model, or license plate
  - `status` (string): Filter by vehicle status
  - `vehicle_type` (string): Filter by vehicle type
  - `assigned_crew_id` (string): Filter by assigned crew
  - `assigned_job_id` (string): Filter by assigned job
  - `date_from` (date): Filter vehicles from this date
  - `date_to` (date): Filter vehicles to this date
  - `sort_by` (string): Sort field (default: 'created_at')
  - `sort_order` (string): Sort order - 'asc' or 'desc' (default: 'desc')

#### Get Vehicle by ID
- **GET** `/vehicles/:id`
- **Description**: Retrieve a specific vehicle by ID with all related information
- **Response**: Complete vehicle details including maintenance history, fuel logs, inspections, and current assignment

#### Create Vehicle
- **POST** `/vehicles`
- **Description**: Create a new vehicle in the fleet
- **Required Fields**: `name`, `license_plate`, `make`, `model`, `year`
- **Optional Fields**: `vin`, `vehicle_type`, `capacity_weight`, `fuel_type`, etc.

#### Update Vehicle
- **PUT** `/vehicles/:id`
- **Description**: Update an existing vehicle by ID
- **Fields**: Any vehicle field can be updated

#### Delete Vehicle
- **DELETE** `/vehicles/:id`
- **Description**: Soft delete a vehicle (sets status to 'retired')
- **Note**: Cannot delete vehicles that are currently assigned

### 🔧 Vehicle Maintenance

#### Get Vehicle Maintenance Records
- **GET** `/vehicles/:id/maintenance`
- **Description**: Get all maintenance records for a specific vehicle
- **Query Parameters**:
  - `maintenance_type` (string): Filter by maintenance type
  - `status` (string): Filter by maintenance status
  - `priority` (string): Filter by priority level
  - `date_from` (date): Filter from date
  - `date_to` (date): Filter to date
  - `performed_by` (string): Filter by technician

#### Create Maintenance Record
- **POST** `/vehicles/:id/maintenance`
- **Description**: Create a new maintenance record for a vehicle
- **Required Fields**: `maintenance_type`, `title`, `description`
- **Optional Fields**: `scheduled_date`, `estimated_cost`, `priority`, etc.

#### Update Maintenance Record
- **PUT** `/vehicles/:id/maintenance/:maintenanceId`
- **Description**: Update an existing maintenance record
- **Note**: Automatically updates vehicle status based on maintenance status

#### Delete Maintenance Record
- **DELETE** `/vehicles/:id/maintenance/:maintenanceId`
- **Description**: Delete a maintenance record
- **Note**: Cannot delete maintenance records that are in progress

### 📍 Vehicle Tracking

#### Get Vehicle Location
- **GET** `/vehicles/:id/location`
- **Description**: Get current location and tracking information for a vehicle
- **Response**: Current location, tracking data, route history, and assignment info

#### Update Vehicle Location
- **POST** `/vehicles/:id/location`
- **Description**: Update the current location of a vehicle
- **Required Fields**: `address`, `coordinates`
- **Optional Fields**: `tracking_data` (speed, fuel level, engine status, etc.)

#### Get Vehicle Tracking History
- **GET** `/vehicles/:id/tracking`
- **Description**: Get vehicle tracking history with date filtering
- **Query Parameters**:
  - `date_from` (date): Start date for tracking data
  - `date_to` (date): End date for tracking data
  - `limit` (number): Maximum number of tracking points (default: 100)

#### Get Fleet Location
- **GET** `/location`
- **Description**: Get real-time fleet location (all vehicles)
- **Query Parameters**:
  - `active_only` (boolean): Show only active vehicles (default: true)

### 👥 Vehicle Assignments

#### Get Vehicle Assignments
- **GET** `/vehicles/:id/assignments`
- **Description**: Get all driver assignments for a specific vehicle
- **Response**: Assignment history and current active assignment

#### Assign Vehicle
- **POST** `/vehicles/:id/assign`
- **Description**: Assign a vehicle to a driver/crew
- **Required Fields**: `start_date`
- **Optional Fields**: `crew_id`, `job_id`, `assignment_type`, `end_date`, etc.

#### Update Vehicle Assignment
- **PUT** `/vehicles/:id/assignments/:assignmentId`
- **Description**: Update an existing vehicle assignment
- **Note**: Automatically updates vehicle status based on assignment status

#### Delete Vehicle Assignment
- **DELETE** `/vehicles/:id/assignments/:assignmentId`
- **Description**: Delete a vehicle assignment
- **Note**: Cannot delete active assignments

### ⛽ Fuel Management

#### Get Vehicle Fuel Logs
- **GET** `/vehicles/:id/fuel-logs`
- **Description**: Get all fuel logs for a specific vehicle
- **Query Parameters**:
  - `date_from` (date): Filter from date
  - `date_to` (date): Filter to date
  - `fuel_type` (string): Filter by fuel type
  - `driver_id` (string): Filter by driver

#### Add Fuel Log
- **POST** `/vehicles/:id/fuel-logs`
- **Description**: Add a new fuel log entry for a vehicle
- **Required Fields**: `fuel_date`, `fuel_quantity`, `fuel_cost_per_unit`, `total_fuel_cost`, `odometer_reading`
- **Optional Fields**: `fuel_station`, `driver_id`, `fuel_level_before`, `fuel_level_after`

#### Update Fuel Log
- **PUT** `/vehicles/:id/fuel-logs/:fuelLogId`
- **Description**: Update an existing fuel log
- **Note**: Automatically updates vehicle fuel level and mileage if provided

#### Delete Fuel Log
- **DELETE** `/vehicles/:id/fuel-logs/:fuelLogId`
- **Description**: Delete a fuel log
- **Note**: Also deletes related cost records

### 📊 Fleet Reports

#### Get Fleet Summary Report
- **GET** `/reports/summary`
- **Description**: Get a summary report of all fleet operations and metrics
- **Required Query Parameters**: `date_from`, `date_to`
- **Optional Query Parameters**: `vehicle_type`, `format`
- **Response**: Fleet overview, vehicle types, operational metrics, fuel summary, maintenance summary, driver assignments

#### Get Fleet Performance Report
- **GET** `/reports/performance`
- **Description**: Get detailed performance metrics for fleet operations
- **Required Query Parameters**: `date_from`, `date_to`
- **Optional Query Parameters**: `vehicle_id`, `crew_id`
- **Response**: Vehicle performance, crew performance, cost analysis

#### Get Fleet Insights
- **GET** `/reports/insights`
- **Description**: Get fleet insights and actionable recommendations
- **Required Query Parameters**: `date_from`, `date_to`
- **Response**: Maintenance insights, fuel insights, utilization insights with recommendations

### ⚙️ Fleet Settings

#### Get Fleet Settings
- **GET** `/settings`
- **Description**: Get all fleet management settings and configurations
- **Response**: Grouped settings by category (maintenance, fuel, tracking, notifications, general)

#### Update Fleet Settings
- **PUT** `/settings`
- **Description**: Update fleet management settings
- **Request Body**: Object with settings grouped by category
- **Example**:
```json
{
  "maintenance_settings": {
    "oil_change_interval": 6000,
    "brake_service_interval": 30000
  },
  "fuel_settings": {
    "low_fuel_threshold": 25,
    "fuel_efficiency_target": 16.0
  }
}
```

#### Get Fleet Setting by Key
- **GET** `/settings/:key`
- **Description**: Get a specific fleet setting by key

#### Create Fleet Setting
- **POST** `/settings`
- **Description**: Create a new fleet setting
- **Required Fields**: `setting_key`, `setting_value`
- **Optional Fields**: `setting_type`, `description`, `is_public`

#### Delete Fleet Setting
- **DELETE** `/settings/:key`
- **Description**: Delete a fleet setting
- **Note**: Cannot delete required system settings

#### Reset Fleet Settings
- **POST** `/settings/reset`
- **Description**: Reset fleet settings to defaults
- **Note**: Only deletes non-required settings

## Data Models

### Vehicle Status Values
- `available` - Vehicle is available for assignment
- `in-use` - Vehicle is currently assigned and in use
- `maintenance` - Vehicle is under maintenance
- `out-of-service` - Vehicle is temporarily out of service
- `retired` - Vehicle has been retired (soft deleted)
- `reserved` - Vehicle is reserved for future use

### Vehicle Types
- `truck` - Standard truck
- `trailer` - Trailer unit
- `van` - Van or cargo van
- `pickup` - Pickup truck
- `dump_truck` - Dump truck
- `flatbed` - Flatbed truck
- `other` - Other vehicle types

### Maintenance Types
- `routine` - Routine maintenance
- `repair` - Repair work
- `emergency` - Emergency repairs
- `inspection` - Vehicle inspection
- `tire` - Tire-related work
- `brake` - Brake system work
- `engine` - Engine work
- `transmission` - Transmission work
- `other` - Other maintenance types

### Maintenance Priority Levels
- `low` - Low priority
- `medium` - Medium priority
- `high` - High priority
- `urgent` - Urgent priority
- `critical` - Critical priority

### Maintenance Status Values
- `scheduled` - Maintenance is scheduled
- `in-progress` - Maintenance is currently being performed
- `completed` - Maintenance has been completed
- `cancelled` - Maintenance was cancelled
- `deferred` - Maintenance was deferred

### Fuel Types
- `gasoline` - Gasoline fuel
- `diesel` - Diesel fuel
- `electric` - Electric power
- `hybrid` - Hybrid power
- `other` - Other fuel types

## Error Handling

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
- `501` - Not Implemented

### Application Error Codes
- `VEHICLE_NOT_FOUND` - Vehicle with specified ID not found
- `MAINTENANCE_RECORD_NOT_FOUND` - Maintenance record with specified ID not found
- `FUEL_LOG_NOT_FOUND` - Fuel log with specified ID not found
- `ASSIGNMENT_NOT_FOUND` - Assignment with specified ID not found
- `SETTING_NOT_FOUND` - Setting with specified key not found
- `VEHICLE_NOT_AVAILABLE` - Vehicle is not available for assignment
- `VEHICLE_ALREADY_ASSIGNED` - Vehicle already has an active assignment
- `MAINTENANCE_IN_PROGRESS` - Cannot delete maintenance record that is in progress
- `ASSIGNMENT_ACTIVE` - Cannot delete active assignment
- `REQUIRED_SETTING` - Cannot delete required system setting
- `DUPLICATE_VEHICLE` - Vehicle with this license plate or VIN already exists
- `INVALID_FUEL_TYPE` - Fuel type does not match vehicle fuel type
- `MISSING_DATE_RANGE` - Date range is required for reports
- `NO_UPDATE_FIELDS` - No valid fields to update
- `ENDPOINT_NOT_FOUND` - Fleet Management API endpoint not found

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **General endpoints**: 100 requests per minute per IP
- **Tracking endpoints**: 200 requests per minute per IP
- **Report endpoints**: 20 requests per minute per IP

## Role-Based Access Control

### Admin Role
- Full access to all endpoints
- Can create, update, and delete all resources
- Can manage fleet settings
- Can reset fleet settings to defaults

### Manager Role
- Full access to all endpoints
- Can create, update, and delete all resources
- Can manage fleet settings
- Cannot reset fleet settings to defaults

### Dispatcher Role
- Read access to vehicles, maintenance, tracking, and assignments
- Can create and update maintenance records
- Can create and update vehicle assignments
- Can update vehicle locations
- Can manage fuel logs
- Cannot delete resources
- Cannot manage fleet settings

### Driver Role
- Read access to assigned vehicles
- Can view maintenance records for assigned vehicles
- Can view fuel logs for assigned vehicles
- Can update vehicle locations
- Can add fuel logs
- Cannot manage assignments or maintenance
- Cannot access reports or settings

## Testing

### Test Environment
- **Base URL**: `http://localhost:3000/api/v1/fleet`
- **Test Database**: Separate test database with sample data
- **Authentication**: Use test JWT tokens

### Sample Test Data
```bash
# Create test vehicle
curl -X POST http://localhost:3000/api/v1/fleet/vehicles \
  -H "Authorization: Bearer test_token" \
  -H "Content-Type: application/json" \
  -d @test_vehicle.json

# Add maintenance record
curl -X POST http://localhost:3000/api/v1/fleet/vehicles/veh-1/maintenance \
  -H "Authorization: Bearer test_token" \
  -H "Content-Type: application/json" \
  -d @test_maintenance.json

# Update vehicle location
curl -X POST http://localhost:3000/api/v1/fleet/vehicles/veh-1/location \
  -H "Authorization: Bearer test_token" \
  -H "Content-Type: application/json" \
  -d @test_location.json
```

## Integration Features

### GPS Tracking System Integration
- Real-time location updates via `POST /vehicles/:id/location`
- Historical tracking data via `GET /vehicles/:id/tracking`
- Fleet-wide location monitoring via `GET /location`

### Maintenance Shop Integration
- Maintenance record creation and management
- Cost tracking and analysis
- Service scheduling and reminders

### Fuel Card System Integration
- Fuel log management
- Cost tracking and reporting
- Fuel efficiency monitoring

### Driver Management System Connection
- Vehicle assignment management
- Driver performance tracking
- Assignment history and analytics

## Webhook Support

Configure webhooks to receive real-time updates:
- Vehicle location updates
- Maintenance status changes
- Fuel level alerts
- Driver assignment changes

**Webhook endpoint**: `POST /webhooks/fleet`

## Fleet Management Features

### **Core Vehicle Management:**
- Full CRUD operations for vehicles
- Vehicle status tracking and lifecycle management
- Vehicle specifications and documentation
- Vehicle assignment and driver management

### **Maintenance Management:**
- Complete maintenance record tracking
- Scheduled maintenance scheduling
- Maintenance cost tracking and analysis
- Maintenance history and documentation

### **Vehicle Tracking:**
- Real-time location tracking
- Route history and analytics
- Fuel level monitoring
- Engine status and diagnostics

### **Driver Assignment:**
- Driver-vehicle assignment management
- Assignment history tracking
- Temporary and permanent assignments
- Assignment scheduling and planning

### **Fuel Management:**
- Fuel consumption tracking
- Fuel cost analysis
- Fuel efficiency monitoring
- Fuel station and cost tracking

### **Insurance & Registration:**
- Insurance policy management
- Registration tracking and renewal
- Compliance monitoring
- Document management

### **Reporting & Analytics:**
- Fleet performance metrics
- Cost analysis and budgeting
- Maintenance analytics
- Driver performance tracking

### **Advanced Features:**
- Real-time GPS tracking and geofencing
- Predictive maintenance scheduling
- Fuel efficiency analysis
- Fleet utilization optimization
- Cost per mile calculations

## Future Enhancements

### Planned Features
- Vehicle inspections management
- Accident reporting and tracking
- Document management system
- Advanced analytics dashboard
- Mobile app integration
- IoT device integration
- Predictive analytics
- Automated maintenance scheduling

### API Versioning
- Current version: v1
- Backward compatibility maintained
- New features added in subsequent versions
- Deprecation notices provided in advance

## Support and Documentation

### API Documentation
- Interactive API documentation available at `/docs`
- Swagger/OpenAPI specification
- Postman collection available

### Support Channels
- Technical support: support@company.com
- API documentation: docs.company.com
- Community forum: community.company.com

### Rate Limits and Quotas
- Free tier: 1,000 requests per day
- Professional tier: 10,000 requests per day
- Enterprise tier: Custom limits

---

**Last Updated**: January 2024  
**API Version**: v1  
**Maintainer**: Fleet Management Team
