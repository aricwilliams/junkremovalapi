# Announcements API Documentation

## Overview

The Announcements API provides endpoints for managing system announcements. Announcements can be created, updated, deleted, and toggled between visible and hidden states.

## Base URL
```
http://localhost:3000/api/v1/announcements
```

## Database Schema

```sql
CREATE TABLE announcements (
    id int unsigned AUTO_INCREMENT PRIMARY KEY,
    message text NOT NULL,
    is_visible tinyint(1) DEFAULT 0
);
```

## API Endpoints

### 1. Get All Announcements

**Endpoint:** `GET /api/v1/announcements`

**Description:** Retrieve all announcements with optional filtering.

**Query Parameters:**
- `visible_only` (boolean, optional): If `true`, only returns visible announcements

**Response:**
```json
{
  "success": true,
  "data": {
    "announcements": [
      {
        "id": 1,
        "message": "Welcome to Junk Removal Pro!",
        "is_visible": 1
      },
      {
        "id": 2,
        "message": "System maintenance scheduled for tomorrow",
        "is_visible": 0
      }
    ]
  },
  "count": 2,
  "timestamp": "2025-01-12T20:33:57.781Z"
}
```

**Frontend Example:**
```javascript
// Get all announcements
fetch('/api/v1/announcements')
  .then(response => response.json())
  .then(data => {
    console.log('All announcements:', data.data.announcements);
  });

// Get only visible announcements
fetch('/api/v1/announcements?visible_only=true')
  .then(response => response.json())
  .then(data => {
    console.log('Visible announcements:', data.data.announcements);
  });
```

### 2. Get Announcement by ID

**Endpoint:** `GET /api/v1/announcements/:id`

**Description:** Retrieve a specific announcement by its ID.

**Path Parameters:**
- `id` (integer, required): The announcement ID

**Response:**
```json
{
  "success": true,
  "data": {
    "announcement": {
      "id": 1,
      "message": "Welcome to Junk Removal Pro!",
      "is_visible": 1
    }
  },
  "timestamp": "2025-01-12T20:33:57.781Z"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Announcement not found",
  "error": "ANNOUNCEMENT_NOT_FOUND"
}
```

**Frontend Example:**
```javascript
const announcementId = 1;
fetch(`/api/v1/announcements/${announcementId}`)
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Announcement:', data.data.announcement);
    } else {
      console.error('Error:', data.message);
    }
  });
```

### 3. Create New Announcement

**Endpoint:** `POST /api/v1/announcements`

**Description:** Create a new announcement.

**Request Body:**
```json
{
  "message": "New system update available!",
  "is_visible": true
}
```

**Required Fields:**
- `message` (string): The announcement text (1-1000 characters)

**Optional Fields:**
- `is_visible` (boolean): Whether the announcement is visible (default: false)

**Response (201):**
```json
{
  "success": true,
  "message": "Announcement created successfully",
  "data": {
    "announcement": {
      "id": 3,
      "message": "New system update available!",
      "is_visible": 1
    }
  },
  "timestamp": "2025-01-12T20:33:57.781Z"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "message",
      "message": "Message is required"
    }
  ],
  "error": "VALIDATION_ERROR"
}
```

**Frontend Example:**
```javascript
const newAnnouncement = {
  message: "New system update available!",
  is_visible: true
};

fetch('/api/v1/announcements', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newAnnouncement)
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Created announcement:', data.data.announcement);
  } else {
    console.error('Error:', data.errors);
  }
});
```

### 4. Update Announcement

**Endpoint:** `PUT /api/v1/announcements/:id`

**Description:** Update an existing announcement.

**Path Parameters:**
- `id` (integer, required): The announcement ID

**Request Body:**
```json
{
  "message": "Updated announcement message",
  "is_visible": false
}
```

**Fields (all optional):**
- `message` (string): Updated announcement text (1-1000 characters)
- `is_visible` (boolean): Updated visibility status

