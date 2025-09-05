# Estimates API Documentation

Base URL: `http://localhost:3000/api/v1/estimates`

⚠️ **IMPORTANT**: All endpoints require authentication via Bearer token in the Authorization header.

## Authentication
```
Authorization: Bearer <your_jwt_token>
```

### Getting a Token
You need to authenticate first using the auth endpoints to get a JWT token. Include this token in every request header.

### Example with curl:
```bash
curl -X GET http://localhost:3000/api/v1/estimates \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

### Example with JavaScript fetch:
```javascript
fetch('http://localhost:3000/api/v1/estimates', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
    'Content-Type': 'application/json'
  }
})
```

---

## 1. Get All Estimates
**GET** `/api/v1/estimates`

### Query Parameters
- `status` (optional): Filter by estimate status (`pending`, `reviewed`, `quoted`, `accepted`, `declined`, `expired`)
- `request_priority` (optional): Filter by priority (`standard`, `urgent`, `low`)
- `is_new_client` (optional): Filter by client type (`true`, `false`)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sort_by` (optional): Sort field (default: `created_at`)
- `sort_order` (optional): Sort order (`asc`, `desc`)

### Example Request
```
GET /api/v1/estimates?status=pending&request_priority=urgent&is_new_client=true&page=1&limit=10&sort_by=created_at&sort_order=desc
```

