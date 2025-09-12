# Public Estimate API Documentation

## Overview
This endpoint allows creating estimates without authentication, making it perfect for public-facing forms or customer self-service portals.

## Endpoint

### Create Public Estimate
**POST** `/api/v1/public/estimates`

Creates a new estimate without requiring authentication.

#### Request Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "full_name": "John Doe",
  "phone_number": "5551234567",
  "email_address": "john@example.com",
  "service_address": "123 Main St, City, State 12345",
  "location_on_property": "Garage",
  "approximate_volume": "Small truck load",
  "material_types": ["furniture", "electronics"],
  "photos": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
  "videos": ["https://example.com/video1.mp4"],
  "additional_notes": "Please call before coming",
  "ok_to_text": true,
  "request_priority": "standard"
}
```

#### Required Fields
- `full_name` (string): Customer's full name
- `phone_number` (string): Valid phone number
- `email_address` (string): Valid email address
- `service_address` (string): Service location address
- `location_on_property` (string): Where items are located on property
- `approximate_volume` (string): Estimated volume of items
- `material_types` (array): Array of material types

#### Optional Fields
- `existing_client_id` (number): ID of existing customer (if applicable)
- `ok_to_text` (boolean): Permission to send text messages
- `gate_code` (string): Gate access code
- `apartment_unit` (string): Apartment/unit number
- `preferred_date` (date): Preferred service date
- `preferred_time` (string): Preferred service time
- `access_considerations` (string): Access notes
- `photos` (array): Array of photo URLs (e.g., `["https://example.com/photo1.jpg"]`)
- `videos` (array): Array of video URLs (e.g., `["https://example.com/video1.mp4"]`)
- `approximate_item_count` (number): Estimated number of items
- `items_filled_water` (boolean): Items filled with water
- `items_filled_oil_fuel` (boolean): Items filled with oil/fuel
- `hazardous_materials` (boolean): Hazardous materials present
- `items_tied_bags` (boolean): Items in tied bags
- `oversized_items` (boolean): Oversized items present
- `mold_present` (boolean): Mold present
- `pests_present` (boolean): Pests present
- `sharp_objects` (boolean): Sharp objects present
- `heavy_lifting_required` (boolean): Heavy lifting required
- `disassembly_required` (boolean): Disassembly required
- `additional_notes` (string): Additional notes
- `request_donation_pickup` (boolean): Request donation pickup
- `request_demolition_addon` (boolean): Request demolition addon
- `how_did_you_hear` (string): How customer heard about service
- `request_priority` (string): Priority level (standard, high, urgent)
- `status` (string): Estimate status (defaults to "pending")
- `quote_amount` (number): Quote amount
- `amount` (number): Final amount
- `quote_notes` (string): Quote notes

#### Success Response (201 Created)
```json
{
  "success": true,
  "data": {
    "estimate": {
      "id": 7,
      "is_new_client": 1,
      "existing_client_id": null,
      "full_name": "John Doe",
      "phone_number": "5551234567",
      "email_address": "john@example.com",
      "ok_to_text": 1,
      "service_address": "123 Main St, City, State 12345",
      "gate_code": null,
      "apartment_unit": null,
      "preferred_date": null,
      "preferred_time": null,
      "location_on_property": "Garage",
      "approximate_volume": "Small truck load",
      "access_considerations": null,
      "photos": null,
      "videos": null,
      "material_types": ["furniture", "electronics"],
      "approximate_item_count": null,
      "items_filled_water": 0,
      "items_filled_oil_fuel": 0,
      "hazardous_materials": 0,
      "items_tied_bags": 0,
      "oversized_items": 0,
      "mold_present": 0,
      "pests_present": 0,
      "sharp_objects": 0,
      "heavy_lifting_required": 0,
      "disassembly_required": 0,
      "additional_notes": "Please call before coming",
      "request_donation_pickup": 0,
      "request_demolition_addon": 0,
      "how_did_you_hear": null,
      "request_priority": "standard",
      "status": "pending",
      "quote_amount": null,
      "amount": null,
      "quote_notes": null,
      "created_at": "2025-09-12T18:01:52.000Z",
      "updated_at": "2025-09-12T18:01:52.000Z",
      "existing_customer_name": null,
      "existing_customer_email": null,
      "existing_customer_phone": null
    }
  },
  "message": "Estimate created successfully",
  "timestamp": "2025-09-12T14:01:52.395Z"
}
```

#### Error Responses

**400 Bad Request - Validation Error**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "full_name",
      "message": "Full name is required",
      "value": ""
    }
  ]
}
```

**400 Bad Request - Customer Not Found**
```json
{
  "success": false,
  "message": "Existing client not found",
  "error": "CUSTOMER_NOT_FOUND",
  "timestamp": "2025-09-12T14:01:52.395Z"
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "INTERNAL_ERROR",
  "timestamp": "2025-09-12T14:01:52.395Z"
}
```

## Usage Examples

### cURL Example
```bash
curl -X POST http://localhost:3000/api/v1/public/estimates \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Jane Smith",
    "phone_number": "5559876543",
    "email_address": "jane@example.com",
    "service_address": "456 Oak Ave, City, State 54321",
    "location_on_property": "Basement",
    "approximate_volume": "Medium truck load",
    "material_types": ["appliances", "furniture"],
    "additional_notes": "Items are in basement, need to go down stairs"
  }'
```

### JavaScript/Fetch Example
```javascript
const response = await fetch('/api/v1/public/estimates', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    full_name: "Mike Johnson",
    phone_number: "5555551234",
    email_address: "mike@example.com",
    service_address: "789 Pine St, City, State 67890",
    location_on_property: "Garage and backyard",
    approximate_volume: "Large truck load",
    material_types: ["yard waste", "old furniture"],
    additional_notes: "Gate code is 1234"
  })
});

const data = await response.json();
console.log(data);
```

## Key Differences from Authenticated Endpoint

1. **No Authentication Required**: This endpoint can be called without a JWT token
2. **Public Access**: Perfect for public-facing forms and customer self-service
3. **Same Validation**: Uses the same validation rules as the authenticated endpoint
4. **Same Response Format**: Returns the same data structure as the authenticated endpoint
5. **Same Database Storage**: Estimates are stored in the same `estimates` table

## Security Considerations

- No authentication required, so this endpoint is publicly accessible
- Input validation is still enforced to prevent malicious data
- Rate limiting should be considered for production use
- Consider adding CAPTCHA for public forms to prevent spam

## Integration Notes

- This endpoint is perfect for embedding in public websites
- Can be used for customer self-service estimate requests
- Integrates seamlessly with existing estimate management system
- Estimates created through this endpoint appear in the regular estimate list (when accessed with authentication)