**Response:**
```json
{
  "success": true,
  "message": "Announcement updated successfully",
  "data": {
    "announcement": {
      "id": 1,
      "message": "Updated announcement message",
      "is_visible": 0
    }
  },
  "timestamp": "2025-01-12T20:33:57.781Z"
}
```

**Frontend Example:**
```javascript
const announcementId = 1;
const updates = {
  message: "Updated announcement message",
  is_visible: false
};

fetch(`/api/v1/announcements/${announcementId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updates)
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Updated announcement:', data.data.announcement);
  } else {
    console.error('Error:', data.message);
  }
});
```

### 5. Delete Announcement

**Endpoint:** `DELETE /api/v1/announcements/:id`

**Description:** Delete an announcement permanently.

**Path Parameters:**
- `id` (integer, required): The announcement ID

**Response:**
```json
{
  "success": true,
  "message": "Announcement deleted successfully",
  "data": {
    "deleted_announcement": {
      "id": 1,
      "message": "Welcome to Junk Removal Pro!",
      "is_visible": 1
    }
  },
  "timestamp": "2025-01-12T20:33:57.781Z"
}
```

**Frontend Example:**
```javascript
const announcementId = 1;

fetch(`/api/v1/announcements/${announcementId}`, {
  method: 'DELETE'
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Deleted announcement:', data.data.deleted_announcement);
  } else {
    console.error('Error:', data.message);
  }
});
```

### 6. Toggle Announcement Visibility

**Endpoint:** `PATCH /api/v1/announcements/:id/toggle-visibility`

**Description:** Toggle the visibility status of an announcement.

**Path Parameters:**
- `id` (integer, required): The announcement ID

**Response:**
```json
{
  "success": true,
  "message": "Announcement hidden",
  "data": {
    "announcement": {
      "id": 1,
      "message": "Welcome to Junk Removal Pro!",
      "is_visible": 0
    }
  },
  "timestamp": "2025-01-12T20:33:57.781Z"
}
```

**Frontend Example:**
```javascript
const announcementId = 1;

