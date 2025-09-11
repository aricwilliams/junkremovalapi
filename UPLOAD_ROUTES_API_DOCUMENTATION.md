# Upload Routes API Documentation

This document provides comprehensive information about the upload routes for file management, including logo uploads and general file uploads.

## Base URL
All routes are prefixed with `/api/v1/uploads`

## Authentication
All routes require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## Routes

### 1. Upload Single File
**POST** `/api/v1/uploads`

Upload a single file (including logos, images, videos, etc.)

#### Request
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```json
  {
    "file": "<file_object>",
    "title": "string (optional, max 255 chars)",
    "description": "string (optional, max 1000 chars)",
    "tags": "string (optional, JSON array as string)",
    "is_public": "string (optional, 'true' or 'false')",
    "metadata": "string (optional, JSON object as string)"
  }
  ```

#### File Requirements
- **Allowed Types**: Images (jpeg, jpg, png, gif, webp), Videos (webm, mp4, avi, mov, ogg, mpeg, 3gp, wmv)
- **Max Size**: 500MB per file
- **Field Name**: `file`

#### Response
**Success (201)**:
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": 123,
    "business_id": 456,
    "original_name": "logo.png",
    "file_name": "generated_filename.png",
    "file_path": "uploads/business_456/logo.png",
    "file_url": "https://s3.amazonaws.com/bucket/uploads/business_456/logo.png",
    "file_size": 1024000,
    "mime_type": "image/png",
    "file_type": "image",
    "duration": 0,
    "thumbnail_url": "https://s3.amazonaws.com/bucket/thumbnails/business_456/logo_thumb.png",
    "title": "Company Logo",
    "description": "Main company logo",
    "tags": ["logo", "branding"],
    "is_public": false,
    "metadata": {
      "width": 500,
      "height": 500
    },
    "view_count": 0,
    "download_count": 0,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error (400)**:
```json
{
  "success": false,
  "message": "No file provided"
}
```

---

### 2. Upload Multiple Files
**POST** `/api/v1/uploads/multiple`

Upload multiple files at once (max 10 files)

#### Request
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```json
  {
    "files": ["<file_object_1>", "<file_object_2>", ...],
    "title": "string (optional, max 255 chars)",
    "description": "string (optional, max 1000 chars)",
    "tags": "string (optional, JSON array as string)",
    "is_public": "string (optional, 'true' or 'false')",
    "metadata": "string (optional, JSON object as string)"
  }
  ```

#### Response
**Success (201)**:
```json
{
  "success": true,
  "message": "Processed 3 files: 2 successful, 1 failed",
  "data": {
    "total": 3,
    "successful": 2,
    "failed": 1,
    "uploads": [
      {
        "id": 123,
        "business_id": 456,
        "original_name": "logo1.png",
        "file_name": "generated_filename1.png",
        "file_path": "uploads/business_456/logo1.png",
        "file_url": "https://s3.amazonaws.com/bucket/uploads/business_456/logo1.png",
        "file_size": 1024000,
        "mime_type": "image/png",
        "file_type": "image",
        "duration": 0,
        "thumbnail_url": "https://s3.amazonaws.com/bucket/thumbnails/business_456/logo1_thumb.png",
        "title": "Logo 1",
        "description": "First logo",
        "tags": ["logo", "branding"],
        "is_public": false,
        "metadata": {},
        "view_count": 0,
        "download_count": 0,
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "errors": [
      {
        "filename": "invalid_file.txt",
        "error": "Invalid file type"
      }
    ]
  }
}
```

---

### 3. Get User's Uploads
**GET** `/api/v1/uploads`

Retrieve all uploads for the authenticated user

#### Query Parameters
```json
{
  "page": "number (optional, default: 1, min: 1)",
  "limit": "number (optional, default: 20, min: 1, max: 100)",
  "file_type": "string (optional, values: 'video', 'image', 'audio', 'other')",
  "is_public": "string (optional, values: 'true', 'false')",
  "search": "string (optional, max 100 chars)",
  "sort_field": "string (optional, values: 'created_at', 'title', 'file_size', 'view_count', 'download_count', default: 'created_at')",
  "sort_order": "string (optional, values: 'ASC', 'DESC', default: 'DESC')",
  "start_date": "string (optional, ISO date format)",
  "end_date": "string (optional, ISO date format)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "business_id": 456,
      "original_name": "logo.png",
      "file_name": "generated_filename.png",
      "file_path": "uploads/business_456/logo.png",
      "file_url": "https://s3.amazonaws.com/bucket/uploads/business_456/logo.png",
      "file_size": 1024000,
      "mime_type": "image/png",
      "file_type": "image",
      "duration": 0,
      "thumbnail_url": "https://s3.amazonaws.com/bucket/thumbnails/business_456/logo_thumb.png",
      "title": "Company Logo",
      "description": "Main company logo",
      "tags": ["logo", "branding"],
      "is_public": false,
      "metadata": {
        "width": 500,
        "height": 500
      },
      "view_count": 5,
      "download_count": 2,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "has_more": false
  }
}
```

