# Password Reset API Documentation

## Base URL
```
/api/v1/auth/reset-password
```

## Authentication
This endpoint does **NOT** require authentication. Users can reset their password without being logged in.

---

## Endpoint

### Reset Password
**POST** `/api/v1/auth/reset-password`

Allows users to reset their password directly without email verification.

#### Request Body
```json
{
  "username": "user@example.com",
  "new_password": "newSecurePassword123"
}
```

#### Field Validation Rules
| Field | Type | Required | Validation Rules |
|-------|------|----------|------------------|
| `username` | string | Yes | Can be either username or email address |
| `new_password` | string | Yes | 8-128 characters long |

#### Request Example
```javascript
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "username": "john.doe@example.com",
  "new_password": "MyNewPassword123!"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Password reset successfully",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Error Responses

**User Not Found (404)**
```json
{
  "success": false,
  "message": "User not found",
  "error": "USER_NOT_FOUND"
}
```

**Account Inactive (401)**
```json
{
  "success": false,
  "message": "Account is not active",
  "error": "ACCOUNT_INACTIVE"
}
```

**Validation Error (400)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "username",
      "message": "Username or email is required"
    },
    {
      "field": "new_password",
      "message": "New password must be at least 8 characters long"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Frontend Implementation Examples

### JavaScript/Fetch API
```javascript
const resetPassword = async (username, newPassword) => {
  try {
    const response = await fetch('/api/v1/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        new_password: newPassword
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('Password reset successfully');
      return { success: true, message: data.message };
    } else {
      console.error('Password reset failed:', data.message);
      return { success: false, message: data.message, errors: data.errors };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, message: 'Network error occurred' };
  }
};

// Usage
const handlePasswordReset = async () => {
  const result = await resetPassword('user@example.com', 'NewPassword123!');
  if (result.success) {
    alert('Password reset successfully!');
  } else {
    alert(`Error: ${result.message}`);
  }
};
```

### Axios
```javascript
import axios from 'axios';

const resetPassword = async (username, newPassword) => {
  try {
    const response = await axios.post('/api/v1/auth/reset-password', {
      username: username,
      new_password: newPassword
    });

    return {
      success: true,
      message: response.data.message
    };
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        message: error.response.data.message,
        errors: error.response.data.errors,
        status: error.response.status
      };
    } else {
      // Network error
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }
};

// Usage
const handlePasswordReset = async () => {
  const result = await resetPassword('user@example.com', 'NewPassword123!');
  if (result.success) {
    console.log('Password reset successfully');
  } else {
    console.error('Password reset failed:', result.message);
  }
};
```

### React Hook Example
```javascript
import { useState } from 'react';

const usePasswordReset = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const resetPassword = async (username, newPassword) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (data.success) {
        setLoading(false);
        return { success: true, message: data.message };
      } else {
        setError(data.message);
        setLoading(false);
        return { success: false, message: data.message, errors: data.errors };
      }
    } catch (err) {
      setError('Network error occurred');
      setLoading(false);
      return { success: false, message: 'Network error occurred' };
    }
  };

  return { resetPassword, loading, error };
};

// Usage in component
const PasswordResetForm = () => {
  const { resetPassword, loading, error } = usePasswordReset();
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await resetPassword(username, newPassword);
    if (result.success) {
      alert('Password reset successfully!');
      setUsername('');
      setNewPassword('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username or Email"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        minLength={8}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};
```

### Vue.js Example
```javascript
// Vue 3 Composition API
import { ref } from 'vue';

export default {
  setup() {
    const username = ref('');
    const newPassword = ref('');
    const loading = ref(false);
    const error = ref('');

    const resetPassword = async () => {
      loading.value = true;
      error.value = '';

      try {
        const response = await fetch('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: username.value,
            new_password: newPassword.value
          })
        });

        const data = await response.json();

        if (data.success) {
          alert('Password reset successfully!');
          username.value = '';
          newPassword.value = '';
        } else {
          error.value = data.message;
        }
      } catch (err) {
        error.value = 'Network error occurred';
      } finally {
        loading.value = false;
      }
    };

    return {
      username,
      newPassword,
      loading,
      error,
      resetPassword
    };
  }
};
```

---

## Error Handling

### Common Error Scenarios

1. **User Not Found (404)**
   - Username or email doesn't exist in the system
   - Show message: "User not found. Please check your username or email."

2. **Account Inactive (401)**
   - User account is suspended or inactive
   - Show message: "Account is not active. Please contact support."

3. **Validation Errors (400)**
   - Missing required fields
   - Password too short (less than 8 characters)
   - Password too long (more than 128 characters)
   - Show specific validation messages

4. **Network Errors**
   - Connection timeout
   - Server unavailable
   - Show message: "Unable to connect. Please try again later."

### Error Handling Best Practices

```javascript
const handlePasswordReset = async (username, newPassword) => {
  try {
    const result = await resetPassword(username, newPassword);
    
    if (result.success) {
      // Success - redirect to login or show success message
      showSuccessMessage('Password reset successfully!');
      redirectToLogin();
    } else {
      // Handle specific error cases
      switch (result.status) {
        case 404:
          showErrorMessage('User not found. Please check your username or email.');
          break;
        case 401:
          showErrorMessage('Account is not active. Please contact support.');
          break;
        case 400:
          // Show validation errors
          if (result.errors) {
            result.errors.forEach(error => {
              showFieldError(error.field, error.message);
            });
          } else {
            showErrorMessage(result.message);
          }
          break;
        default:
          showErrorMessage('An unexpected error occurred. Please try again.');
      }
    }
  } catch (error) {
    showErrorMessage('Network error. Please check your connection and try again.');
  }
};
```

---

## Security Considerations

1. **No Authentication Required**: This endpoint is intentionally public to allow password resets
2. **Input Validation**: All inputs are validated on the server side
3. **Password Hashing**: Passwords are securely hashed using bcrypt with 12 salt rounds
4. **Account Status Check**: Only active or pending accounts can reset passwords
5. **Rate Limiting**: Consider implementing rate limiting on the frontend to prevent abuse

---

## Testing

### Test Cases

1. **Valid Reset**
   ```javascript
   // Test with valid username and password
   const result = await resetPassword('test@example.com', 'NewPassword123!');
   // Should return success: true
   ```

2. **Invalid Username**
   ```javascript
   // Test with non-existent username
   const result = await resetPassword('nonexistent@example.com', 'NewPassword123!');
   // Should return 404 error
   ```

3. **Short Password**
   ```javascript
   // Test with password less than 8 characters
   const result = await resetPassword('test@example.com', '123');
   // Should return 400 validation error
   ```

4. **Missing Fields**
   ```javascript
   // Test with missing username
   const result = await resetPassword('', 'NewPassword123!');
   // Should return 400 validation error
   ```

---

## Notes

- The endpoint accepts both username and email for the `username` field
- Password must be between 8-128 characters
- No email verification is required - password is reset immediately
- The endpoint updates the password hash and timestamp in the database
- Users can immediately log in with their new password after reset