fetch(`/api/v1/announcements/${announcementId}/toggle-visibility`, {
  method: 'PATCH'
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    console.log('Toggled announcement:', data.data.announcement);
    console.log('New visibility:', data.data.announcement.is_visible ? 'Visible' : 'Hidden');
  } else {
    console.error('Error:', data.message);
  }
});
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "message",
      "message": "Message cannot be empty"
    }
  ],
  "error": "VALIDATION_ERROR"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Announcement not found",
  "error": "ANNOUNCEMENT_NOT_FOUND"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "INTERNAL_ERROR"
}
```

## Frontend Integration Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

const AnnouncementsManager = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // Fetch all announcements
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/announcements');
      const data = await response.json();
      if (data.success) {
        setAnnouncements(data.data.announcements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new announcement
  const createAnnouncement = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch('/api/v1/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: newMessage,
          is_visible: isVisible
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        setIsVisible(false);
        fetchAnnouncements(); // Refresh list
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  // Toggle visibility
  const toggleVisibility = async (id) => {
    try {
      const response = await fetch(`/api/v1/announcements/${id}/toggle-visibility`, {
        method: 'PATCH'
      });

      const data = await response.json();
      if (data.success) {
        fetchAnnouncements(); // Refresh list
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  // Delete announcement
  const deleteAnnouncement = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const response = await fetch(`/api/v1/announcements/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      if (data.success) {
        fetchAnnouncements(); // Refresh list
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div className="announcements-manager">
      <h2>Announcements Manager</h2>
      
      {/* Create new announcement */}
      <div className="create-form">
        <h3>Create New Announcement</h3>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Enter announcement message..."
          rows="3"
        />
        <label>
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(e) => setIsVisible(e.target.checked)}
          />
          Make visible immediately
        </label>
        <button onClick={createAnnouncement}>Create Announcement</button>
      </div>

      {/* List announcements */}
      <div className="announcements-list">
        <h3>All Announcements</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="announcements">
            {announcements.map(announcement => (
              <div key={announcement.id} className="announcement">
                <div className="announcement-content">
                  <p>{announcement.message}</p>
                  <span className={`status ${announcement.is_visible ? 'visible' : 'hidden'}`}>
                    {announcement.is_visible ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <div className="announcement-actions">
                  <button onClick={() => toggleVisibility(announcement.id)}>
                    {announcement.is_visible ? 'Hide' : 'Show'}
                  </button>
                  <button 
                    onClick={() => deleteAnnouncement(announcement.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsManager;
```

### Public Announcements Display

```jsx
import React, { useState, useEffect } from 'react';

const PublicAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch only visible announcements for public display
    fetch('/api/v1/announcements?visible_only=true')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setAnnouncements(data.data.announcements);
        }
      })
      .catch(error => {
        console.error('Error fetching announcements:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading announcements...</div>;
  }

  if (announcements.length === 0) {
    return null; // Don't show anything if no announcements
  }

  return (
    <div className="public-announcements">
      <h3>📢 Announcements</h3>
      {announcements.map(announcement => (
        <div key={announcement.id} className="announcement-banner">
          <p>{announcement.message}</p>
        </div>
      ))}
    </div>
  );
};

export default PublicAnnouncements;
```

## Testing Examples

### Using cURL

```bash
# Get all announcements
curl -X GET http://localhost:3000/api/v1/announcements

# Get visible announcements only
curl -X GET "http://localhost:3000/api/v1/announcements?visible_only=true"

# Create new announcement
curl -X POST http://localhost:3000/api/v1/announcements \
  -H "Content-Type: application/json" \
  -d '{
    "message": "System maintenance scheduled for tonight at 2 AM",
    "is_visible": true
  }'

# Update announcement
curl -X PUT http://localhost:3000/api/v1/announcements/1 \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Updated maintenance time",
    "is_visible": false
  }'

# Toggle visibility
curl -X PATCH http://localhost:3000/api/v1/announcements/1/toggle-visibility

# Delete announcement
curl -X DELETE http://localhost:3000/api/v1/announcements/1
```

### Using JavaScript Fetch

```javascript
// API utility functions
const announcementsAPI = {
  // Get all announcements
  getAll: (visibleOnly = false) => {
    const url = visibleOnly 
      ? '/api/v1/announcements?visible_only=true'
      : '/api/v1/announcements';
    
    return fetch(url).then(response => response.json());
  },

  // Get announcement by ID
  getById: (id) => {
    return fetch(`/api/v1/announcements/${id}`)
      .then(response => response.json());
  },

  // Create announcement
  create: (message, isVisible = false) => {
    return fetch('/api/v1/announcements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, is_visible: isVisible })
    }).then(response => response.json());
  },

  // Update announcement
  update: (id, updates) => {
    return fetch(`/api/v1/announcements/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    }).then(response => response.json());
  },

  // Delete announcement
  delete: (id) => {
    return fetch(`/api/v1/announcements/${id}`, {
      method: 'DELETE'
    }).then(response => response.json());
  },

  // Toggle visibility
  toggleVisibility: (id) => {
    return fetch(`/api/v1/announcements/${id}/toggle-visibility`, {
      method: 'PATCH'
    }).then(response => response.json());
  }
};

// Usage examples
announcementsAPI.getAll()
  .then(data => console.log('All announcements:', data));

announcementsAPI.create('Welcome to our platform!', true)
  .then(data => console.log('Created:', data));

announcementsAPI.toggleVisibility(1)
  .then(data => console.log('Toggled:', data));
```

## Best Practices

1. **Message Length**: Keep announcements concise but informative
2. **Visibility Management**: Use the toggle endpoint for quick visibility changes
3. **Error Handling**: Always check the `success` field in responses
4. **Caching**: Consider caching visible announcements on the frontend
5. **User Experience**: Show loading states and handle errors gracefully

## Security Considerations

- Input validation is handled by Joi middleware
- SQL injection protection through parameterized queries
- CORS is configured for your frontend domains
- No authentication required (public announcements system)

---

This API provides a complete CRUD interface for managing announcements with proper validation, error handling, and comprehensive documentation for frontend integration.