---

### 4. Get Public Uploads
**GET** `/api/v1/uploads/public`

Retrieve all public uploads (no authentication required)

#### Query Parameters
```json
{
  "page": "number (optional, default: 1, min: 1)",
  "limit": "number (optional, default: 20, min: 1, max: 100)",
  "file_type": "string (optional, values: 'video', 'image', 'audio', 'other')",
  "search": "string (optional, max 100 chars)",
  "sort_field": "string (optional, values: 'created_at', 'title', 'file_size', 'view_count', 'download_count', default: 'created_at')",
  "sort_order": "string (optional, values: 'ASC', 'DESC', default: 'DESC')",
  "start_date": "string (optional, ISO date format)",
  "end_date": "string (optional, ISO date format)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "business_id": 456,
      "original_name": "public_logo.png",
      "file_name": "generated_filename.png",
      "file_path": "uploads/business_456/public_logo.png",
      "file_url": "https://s3.amazonaws.com/bucket/uploads/business_456/public_logo.png",
      "file_size": 1024000,
      "mime_type": "image/png",
      "file_type": "image",
      "duration": 0,
      "thumbnail_url": "https://s3.amazonaws.com/bucket/thumbnails/business_456/public_logo_thumb.png",
      "title": "Public Logo",
      "description": "Public company logo",
      "tags": ["logo", "public"],
      "is_public": true,
      "metadata": {},
      "view_count": 25,
      "download_count": 10,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "has_more": false
  }
}
```

---

### 5. Get Recent Uploads
**GET** `/api/v1/uploads/recent`

Get recent uploads for the authenticated user

