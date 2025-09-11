# Profile API - Frontend Integration Guide

## Base URL
```
https://junkremovalapi.onrender.com/api/v1/auth
```

## Authentication
All profile endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 🔐 **Authentication Endpoints**

### **1. Business Signup**
```http
POST /api/v1/auth/signup
```

**Request Body:**
```json
{
  "business_name": "string (required)",
  "business_phone": "string (required)",
  "business_address": "string (required)",
  "business_city": "string (required)",
  "business_state": "string (required)",
  "business_zip_code": "string (required)",
  "website_url": "string (optional, max 512 chars, valid URL)",
  "logo_url": "string (optional, max 1024 chars, valid URL)",
  "owner_first_name": "string (required)",
  "owner_last_name": "string (required)",
  "owner_email": "string (required, email format)",
  "owner_phone": "string (required)",
  "username": "string (required, unique)",
  "password": "string (required, min 8 chars)",
  "license_number": "string (optional)",
  "insurance_number": "string (optional)",
  "service_radius": "number (optional)",
  "number_of_trucks": "number (optional)",
  "years_in_business": "number (optional)"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Business registered successfully",
  "data": {
    "business": {
      "id": 1,
      "business_name": "Williams Junk Removal",
      "business_phone": "+19101234567",
      "business_address": "123 Main St",
      "business_city": "Charlotte",
      "business_state": "NC",
      "business_zip_code": "28201",
      "website_url": "https://www.williamsjunkremoval.com",
      "logo_url": "https://www.williamsjunkremoval.com/logo.png",
      "owner_first_name": "Aric",
      "owner_last_name": "Williams",
      "owner_email": "aric@example.com",
      "owner_phone": "+19101234567",
      "username": "aric.williams",
      "user_type": "business_owner",
      "status": "pending",
      "created_at": "2025-01-11T12:00:00.000Z",
      "license_number": "LIC123456",
      "insurance_number": "INS789012",
      "service_radius": 50,
      "number_of_trucks": 2,
      "years_in_business": 5
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### **2. Business Login**
```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "username": "string (required) - username or email",
  "password": "string (required)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "business": {
      "id": 1,
      "business_name": "Williams Junk Removal",
      "business_phone": "+19101234567",
      "business_address": "123 Main St",
      "business_city": "Charlotte",
      "business_state": "NC",
      "business_zip_code": "28201",
      "website_url": "https://www.williamsjunkremoval.com",
      "logo_url": "https://www.williamsjunkremoval.com/logo.png",
      "owner_first_name": "Aric",
      "owner_last_name": "Williams",
      "owner_email": "aric@example.com",
      "owner_phone": "+19101234567",
      "username": "aric.williams",
      "user_type": "business_owner",
      "status": "active",
      "created_at": "2025-01-11T12:00:00.000Z",
      "last_login": "2025-01-11T12:00:00.000Z",
      "license_number": "LIC123456",
      "insurance_number": "INS789012",
      "service_radius": 50,
      "number_of_trucks": 2,
      "years_in_business": 5
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### **3. Password Reset**
```http
POST /api/v1/auth/reset-password
```

**Request Body:**
```json
{
  "username": "string (required) - username or email",
  "new_password": "string (required, min 8 chars)"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully",
  "timestamp": "2025-01-11T12:00:00.000Z"
}
```

---

## 👤 **Profile Management Endpoints**

