# 📁 Upload API Frontend Integration Guide

This comprehensive guide provides everything your frontend team needs to integrate with the Junk Removal API's file upload system, including images and videos with AWS S3 storage.

## 🚀 Quick Start

### Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://junkremovalapi.onrender.com`

### Authentication
All upload endpoints require JWT authentication. Include the token in the Authorization header:
```javascript
headers: {
  'Authorization': `Bearer ${token}`
}
```

## 📋 API Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/uploads` | Upload single file | ✅ |
| `POST` | `/api/v1/uploads/multiple` | Upload multiple files | ✅ |
| `GET` | `/api/v1/uploads` | Get user's uploads | ✅ |
| `GET` | `/api/v1/uploads/public` | Get public uploads | ❌ |
| `GET` | `/api/v1/uploads/recent` | Get recent uploads | ✅ |
| `GET` | `/api/v1/uploads/stats` | Get upload statistics | ✅ |
| `GET` | `/api/v1/uploads/search` | Search uploads | ✅ |
| `GET` | `/api/v1/uploads/:id` | Get single upload | ✅ |
| `PUT` | `/api/v1/uploads/:id` | Update upload | ✅ |
| `DELETE` | `/api/v1/uploads/:id` | Delete upload | ✅ |
| `GET` | `/api/v1/uploads/:id/view` | View upload (track views) | ✅ |
| `GET` | `/api/v1/uploads/:id/download` | Download upload | ✅ |

## 📤 Upload Endpoints

### 1. Upload Single File

**Endpoint**: `POST /api/v1/uploads`

**Request**: FormData with file and metadata

```javascript
const uploadSingleFile = async (file, metadata = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', metadata.title || file.name);
  formData.append('description', metadata.description || '');
  formData.append('tags', JSON.stringify(metadata.tags || []));
  formData.append('is_public', metadata.is_public ? 'true' : 'false');
  formData.append('metadata', JSON.stringify(metadata.metadata || {}));

  const response = await fetch('/api/v1/uploads', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return await response.json();
};
```

