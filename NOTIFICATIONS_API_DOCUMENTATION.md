# Notifications API Documentation

## Overview
Complete CRUD (Create, Read, Update, Delete) operations for the notifications table. All endpoints require authentication.

## Base URL
```
/api/v1/notifications
```

## Authentication
All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📝 **CREATE Notification**

### **Endpoint:**
```
POST /api/v1/notifications
```

### **Request Body:**
```json
{
  "google_review_link": "https://www.google.com/maps/place/your-business/reviews"
}
```

### **Validation Rules:**
- `google_review_link` (required): Must be a valid URL with http/https protocol, max 500 characters, should contain 'google.com'

### **Example Request:**
```bash
POST https://junkremovalapi.onrender.com/api/v1/notifications
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "google_review_link": "https://www.google.com/maps/place/williams-junk-removal/reviews"
}
```

### **Example Response:**
```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "notification": {
      "id": 1,
      "business_id": 1,
      "google_review_link": "https://www.google.com/maps/place/williams-junk-removal/reviews",
      "created_at": "2025-01-11T12:00:00.000Z",
      "updated_at": "2025-01-11T12:00:00.000Z"
    }
  }
}
```

---

## 📖 **READ Notifications**

### **Get All Notifications**
```
GET /api/v1/notifications
```

### **Query Parameters:**
- `limit` (optional): Number of notifications to return (default: 50, max: 100)
- `offset` (optional): Number of notifications to skip (default: 0)
- `sort` (optional): Field to sort by - `id`, `created_at`, `updated_at` (default: `created_at`)
- `order` (optional): Sort order - `ASC` or `DESC` (default: `DESC`)

### **Example Request:**
```bash
GET https://junkremovalapi.onrender.com/api/v1/notifications?limit=10&offset=0&sort=created_at&order=DESC
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Example Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "business_id": 1,
        "google_review_link": "https://www.google.com/maps/place/williams-junk-removal/reviews",
        "created_at": "2025-01-11T12:00:00.000Z",
        "updated_at": "2025-01-11T12:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 10,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### **Get Specific Notification**
```
GET /api/v1/notifications/:id
```

### **Example Request:**
```bash
GET https://junkremovalapi.onrender.com/api/v1/notifications/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Example Response:**
```json
{
  "success": true,
  "data": {
    "notification": {
      "id": 1,
      "business_id": 1,
      "google_review_link": "https://www.google.com/maps/place/williams-junk-removal/reviews",
      "created_at": "2025-01-11T12:00:00.000Z",
      "updated_at": "2025-01-11T12:00:00.000Z"
    }
  }
}
```

### **Get Notification Statistics**
```
GET /api/v1/notifications/stats
```

### **Example Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total_notifications": 5,
      "notifications_with_links": 4,
      "notifications_without_links": 1,
      "first_notification_date": "2025-01-01T00:00:00.000Z",
      "last_notification_date": "2025-01-11T12:00:00.000Z"
    }
  }
}
```

---

## ✏️ **UPDATE Notification**

### **Endpoint:**
```
PUT /api/v1/notifications/:id
```

### **Request Body:**
```json
{
  "google_review_link": "https://www.google.com/maps/place/updated-business/reviews"
}
```

### **Validation Rules:**
- `google_review_link` (optional): Must be a valid URL with http/https protocol, max 500 characters, should contain 'google.com'
- At least one field must be provided for update

### **Example Request:**
```bash
PUT https://junkremovalapi.onrender.com/api/v1/notifications/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "google_review_link": "https://www.google.com/maps/place/updated-williams-junk-removal/reviews"
}
```

### **Example Response:**
```json
{
  "success": true,
  "message": "Notification updated successfully",
  "data": {
    "notification": {
      "id": 1,
      "business_id": 1,
      "google_review_link": "https://www.google.com/maps/place/updated-williams-junk-removal/reviews",
      "created_at": "2025-01-11T12:00:00.000Z",
      "updated_at": "2025-01-11T12:30:00.000Z"
    }
  }
}
```

---

## 🗑️ **DELETE Notification**

### **Endpoint:**
```
DELETE /api/v1/notifications/:id
```

### **Example Request:**
```bash
DELETE https://junkremovalapi.onrender.com/api/v1/notifications/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Example Response:**
```json
{
  "success": true,
  "message": "Notification deleted successfully",
  "data": {
    "deletedId": 1
  }
}
```

---

## ❌ **Error Responses**

### **400 Bad Request**
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

### **401 Unauthorized**
```json
{
  "success": false,
  "message": "Access denied. No token provided.",
  "error": "NO_TOKEN"
}
```

### **404 Not Found**
```json
{
  "success": false,
  "message": "Notification not found",
  "error": "NOTIFICATION_NOT_FOUND"
}
```

### **500 Internal Server Error**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "INTERNAL_ERROR"
}
```

---

## 🔒 **Security Features**

1. **Authentication Required**: All endpoints require valid JWT token
2. **Business Isolation**: Users can only access their own notifications
3. **Input Validation**: All inputs are validated and sanitized
4. **URL Validation**: Google review links are validated for proper format
5. **SQL Injection Protection**: All queries use parameterized statements

---

## 📊 **Database Schema**

```sql
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  google_review_link VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_business_id (business_id),
  INDEX idx_created_at (created_at),
  INDEX idx_updated_at (updated_at),
  
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE ON UPDATE RESTRICT
);
```

---

## 🧪 **Testing Examples**

### **Create a notification:**
```bash
curl -X POST https://junkremovalapi.onrender.com/api/v1/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"google_review_link": "https://www.google.com/maps/place/test/reviews"}'
```

### **Get all notifications:**
```bash
curl -X GET https://junkremovalapi.onrender.com/api/v1/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Update a notification:**
```bash
curl -X PUT https://junkremovalapi.onrender.com/api/v1/notifications/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"google_review_link": "https://www.google.com/maps/place/updated/reviews"}'
```

### **Delete a notification:**
```bash
curl -X DELETE https://junkremovalapi.onrender.com/api/v1/notifications/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```