### Response
```json
{
  "success": true,
  "data": {
    "estimates": [
      {
        "id": 1,
        "is_new_client": true,
        "existing_client_id": null,
        "full_name": "John Doe",
        "phone_number": "555-0123",
        "email_address": "john@example.com",
        "ok_to_text": false,
        "service_address": "123 Main St, Anytown, CA 12345",
        "gate_code": null,
        "apartment_unit": null,
        "preferred_date": "2024-01-15",
        "preferred_time": "Morning",
        "location_on_property": "Garage",
        "approximate_volume": "1-2 truck loads",
        "access_considerations": "Narrow driveway",
        "photos": ["photo1.jpg", "photo2.jpg"],
        "videos": ["video1.mp4"],
        "material_types": ["furniture", "electronics", "appliances"],
        "approximate_item_count": "20-30 items",
        "items_filled_water": false,
        "items_filled_oil_fuel": false,
        "hazardous_materials": false,
        "items_tied_bags": true,
        "oversized_items": true,
        "mold_present": false,
        "pests_present": false,
        "sharp_objects": false,
        "heavy_lifting_required": true,
        "disassembly_required": false,
        "additional_notes": "Customer prefers morning pickup",
        "request_donation_pickup": false,
        "request_demolition_addon": false,
        "how_did_you_hear": "Google search",
        "request_priority": "urgent",
        "status": "pending",
        "quote_amount": null,
        "quote_notes": null,
        "created_at": "2024-01-10T10:30:00.000Z",
        "updated_at": "2024-01-10T10:30:00.000Z",
        "existing_customer_name": null,
        "existing_customer_email": null,
        "existing_customer_phone": null
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

## 2. Get Single Estimate
**GET** `/api/v1/estimates/:id`

### Path Parameters
- `id`: Estimate ID

### Response
```json
{
  "success": true,
  "data": {
    "estimate": {
      "id": 1,
      "is_new_client": true,
      "existing_client_id": null,
      "full_name": "John Doe",
      "phone_number": "555-0123",
      "email_address": "john@example.com",
      "ok_to_text": false,
      "service_address": "123 Main St, Anytown, CA 12345",
      "gate_code": null,
      "apartment_unit": null,
      "preferred_date": "2024-01-15",
      "preferred_time": "Morning",
      "location_on_property": "Garage",
      "approximate_volume": "1-2 truck loads",
      "access_considerations": "Narrow driveway",
      "photos": ["photo1.jpg", "photo2.jpg"],
      "videos": ["video1.mp4"],
      "material_types": ["furniture", "electronics", "appliances"],
      "approximate_item_count": "20-30 items",
      "items_filled_water": false,
      "items_filled_oil_fuel": false,
      "hazardous_materials": false,
      "items_tied_bags": true,
      "oversized_items": true,
      "mold_present": false,
      "pests_present": false,
      "sharp_objects": false,
      "heavy_lifting_required": true,
      "disassembly_required": false,
      "additional_notes": "Customer prefers morning pickup",
      "request_donation_pickup": false,
      "request_demolition_addon": false,
      "how_did_you_hear": "Google search",
      "request_priority": "urgent",
      "status": "pending",
      "quote_amount": null,
      "quote_notes": null,
      "created_at": "2024-01-10T10:30:00.000Z",
      "updated_at": "2024-01-10T10:30:00.000Z",
      "existing_customer_name": null,
      "existing_customer_email": null,
      "existing_customer_phone": null,
      "existing_customer_address": null,
      "existing_customer_city": null,
      "existing_customer_state": null,
      "existing_customer_zip_code": null
    }
  },
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 3. Create Estimate
**POST** `/api/v1/estimates`

### Request Body
```json
{
  "is_new_client": true,
  "existing_client_id": null,
  "full_name": "John Doe",
  "phone_number": "555-0123",
  "email_address": "john@example.com",
  "ok_to_text": false,
  "service_address": "123 Main St, Anytown, CA 12345",
  "gate_code": null,
  "apartment_unit": null,
  "preferred_date": "2024-01-15",
  "preferred_time": "Morning",
  "location_on_property": "Garage",
  "approximate_volume": "1-2 truck loads",
  "access_considerations": "Narrow driveway",
  "photos": ["photo1.jpg", "photo2.jpg"],
  "videos": ["video1.mp4"],
  "material_types": ["furniture", "electronics", "appliances"],
  "approximate_item_count": "20-30 items",
  "items_filled_water": false,
  "items_filled_oil_fuel": false,
  "hazardous_materials": false,
  "items_tied_bags": true,
  "oversized_items": true,
  "mold_present": false,
  "pests_present": false,
  "sharp_objects": false,
  "heavy_lifting_required": true,
  "disassembly_required": false,
  "additional_notes": "Customer prefers morning pickup",
  "request_donation_pickup": false,
  "request_demolition_addon": false,
  "how_did_you_hear": "Google search",
  "request_priority": "urgent",
  "status": "pending",
  "quote_amount": null,
  "quote_notes": null
}
```

### Required Fields
- `full_name` (string, 2-255 chars): Customer's full name
- `phone_number` (string, valid phone): Customer's phone number
- `email_address` (string, valid email): Customer's email address
- `service_address` (string, 5-1000 chars): Service address
- `location_on_property` (string, 2-100 chars): Location on property
- `approximate_volume` (string, 2-100 chars): Approximate volume
- `material_types` (array, min 1 item): Array of material types

### Optional Fields
- `is_new_client` (boolean): Whether this is a new client (default: true)
- `existing_client_id` (integer): ID of existing customer if applicable
- `ok_to_text` (boolean): OK to text customer (default: false)
- `gate_code` (string, max 100 chars): Gate code if applicable
- `apartment_unit` (string, max 50 chars): Apartment/unit number
- `preferred_date` (date): Preferred service date
- `preferred_time` (string, max 50 chars): Preferred time
- `access_considerations` (string, max 1000 chars): Access considerations
- `photos` (array of strings): Array of photo file paths/URLs
- `videos` (array of strings): Array of video file paths/URLs
- `approximate_item_count` (string, max 255 chars): Approximate item count
- `items_filled_water` (boolean): Items filled with water (default: false)
- `items_filled_oil_fuel` (boolean): Items filled with oil/fuel (default: false)
- `hazardous_materials` (boolean): Hazardous materials present (default: false)
- `items_tied_bags` (boolean): Items tied in bags (default: false)
- `oversized_items` (boolean): Oversized items present (default: false)
- `mold_present` (boolean): Mold present (default: false)
- `pests_present` (boolean): Pests present (default: false)
- `sharp_objects` (boolean): Sharp objects present (default: false)
- `heavy_lifting_required` (boolean): Heavy lifting required (default: false)
- `disassembly_required` (boolean): Disassembly required (default: false)
- `additional_notes` (string, max 1000 chars): Additional notes
- `request_donation_pickup` (boolean): Request donation pickup (default: false)
- `request_demolition_addon` (boolean): Request demolition addon (default: false)
- `how_did_you_hear` (string, max 255 chars): How customer heard about service
- `request_priority` (string): Priority level (`standard`, `urgent`, `low`)
- `status` (string): Estimate status (`pending`, `reviewed`, `quoted`, `accepted`, `declined`, `expired`)
- `quote_amount` (number): Quote amount
- `quote_notes` (string, max 1000 chars): Quote notes

### Response
```json
{
  "success": true,
  "data": {
    "estimate": {
      "id": 1,
      "is_new_client": true,
      "existing_client_id": null,
      "full_name": "John Doe",
      "phone_number": "555-0123",
      "email_address": "john@example.com",
      "ok_to_text": false,
      "service_address": "123 Main St, Anytown, CA 12345",
      "gate_code": null,
      "apartment_unit": null,
      "preferred_date": "2024-01-15",
      "preferred_time": "Morning",
      "location_on_property": "Garage",
      "approximate_volume": "1-2 truck loads",
      "access_considerations": "Narrow driveway",
      "photos": ["photo1.jpg", "photo2.jpg"],
      "videos": ["video1.mp4"],
      "material_types": ["furniture", "electronics", "appliances"],
      "approximate_item_count": "20-30 items",
      "items_filled_water": false,
      "items_filled_oil_fuel": false,
      "hazardous_materials": false,
      "items_tied_bags": true,
      "oversized_items": true,
      "mold_present": false,
      "pests_present": false,
      "sharp_objects": false,
      "heavy_lifting_required": true,
      "disassembly_required": false,
      "additional_notes": "Customer prefers morning pickup",
      "request_donation_pickup": false,
      "request_demolition_addon": false,
      "how_did_you_hear": "Google search",
      "request_priority": "urgent",
      "status": "pending",
      "quote_amount": null,
      "quote_notes": null,
      "created_at": "2024-01-10T10:30:00.000Z",
      "updated_at": "2024-01-10T10:30:00.000Z"
    }
  },
  "message": "Estimate created successfully",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

---

## 4. Update Estimate
**PUT** `/api/v1/estimates/:id`

### Path Parameters
- `id`: Estimate ID

### Request Body
```json
{
  "status": "quoted",
  "quote_amount": 500.00,
  "quote_notes": "Standard removal service",
  "request_priority": "standard"
}
```

### Updatable Fields
All fields from the create estimate request are updatable, including:
- `is_new_client` (boolean)
- `existing_client_id` (integer)
- `full_name` (string, 2-255 chars)
- `phone_number` (string, valid phone)
- `email_address` (string, valid email)
- `ok_to_text` (boolean)
- `service_address` (string, 5-1000 chars)
- `gate_code` (string, max 100 chars)
- `apartment_unit` (string, max 50 chars)
- `preferred_date` (date)
- `preferred_time` (string, max 50 chars)
- `location_on_property` (string, 2-100 chars)
- `approximate_volume` (string, 2-100 chars)
- `access_considerations` (string, max 1000 chars)
- `photos` (array of strings)
- `videos` (array of strings)
- `material_types` (array of strings)
- `approximate_item_count` (string, max 255 chars)
- `items_filled_water` (boolean)
- `items_filled_oil_fuel` (boolean)
- `hazardous_materials` (boolean)
- `items_tied_bags` (boolean)
- `oversized_items` (boolean)
- `mold_present` (boolean)
- `pests_present` (boolean)
- `sharp_objects` (boolean)
- `heavy_lifting_required` (boolean)
- `disassembly_required` (boolean)
- `additional_notes` (string, max 1000 chars)
- `request_donation_pickup` (boolean)
- `request_demolition_addon` (boolean)
- `how_did_you_hear` (string, max 255 chars)
- `request_priority` (string)
- `status` (string)
- `quote_amount` (number)
- `quote_notes` (string, max 1000 chars)

### Response
```json
{
  "success": true,
  "data": {
    "estimate": {
      "id": 1,
      "is_new_client": true,
      "existing_client_id": null,
      "full_name": "John Doe",
      "phone_number": "555-0123",
      "email_address": "john@example.com",
      "ok_to_text": false,
      "service_address": "123 Main St, Anytown, CA 12345",
      "gate_code": null,
      "apartment_unit": null,
      "preferred_date": "2024-01-15",
      "preferred_time": "Morning",
      "location_on_property": "Garage",
      "approximate_volume": "1-2 truck loads",
      "access_considerations": "Narrow driveway",
      "photos": ["photo1.jpg", "photo2.jpg"],
      "videos": ["video1.mp4"],
      "material_types": ["furniture", "electronics", "appliances"],
      "approximate_item_count": "20-30 items",
      "items_filled_water": false,
      "items_filled_oil_fuel": false,
      "hazardous_materials": false,
      "items_tied_bags": true,
      "oversized_items": true,
      "mold_present": false,
      "pests_present": false,
      "sharp_objects": false,
      "heavy_lifting_required": true,
      "disassembly_required": false,
      "additional_notes": "Customer prefers morning pickup",
      "request_donation_pickup": false,
      "request_demolition_addon": false,
      "how_did_you_hear": "Google search",
      "request_priority": "standard",
      "status": "quoted",
      "quote_amount": 500.00,
      "quote_notes": "Standard removal service",
      "created_at": "2024-01-10T10:30:00.000Z",
      "updated_at": "2024-01-10T11:00:00.000Z"
    }
  },
  "message": "Estimate updated successfully",
  "timestamp": "2024-01-10T11:00:00.000Z"
}
```

---

## 5. Delete Estimate
**DELETE** `/api/v1/estimates/:id`

### Path Parameters
- `id`: Estimate ID

### Response
```json
{
  "success": true,
  "message": "Estimate deleted successfully",
  "timestamp": "2024-01-10T11:00:00.000Z"
}
```

**Note**: Estimate cannot be deleted if it has associated jobs.

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "full_name",
      "message": "Full name is required"
    },
    {
      "field": "material_types",
      "message": "At least one material type must be selected"
    }
  ],
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "Estimate not found",
  "error": "ESTIMATE_NOT_FOUND",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

### Customer Not Found Error (400)
```json
{
  "success": false,
  "message": "Existing client not found",
  "error": "CUSTOMER_NOT_FOUND",
  "timestamp": "2024-01-10T10:30:00.000Z"
}
```

### Estimate Has Jobs Error (409)
```json
{
  "success": false,
  "message": "Cannot delete estimate with associated jobs",
  "error": "ESTIMATE_HAS_JOBS",
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

### Estimate Status
- `pending`: New estimate, awaiting review
- `reviewed`: Estimate has been reviewed
- `quoted`: Quote has been provided
- `accepted`: Customer accepted the quote
- `declined`: Customer declined the quote
- `expired`: Quote has expired

### Request Priority
- `standard`: Standard priority
- `urgent`: Urgent priority
- `low`: Low priority

### Material Types (Examples)
Common material types include:
- `furniture`
- `electronics`
- `appliances`
- `clothing`
- `books`
- `construction_materials`
- `yard_waste`
- `hazardous_materials`

### Phone Number Format
- Must be a valid phone number
- Can include country code with +
- Examples: `555-0123`, `+15550123`, `15550123`

### Date Format
- Must be a valid date
- ISO 8601 format preferred
- Examples: `2024-01-15`, `2024-01-15T00:00:00.000Z`

---

## Troubleshooting

### Common Issues

#### 1. Authentication Error: "Access denied. No token provided"
**Error**: `{"success":false,"message":"Access denied. No token provided.","error":"AUTHENTICATION_FAILED"}`

**Solution**: 
- Make sure you're including the Authorization header in your request
- Get a valid JWT token by authenticating first
- Include the token in the format: `Authorization: Bearer <your_token>`

#### 2. Validation Error: "Full name is required"
**Error**: `{"success":false,"message":"Validation failed","errors":[{"field":"full_name","message":"Full name is required"}]}`

**Solution**: 
- Make sure all required fields are included in your request
- Check field validation rules (min/max lengths, formats)
- Ensure email is valid and phone number follows the correct format

#### 3. Material Types Validation Error
**Error**: `{"success":false,"message":"Validation failed","errors":[{"field":"material_types","message":"At least one material type must be selected"}]}`

**Solution**: 
- Make sure `material_types` is an array with at least one item
- Example: `"material_types": ["furniture", "electronics"]`

#### 4. Existing Client Not Found Error
**Error**: `{"success":false,"message":"Existing client not found","error":"CUSTOMER_NOT_FOUND"}`

**Solution**: 
- Check if the `existing_client_id` exists in the customers table
- Use a valid customer ID or set `is_new_client` to true

#### 5. CORS Error
**Error**: Browser console shows CORS policy blocking the request

**Solution**: 
- Make sure your frontend is running on one of the allowed ports
- Check that your API server is running and CORS is configured properly

### Quick Test Commands

#### Test Authentication (replace with your actual token):
```bash
curl -X GET http://localhost:3000/api/v1/estimates \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Test Estimate Creation (replace with your actual token):
```bash
curl -X POST http://localhost:3000/api/v1/estimates \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "phone_number": "555-0123",
    "email_address": "john@example.com",
    "service_address": "123 Main St, Anytown, CA 12345",
    "location_on_property": "Garage",
    "approximate_volume": "1-2 truck loads",
    "material_types": ["furniture", "electronics"]
  }'
```

#### Test Estimate Update (replace with your actual token and estimate ID):
```bash
curl -X PUT http://localhost:3000/api/v1/estimates/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"status": "quoted", "quote_amount": 500.00}'
```

#### Test Estimate Filtering:
```bash
curl -X GET "http://localhost:3000/api/v1/estimates?status=pending&request_priority=urgent" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