**Response**:
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "id": 1,
    "business_id": 1,
    "original_name": "video.mp4",
    "file_name": "1703123456789-abc123.mp4",
    "file_path": "videos/1703123456789-abc123.mp4",
    "file_url": "https://bucket.s3.amazonaws.com/videos/1703123456789-abc123.mp4",
    "file_size": 15728640,
    "mime_type": "video/mp4",
    "file_type": "video",
    "duration": 120,
    "thumbnail_url": "https://bucket.s3.amazonaws.com/thumbnails/1703123456789-abc123-thumb.jpg",
    "title": "My Video",
    "description": "Video description",
    "tags": ["demo", "test"],
    "is_public": false,
    "metadata": {},
    "view_count": 0,
    "download_count": 0,
    "created_at": "2023-12-21T10:30:00.000Z",
    "updated_at": "2023-12-21T10:30:00.000Z"
  }
}
```

### 2. Upload Multiple Files

**Endpoint**: `POST /api/v1/uploads/multiple`

```javascript
const uploadMultipleFiles = async (files, metadata = {}) => {
  const formData = new FormData();
  
  // Add all files
  files.forEach(file => {
    formData.append('files', file);
  });
  
  formData.append('title', metadata.title || 'Multiple Files');
  formData.append('description', metadata.description || '');
  formData.append('tags', JSON.stringify(metadata.tags || []));
  formData.append('is_public', metadata.is_public ? 'true' : 'false');
  formData.append('metadata', JSON.stringify(metadata.metadata || {}));

  const response = await fetch('/api/v1/uploads/multiple', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  return await response.json();
};
```

**Response**:
```json
{
  "success": true,
  "message": "Processed 3 files: 3 successful, 0 failed",
  "data": {
    "total": 3,
    "successful": 3,
    "failed": 0,
    "results": [
      {
        "success": true,
        "file": { /* upload object */ },
        "originalName": "image1.jpg"
      },
      {
        "success": true,
        "file": { /* upload object */ },
        "originalName": "image2.jpg"
      },
      {
        "success": true,
        "file": { /* upload object */ },
        "originalName": "video.mp4"
      }
    ]
  }
}
```

## 📥 Retrieval Endpoints

### 3. Get Business's Uploads

**Endpoint**: `GET /api/v1/uploads`

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `file_type` (string): Filter by type (`video`, `image`, `audio`, `other`)
- `is_public` (boolean): Filter by public/private
- `search` (string): Search in title, description, filename
- `sort_field` (string): Sort field (`created_at`, `title`, `file_size`, `view_count`, `download_count`)
- `sort_order` (string): Sort order (`ASC`, `DESC`)
- `start_date` (ISO date): Filter by date range
- `end_date` (ISO date): Filter by date range

```javascript
const getBusinessUploads = async (options = {}) => {
  const params = new URLSearchParams();
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });

  const response = await fetch(`/api/v1/uploads?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};

// Usage examples
const recentUploads = await getBusinessUploads({ limit: 10 });
const videoUploads = await getBusinessUploads({ file_type: 'video' });
const publicUploads = await getBusinessUploads({ is_public: true });
const searchResults = await getBusinessUploads({ search: 'vacation' });
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "business_id": 1,
      "original_name": "video.mp4",
      "file_name": "1703123456789-abc123.mp4",
      "file_path": "videos/1703123456789-abc123.mp4",
      "file_url": "https://signed-url-here",
      "file_size": 15728640,
      "mime_type": "video/mp4",
      "file_type": "video",
      "duration": 120,
      "thumbnail_url": "https://bucket.s3.amazonaws.com/thumbnails/1703123456789-abc123-thumb.jpg",
      "title": "My Video",
      "description": "Video description",
      "tags": ["demo", "test"],
      "is_public": false,
      "metadata": {},
      "view_count": 5,
      "download_count": 2,
      "created_at": "2023-12-21T10:30:00.000Z",
      "updated_at": "2023-12-21T10:30:00.000Z"
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

### 4. Get Public Uploads

**Endpoint**: `GET /api/v1/uploads/public`

Same query parameters as user uploads, but returns only public files.

```javascript
const getPublicUploads = async (options = {}) => {
  const params = new URLSearchParams();
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });

  const response = await fetch(`/api/v1/uploads/public?${params}`);
  return await response.json();
};
```

### 5. Get Single Upload

**Endpoint**: `GET /api/v1/uploads/:id`

```javascript
const getUploadById = async (id) => {
  const response = await fetch(`/api/v1/uploads/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

### 6. Get Recent Uploads

**Endpoint**: `GET /api/v1/uploads/recent`

**Query Parameters**:
- `limit` (number): Number of recent uploads (default: 10)

```javascript
const getRecentUploads = async (limit = 10) => {
  const response = await fetch(`/api/v1/uploads/recent?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

## 🔍 Search & Statistics

### 7. Search Business Uploads

**Endpoint**: `GET /api/v1/uploads/search`

**Query Parameters**:
- `q` (string, required): Search term
- `file_type` (string): Filter by type
- `is_public` (boolean): Filter by public/private
- `sort_field` (string): Sort field
- `sort_order` (string): Sort order
- `page` (number): Page number
- `limit` (number): Items per page

```javascript
const searchUploads = async (searchTerm, options = {}) => {
  const params = new URLSearchParams();
  params.append('q', searchTerm);
  
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });

  const response = await fetch(`/api/v1/uploads/search?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

### 8. Get Business Upload Statistics

**Endpoint**: `GET /api/v1/uploads/stats`

**Query Parameters**:
- `start_date` (ISO date): Start date for statistics
- `end_date` (ISO date): End date for statistics

```javascript
const getUploadStats = async (dateRange = {}) => {
  const params = new URLSearchParams();
  
  if (dateRange.start_date) params.append('start_date', dateRange.start_date);
  if (dateRange.end_date) params.append('end_date', dateRange.end_date);

  const response = await fetch(`/api/v1/uploads/stats?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

**Response**:
```json
{
  "success": true,
  "data": {
    "total_uploads": 25,
    "video_count": 10,
    "image_count": 15,
    "public_count": 5,
    "private_count": 20,
    "total_size": 524288000,
    "total_views": 150,
    "total_downloads": 45,
    "avg_file_size": 20971520
  }
}
```

## ✏️ Update & Delete

### 9. Update Upload

**Endpoint**: `PUT /api/v1/uploads/:id`

**Request Body**:
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "tags": ["new", "tag"],
  "is_public": true,
  "metadata": {
    "category": "demo"
  }
}
```

```javascript
const updateUpload = async (id, updateData) => {
  const response = await fetch(`/api/v1/uploads/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updateData)
  });

  return await response.json();
};
```

### 10. Delete Upload

**Endpoint**: `DELETE /api/v1/uploads/:id`

```javascript
const deleteUpload = async (id) => {
  const response = await fetch(`/api/v1/uploads/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

## 👁️ View & Download Tracking

### 11. View Upload (Track Views)

**Endpoint**: `GET /api/v1/uploads/:id/view`

Increments the view count and returns the upload with signed URL.

```javascript
const viewUpload = async (id) => {
  const response = await fetch(`/api/v1/uploads/${id}/view`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

### 12. Download Upload (Track Downloads)

**Endpoint**: `GET /api/v1/uploads/:id/download`

Increments the download count and returns a signed download URL.

```javascript
const downloadUpload = async (id) => {
  const response = await fetch(`/api/v1/uploads/${id}/download`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const result = await response.json();
  
  if (result.success) {
    // Create download link
    const link = document.createElement('a');
    link.href = result.data.download_url;
    link.download = result.data.filename;
    link.click();
  }
  
  return result;
};
```

## 🎨 React Component Examples

### File Upload Component

```jsx
import React, { useState } from 'react';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        'video/mp4', 'video/webm', 'video/avi', 'video/mov',
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please select a video or image file.');
        return;
      }
      
      // Validate file size (500MB limit)
      if (selectedFile.size > 500 * 1024 * 1024) {
        setError('File size too large. Maximum size is 500MB.');
        return;
      }
      
      setFile(selectedFile);
      setTitle(selectedFile.name);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('description', description);
      formData.append('tags', JSON.stringify(tags));
      formData.append('is_public', isPublic ? 'true' : 'false');

      const token = localStorage.getItem('token');

      const response = await fetch('/api/v1/uploads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      
      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setTags([]);
      setIsPublic(false);
      
      alert('File uploaded successfully!');
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload">
      <h2>Upload File</h2>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="file">File:</label>
          <input
            type="file"
            id="file"
            accept="video/*,image/*"
            onChange={handleFileChange}
            required
          />
          {file && (
            <p>Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
          )}
        </div>

        <div>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter file title"
          />
        </div>

        <div>
          <label htmlFor="description">Description:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter file description"
          />
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Make this file public
          </label>
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" disabled={uploading || !file}>
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>
    </div>
  );
};

export default FileUpload;
```

### Upload Gallery Component

```jsx
import React, { useState, useEffect } from 'react';

const UploadGallery = () => {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    file_type: '',
    is_public: '',
    search: ''
  });

  useEffect(() => {
    fetchUploads();
  }, [filters]);

  const fetchUploads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/uploads?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch uploads');
      }

      const result = await response.json();
      setUploads(result.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/uploads/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete upload');
      }

      setUploads(uploads.filter(upload => upload.id !== id));
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDownload = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/uploads/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const result = await response.json();
      
      if (result.success) {
        const link = document.createElement('a');
        link.href = result.data.download_url;
        link.download = result.data.filename;
        link.click();
      }
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="upload-gallery">
      <h2>Business Uploads</h2>
      
      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search uploads..."
          value={filters.search}
          onChange={(e) => setFilters({...filters, search: e.target.value})}
        />
        
        <select
          value={filters.file_type}
          onChange={(e) => setFilters({...filters, file_type: e.target.value})}
        >
          <option value="">All Types</option>
          <option value="video">Videos</option>
          <option value="image">Images</option>
        </select>
        
        <select
          value={filters.is_public}
          onChange={(e) => setFilters({...filters, is_public: e.target.value})}
        >
          <option value="">All</option>
          <option value="true">Public</option>
          <option value="false">Private</option>
        </select>
      </div>

      {/* Upload Grid */}
      <div className="upload-grid">
        {uploads.map(upload => (
          <div key={upload.id} className="upload-card">
            {upload.file_type === 'video' && upload.thumbnail_url ? (
              <img src={upload.thumbnail_url} alt={upload.title} />
            ) : upload.file_type === 'image' ? (
              <img src={upload.file_url} alt={upload.title} />
            ) : (
              <div className="file-icon">📁</div>
            )}
            
            <div className="upload-info">
              <h3>{upload.title}</h3>
              <p>{upload.description}</p>
              <div className="upload-meta">
                <span>{(upload.file_size / 1024 / 1024).toFixed(2)} MB</span>
                <span>{upload.view_count} views</span>
                <span>{upload.download_count} downloads</span>
              </div>
              
              <div className="upload-actions">
                <button onClick={() => handleDownload(upload.id)}>
                  Download
                </button>
                <button onClick={() => handleDelete(upload.id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadGallery;
```

## 🎯 File Type Support

### Supported Video Formats
- **WebM** (`.webm`) - Recommended for web
- **MP4** (`.mp4`) - Universal compatibility
- **AVI** (`.avi`) - Windows standard
- **MOV** (`.mov`) - Apple QuickTime
- **OGG** (`.ogg`) - Open source
- **3GP** (`.3gp`) - Mobile format
- **WMV** (`.wmv`) - Windows Media

### Supported Image Formats
- **JPEG** (`.jpg`, `.jpeg`) - Most common
- **PNG** (`.png`) - With transparency
- **GIF** (`.gif`) - Animated images
- **WebP** (`.webp`) - Modern format
- **SVG** (`.svg`) - Vector graphics

### File Size Limits
- **Maximum file size**: 500MB per file
- **Multiple uploads**: Up to 10 files at once
- **Total request size**: 500MB

## 🔒 Security & Access Control

### Authentication
- All upload endpoints require JWT authentication
- Token must be included in Authorization header
- Tokens expire after 24 hours
- Uploads are associated with the business from the JWT token

### File Access
- **Private files**: Require authentication and signed URLs
- **Public files**: Accessible without authentication
- **Signed URLs**: Expire after 1 hour for security

### File Validation
- File type validation on both client and server
- File size limits enforced
- Malicious file detection

## 📊 Error Handling

### Common Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (access denied)
- `404` - Not Found (upload doesn't exist)
- `413` - Payload Too Large (file too big)
- `415` - Unsupported Media Type (invalid file type)
- `500` - Internal Server Error (server issues)

### Validation Errors
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

## 🚀 Performance Tips

### Frontend Optimization
1. **File Compression**: Compress images before upload
2. **Chunked Uploads**: For large files, consider implementing chunked uploads
3. **Progress Indicators**: Show upload progress to users
4. **Lazy Loading**: Load uploads on demand
5. **Caching**: Cache upload metadata locally

### Backend Features
1. **Automatic Thumbnails**: Generated for video files
2. **Signed URLs**: Secure access to private files
3. **CDN Integration**: Files served from AWS S3 CDN
4. **Metadata Extraction**: Automatic file information extraction

## 🔧 Configuration

### Environment Variables Required
```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Optional
FRONTEND_URL=https://your-frontend-domain.com
```

### CORS Configuration
The API is configured to accept requests from:
- `https://junkremovalappplanner.com`
- `https://www.junkremovalappplanner.com`
- Development URLs (localhost, 127.0.0.1)

## 📱 Mobile Considerations

### File Upload on Mobile
- Use `input[type="file"]` with `accept` attribute
- Handle camera capture with `capture` attribute
- Consider file size limits on mobile networks
- Implement retry logic for failed uploads

### Example Mobile File Input
```html
<!-- Camera capture -->
<input type="file" accept="image/*" capture="camera" />

<!-- Video capture -->
<input type="file" accept="video/*" capture="camcorder" />

<!-- Gallery selection -->
<input type="file" accept="image/*,video/*" multiple />
```

## 🎨 Styling Examples

### CSS for Upload Components
```css
.file-upload {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.file-upload form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.file-upload input,
.file-upload textarea {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.file-upload button {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.file-upload button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.upload-gallery {
  padding: 20px;
}

.upload-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.upload-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.upload-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.upload-info {
  padding: 15px;
}

.upload-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.upload-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.upload-actions button:first-child {
  background: #28a745;
  color: white;
}

.upload-actions button:last-child {
  background: #dc3545;
  color: white;
}
```

## 📚 Additional Resources

### API Documentation
- **Swagger/OpenAPI**: Available at `/api/v1/docs` (if implemented)
- **Postman Collection**: Available for testing endpoints

### Support
- **Error Logs**: Check browser console and network tab
- **Server Logs**: Available in production monitoring
- **Rate Limits**: 100 requests per minute per user

### Updates
- **API Versioning**: Current version is v1
- **Backward Compatibility**: Maintained for at least 6 months
- **New Features**: Announced via changelog

---

This guide provides everything needed to integrate file uploads into your frontend application. For additional support or questions, please refer to the API documentation or contact the development team.
