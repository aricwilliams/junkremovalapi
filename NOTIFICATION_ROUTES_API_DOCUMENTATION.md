# Notification Routes API Documentation

This document provides comprehensive information about the notification routes for managing Google review links and notifications.

## Base URL
All routes are prefixed with `/api/v1/notifications`

## Authentication
All routes require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Routes

### 1. Create Notification
**POST** `/api/v1/notifications`

Create a new notification with a Google review link

#### Request Body
```json
{
  "google_review_link": "string (required, valid Google URL, max 500 chars)"
}
```

#### Validation Rules
- `google_review_link` must be a valid URL with http or https protocol
- URL must contain 'google.com'
- Maximum length: 500 characters
- Required field

#### Response
**Success (201)**:
```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "notification": {
      "id": 123,
      "business_id": 456,
      "google_review_link": "https://www.google.com/maps/place/Your+Business/reviews",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error (400) - Missing Required Field**:
```json
{
  "success": false,
  "message": "Google review link is required",
  "error": "MISSING_REQUIRED_FIELD"
}
```

**Error (400) - Invalid URL Format**:
```json
{
  "success": false,
  "message": "Invalid URL format for Google review link",
  "error": "INVALID_URL_FORMAT"
}
```

**Error (400) - Validation Failed**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "google_review_link",
      "message": "Google review link should be a Google URL",
      "value": "https://example.com"
    }
  ]
}
```

---

### 2. Get All Notifications
**GET** `/api/v1/notifications`

Retrieve all notifications for the authenticated business

#### Query Parameters
```json
{
  "limit": "number (optional, default: 50)",
  "offset": "number (optional, default: 0)",
  "sort": "string (optional, values: 'id', 'created_at', 'updated_at', default: 'created_at')",
  "order": "string (optional, values: 'ASC', 'DESC', default: 'DESC')"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 123,
        "business_id": 456,
        "google_review_link": "https://www.google.com/maps/place/Your+Business/reviews",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": 124,
        "business_id": 456,
        "google_review_link": "https://www.google.com/maps/place/Your+Business/reviews?hl=en",
        "created_at": "2024-01-14T09:15:00.000Z",
        "updated_at": "2024-01-14T09:15:00.000Z"
      }
    ],
    "pagination": {
      "total": 2,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

---

### 3. Get Notification Statistics
**GET** `/api/v1/notifications/stats`

Get notification statistics for the authenticated business

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_notifications": 15,
      "notifications_with_links": 12,
      "notifications_without_links": 3,
      "first_notification_date": "2024-01-01T08:00:00.000Z",
      "last_notification_date": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### 4. Get Notification by ID
**GET** `/api/v1/notifications/:id`

Get a specific notification by its ID

#### Path Parameters
```json
{
  "id": "number (required, notification ID)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": 123,
      "business_id": 456,
      "google_review_link": "https://www.google.com/maps/place/Your+Business/reviews",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error (404)**:
```json
{
  "success": false,
  "message": "Notification not found",
  "error": "NOTIFICATION_NOT_FOUND"
}
```

---

### 5. Update Notification
**PUT** `/api/v1/notifications/:id`

Update a notification's Google review link

#### Path Parameters
```json
{
  "id": "number (required, notification ID)"
}
```

#### Request Body
```json
{
  "google_review_link": "string (optional, valid Google URL, max 500 chars)"
}
```

#### Validation Rules
- `google_review_link` must be a valid URL with http or https protocol (if provided)
- URL must contain 'google.com' (if provided)
- Maximum length: 500 characters
- At least one field must be provided for update

#### Response
**Success (200)**:
```json
{
  "success": true,
  "message": "Notification updated successfully",
  "data": {
    "notification": {
      "id": 123,
      "business_id": 456,
      "google_review_link": "https://www.google.com/maps/place/Your+Business/reviews?updated=true",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

**Error (400) - No Valid Fields**:
```json
{
  "success": false,
  "message": "No valid fields to update",
  "error": "NO_VALID_FIELDS"
}
```

**Error (400) - Validation Failed**:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "google_review_link",
      "message": "Google review link must be a valid URL with http or https protocol",
      "value": "invalid-url"
    }
  ]
}
```

**Error (404)**:
```json
{
  "success": false,
  "message": "Notification not found",
  "error": "NOTIFICATION_NOT_FOUND"
}
```

---

### 6. Delete Notification
**DELETE** `/api/v1/notifications/:id`

Delete a notification

#### Path Parameters
```json
{
  "id": "number (required, notification ID)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "data": {
    "deletedId": 123
  }
}
```

**Error (404)**:
```json
{
  "success": false,
  "message": "Notification not found",
  "error": "NOTIFICATION_NOT_FOUND"
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "google_review_link",
      "message": "Google review link must be a valid URL with http or https protocol",
      "value": "invalid-url"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Access denied. Invalid token."
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Notification not found",
  "error": "NOTIFICATION_NOT_FOUND"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message"
}
```

---

## Data Models

### Notification Object
```json
{
  "id": "number (auto-increment primary key)",
  "business_id": "number (foreign key to businesses table)",
  "google_review_link": "string (Google review URL, max 500 chars)",
  "created_at": "string (ISO 8601 timestamp)",
  "updated_at": "string (ISO 8601 timestamp)"
}
```

### Pagination Object
```json
{
  "total": "number (total number of records)",
  "limit": "number (number of records per page)",
  "offset": "number (number of records to skip)",
  "hasMore": "boolean (whether there are more records)"
}
```

### Statistics Object
```json
{
  "total_notifications": "number (total count of notifications)",
  "notifications_with_links": "number (count of notifications with Google review links)",
  "notifications_without_links": "number (count of notifications without Google review links)",
  "first_notification_date": "string (ISO 8601 timestamp of first notification)",
  "last_notification_date": "string (ISO 8601 timestamp of last notification)"
}
```

---

## Usage Examples

### Frontend Integration Examples

#### Create Notification
```javascript
const createNotification = async (googleReviewLink) => {
  const response = await fetch('/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      google_review_link: googleReviewLink
    })
  });
  
  const data = await response.json();
  return data;
};
```

#### Get All Notifications
```javascript
const getNotifications = async (limit = 50, offset = 0) => {
  const response = await fetch(`/api/v1/notifications?limit=${limit}&offset=${offset}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data;
};
```

#### Update Notification
```javascript
const updateNotification = async (id, googleReviewLink) => {
  const response = await fetch(`/api/v1/notifications/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      google_review_link: googleReviewLink
    })
  });
  
  const data = await response.json();
  return data;
};
```

#### Delete Notification
```javascript
const deleteNotification = async (id) => {
  const response = await fetch(`/api/v1/notifications/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const data = await response.json();
  return data;
};
```

---

## Notes

1. **Authentication**: All routes require valid JWT token in Authorization header
2. **Business Isolation**: Users can only access notifications belonging to their business
3. **URL Validation**: Google review links must be valid URLs containing 'google.com'
4. **Pagination**: List endpoints support pagination with limit and offset
5. **Sorting**: Notifications can be sorted by id, created_at, or updated_at
6. **Statistics**: Provides comprehensive statistics about notification usage
7. **Error Handling**: Detailed error messages with specific error codes
8. **Data Integrity**: Automatic timestamp management for created_at and updated_at
9. **Validation**: Comprehensive input validation with detailed error messages
10. **Security**: Business-level access control ensures data isolation