### **4. Get Business Profile**
```http
GET /api/v1/auth/profile
```

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "business": {
      "id": 1,
      "business_name": "Williams Junk Removal",
      "business_phone": "+19101234567",
      "business_address": "123 Main St",
      "business_city": "Charlotte",
      "business_state": "NC",
      "business_zip_code": "28201",
      "website_url": "https://www.williamsjunkremoval.com",
      "logo_url": "https://www.williamsjunkremoval.com/logo.png",
      "owner_first_name": "Aric",
      "owner_last_name": "Williams",
      "owner_email": "aric@example.com",
      "owner_phone": "+19101234567",
      "username": "aric.williams",
      "user_type": "business_owner",
      "status": "active",
      "created_at": "2025-01-11T12:00:00.000Z",
      "last_login": "2025-01-11T12:00:00.000Z",
      "license_number": "LIC123456",
      "insurance_number": "INS789012",
      "service_radius": 50,
      "number_of_trucks": 2,
      "years_in_business": 5
    }
  }
}
```

---

### **5. Update Business Profile**
```http
PUT /api/v1/auth/profile
```

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "business_name": "string",
  "business_phone": "string",
  "business_address": "string",
  "business_city": "string",
  "business_state": "string",
  "business_zip_code": "string",
  "website_url": "string",
  "logo_url": "string",
  "owner_first_name": "string",
  "owner_last_name": "string",
  "owner_phone": "string",
  "license_number": "string",
  "insurance_number": "string",
  "service_radius": "number",
  "number_of_trucks": "number",
  "years_in_business": "number"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "business": {
      "id": 1,
      "business_name": "Updated Business Name",
      "business_phone": "+19101234567",
      "business_address": "456 New St",
      "business_city": "Charlotte",
      "business_state": "NC",
      "business_zip_code": "28202",
      "owner_first_name": "Aric",
      "owner_last_name": "Williams",
      "owner_email": "aric@example.com",
      "owner_phone": "+19101234567",
      "username": "aric.williams",
      "user_type": "business_owner",
      "status": "active",
      "created_at": "2025-01-11T12:00:00.000Z",
      "last_login": "2025-01-11T12:00:00.000Z",
      "license_number": "LIC123456",
      "insurance_number": "INS789012",
      "service_radius": 75,
      "number_of_trucks": 3,
      "years_in_business": 6
    }
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
      "field": "business_name",
      "message": "Business name is required",
      "value": ""
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
  "message": "Business not found",
  "error": "BUSINESS_NOT_FOUND"
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

## 🧪 **Frontend Integration Examples**

### **React/JavaScript Examples**

#### **Login Function**
```javascript
const login = async (username, password) => {
  try {
    const response = await fetch('https://junkremovalapi.onrender.com/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store token in localStorage
      localStorage.setItem('token', data.data.token);
      // Store business data in state
      setBusiness(data.data.business);
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

#### **Get Profile Function**
```javascript
const getProfile = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('https://junkremovalapi.onrender.com/api/v1/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      setBusiness(data.data.business);
      return data.data.business;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Get profile failed:', error);
    throw error;
  }
};
```

#### **Update Profile Function**
```javascript
const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('https://junkremovalapi.onrender.com/api/v1/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      setBusiness(data.data.business);
      return data.data.business;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Update profile failed:', error);
    throw error;
  }
};
```

#### **Signup Function**
```javascript
const signup = async (signupData) => {
  try {
    const response = await fetch('https://junkremovalapi.onrender.com/api/v1/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Store token in localStorage
      localStorage.setItem('token', data.data.token);
      // Store business data in state
      setBusiness(data.data.business);
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Signup failed:', error);
    throw error;
  }
};
```

---

## 📝 **Form Field Mappings**

### **Signup Form Fields**
```javascript
const signupFormFields = {
  // Business Information
  business_name: { type: 'text', required: true, label: 'Business Name' },
  business_phone: { type: 'tel', required: true, label: 'Business Phone' },
  business_address: { type: 'text', required: true, label: 'Business Address' },
  business_city: { type: 'text', required: true, label: 'City' },
  business_state: { type: 'text', required: true, label: 'State' },
  business_zip_code: { type: 'text', required: true, label: 'ZIP Code' },
  website_url: { type: 'url', required: false, label: 'Website URL' },
  logo_url: { type: 'url', required: false, label: 'Logo URL' },
  
  // Owner Information
  owner_first_name: { type: 'text', required: true, label: 'First Name' },
  owner_last_name: { type: 'text', required: true, label: 'Last Name' },
  owner_email: { type: 'email', required: true, label: 'Email' },
  owner_phone: { type: 'tel', required: true, label: 'Phone' },
  
  // Account Information
  username: { type: 'text', required: true, label: 'Username' },
  password: { type: 'password', required: true, label: 'Password' },
  
  // Optional Business Details
  license_number: { type: 'text', required: false, label: 'License Number' },
  insurance_number: { type: 'text', required: false, label: 'Insurance Number' },
  service_radius: { type: 'number', required: false, label: 'Service Radius (miles)' },
  number_of_trucks: { type: 'number', required: false, label: 'Number of Trucks' },
  years_in_business: { type: 'number', required: false, label: 'Years in Business' }
};
```

### **Profile Update Form Fields**
```javascript
const profileUpdateFields = {
  business_name: { type: 'text', required: false, label: 'Business Name' },
  business_phone: { type: 'tel', required: false, label: 'Business Phone' },
  business_address: { type: 'text', required: false, label: 'Business Address' },
  business_city: { type: 'text', required: false, label: 'City' },
  business_state: { type: 'text', required: false, label: 'State' },
  business_zip_code: { type: 'text', required: false, label: 'ZIP Code' },
  website_url: { type: 'url', required: false, label: 'Website URL' },
  logo_url: { type: 'url', required: false, label: 'Logo URL' },
  owner_first_name: { type: 'text', required: false, label: 'First Name' },
  owner_last_name: { type: 'text', required: false, label: 'Last Name' },
  owner_phone: { type: 'tel', required: false, label: 'Phone' },
  license_number: { type: 'text', required: false, label: 'License Number' },
  insurance_number: { type: 'text', required: false, label: 'Insurance Number' },
  service_radius: { type: 'number', required: false, label: 'Service Radius (miles)' },
  number_of_trucks: { type: 'number', required: false, label: 'Number of Trucks' },
  years_in_business: { type: 'number', required: false, label: 'Years in Business' }
};
```

---

## 🔑 **Token Management**

### **Token Storage**
```javascript
// Store token after login/signup
localStorage.setItem('token', token);

// Retrieve token for API calls
const token = localStorage.getItem('token');

// Remove token on logout
localStorage.removeItem('token');
```

### **Token Validation**
```javascript
const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // Decode JWT token (without verification for basic validation)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};
```

---

## 🚨 **Important Notes**

1. **Authentication**: All profile endpoints require valid JWT token
2. **Business Isolation**: Users can only access their own profile data
3. **Partial Updates**: Profile update accepts any combination of fields
4. **Protected Fields**: Some fields like `id`, `created_at`, `last_login` cannot be updated
5. **Email/Username**: Cannot be changed via profile update endpoint
6. **Password**: Use separate password reset endpoint
7. **Status Field**: Business status is managed by admin, not user