#### Query Parameters
```json
{
  "limit": "number (optional, default: 10)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "business_id": 456,
      "original_name": "recent_logo.png",
      "file_name": "generated_filename.png",
      "file_path": "uploads/business_456/recent_logo.png",
      "file_url": "https://s3.amazonaws.com/bucket/uploads/business_456/recent_logo.png",
      "file_size": 1024000,
      "mime_type": "image/png",
      "file_type": "image",
      "duration": 0,
      "thumbnail_url": "https://s3.amazonaws.com/bucket/thumbnails/business_456/recent_logo_thumb.png",
      "title": "Recent Logo",
      "description": "Recently uploaded logo",
      "tags": ["logo", "recent"],
      "is_public": false,
      "metadata": {},
      "view_count": 0,
      "download_count": 0,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 6. Get Upload Statistics
**GET** `/api/v1/uploads/stats`

Get upload statistics for the authenticated user

#### Query Parameters
```json
{
  "start_date": "string (optional, ISO date format)",
  "end_date": "string (optional, ISO date format)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "total_uploads": 25,
    "total_size": 52428800,
    "by_type": {
      "image": 15,
      "video": 8,
      "audio": 2,
      "other": 0
    },
    "by_visibility": {
      "public": 5,
      "private": 20
    },
    "total_views": 150,
    "total_downloads": 75,
    "date_range": {
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-01-31T23:59:59.999Z"
    }
  }
}
```

---

### 7. Search Uploads
**GET** `/api/v1/uploads/search`

Search user's uploads by title, description, or tags

#### Query Parameters
```json
{
  "q": "string (required, search term, max 100 chars)",
  "file_type": "string (optional, values: 'video', 'image', 'audio', 'other')",
  "is_public": "string (optional, values: 'true', 'false')",
  "sort_field": "string (optional, values: 'created_at', 'title', 'file_size', 'view_count', 'download_count', default: 'created_at')",
  "sort_order": "string (optional, values: 'ASC', 'DESC', default: 'DESC')",
  "page": "number (optional, default: 1, min: 1)",
  "limit": "number (optional, default: 20, min: 1, max: 100)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "business_id": 456,
      "original_name": "search_result.png",
      "file_name": "generated_filename.png",
      "file_path": "uploads/business_456/search_result.png",
      "file_url": "https://s3.amazonaws.com/bucket/uploads/business_456/search_result.png",
      "file_size": 1024000,
      "mime_type": "image/png",
      "file_type": "image",
      "duration": 0,
      "thumbnail_url": "https://s3.amazonaws.com/bucket/thumbnails/business_456/search_result_thumb.png",
      "title": "Search Result Logo",
      "description": "Logo that matches search",
      "tags": ["logo", "search"],
      "is_public": false,
      "metadata": {},
      "view_count": 3,
      "download_count": 1,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "has_more": false
  }
}
```

---

### 8. Get Upload by ID
**GET** `/api/v1/uploads/:id`

Get a specific upload by its ID

#### Path Parameters
```json
{
  "id": "number (required, upload ID)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "business_id": 456,
    "original_name": "specific_logo.png",
    "file_name": "generated_filename.png",
    "file_path": "uploads/business_456/specific_logo.png",
    "file_url": "https://s3.amazonaws.com/bucket/uploads/business_456/specific_logo.png",
    "file_size": 1024000,
    "mime_type": "image/png",
    "file_type": "image",
    "duration": 0,
    "thumbnail_url": "https://s3.amazonaws.com/bucket/thumbnails/business_456/specific_logo_thumb.png",
    "title": "Specific Logo",
    "description": "Specific logo by ID",
    "tags": ["logo", "specific"],
    "is_public": false,
    "metadata": {},
    "view_count": 5,
    "download_count": 2,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error (404)**:
```json
{
  "success": false,
  "message": "Upload not found"
}
```

---

### 9. Update Upload
**PUT** `/api/v1/uploads/:id`

Update upload metadata (title, description, tags, etc.)

#### Path Parameters
```json
{
  "id": "number (required, upload ID)"
}
```

#### Request Body
```json
{
  "title": "string (optional, max 255 chars)",
  "description": "string (optional, max 1000 chars)",
  "tags": ["string (optional, array of strings, max 10 items, each max 50 chars)"],
  "is_public": "boolean (optional)",
  "metadata": "object (optional)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "message": "Upload updated successfully",
  "data": {
    "id": 123,
    "business_id": 456,
    "original_name": "updated_logo.png",
    "file_name": "generated_filename.png",
    "file_path": "uploads/business_456/updated_logo.png",
    "file_url": "https://s3.amazonaws.com/bucket/uploads/business_456/updated_logo.png",
    "file_size": 1024000,
    "mime_type": "image/png",
    "file_type": "image",
    "duration": 0,
    "thumbnail_url": "https://s3.amazonaws.com/bucket/thumbnails/business_456/updated_logo_thumb.png",
    "title": "Updated Logo Title",
    "description": "Updated description",
    "tags": ["logo", "updated"],
    "is_public": true,
    "metadata": {
      "updated": true
    },
    "view_count": 5,
    "download_count": 2,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 10. Delete Upload
**DELETE** `/api/v1/uploads/:id`

Delete an upload and remove it from storage

#### Path Parameters
```json
{
  "id": "number (required, upload ID)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "message": "Upload deleted successfully"
}
```

**Error (404)**:
```json
{
  "success": false,
  "message": "Upload not found"
}
```

---

### 11. View Upload
**GET** `/api/v1/uploads/:id/view`

View an upload (increments view count)

#### Path Parameters
```json
{
  "id": "number (required, upload ID)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "id": 123,
    "business_id": 456,
    "original_name": "viewed_logo.png",
    "file_name": "generated_filename.png",
    "file_path": "uploads/business_456/viewed_logo.png",
    "file_url": "https://s3.amazonaws.com/bucket/uploads/business_456/viewed_logo.png",
    "file_size": 1024000,
    "mime_type": "image/png",
    "file_type": "image",
    "duration": 0,
    "thumbnail_url": "https://s3.amazonaws.com/bucket/thumbnails/business_456/viewed_logo_thumb.png",
    "title": "Viewed Logo",
    "description": "Logo that was viewed",
    "tags": ["logo", "viewed"],
    "is_public": false,
    "metadata": {},
    "view_count": 6,
    "download_count": 2,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 12. Download Upload
**GET** `/api/v1/uploads/:id/download`

Get download URL for an upload (increments download count)

#### Path Parameters
```json
{
  "id": "number (required, upload ID)"
}
```

#### Response
**Success (200)**:
```json
{
  "success": true,
  "data": {
    "download_url": "https://s3.amazonaws.com/bucket/uploads/business_456/download_logo.png",
    "filename": "download_logo.png",
    "file_size": 1024000,
    "mime_type": "image/png"
  }
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
      "field": "title",
      "message": "Title must be at least 1 character long"
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
  "message": "Upload not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Failed to upload file",
  "error": "Detailed error message"
}
```

---

## Notes

1. **File Storage**: Files are stored in AWS S3 with signed URLs for private files
2. **File Types**: Supports images (JPEG, PNG, GIF, WebP) and videos (MP4, WebM, AVI, MOV, etc.)
3. **File Size**: Maximum 500MB per file
4. **Authentication**: All routes except `/public` require valid JWT token
5. **Pagination**: Most list endpoints support pagination with `page` and `limit` parameters
6. **Search**: Full-text search across title, description, and tags
7. **Sorting**: Multiple sort fields available with ASC/DESC order
8. **Filtering**: Filter by file type, visibility, and date ranges
9. **Thumbnails**: Automatic thumbnail generation for images and videos
10. **Analytics**: View and download count tracking
