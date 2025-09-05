# Frontend API Integration Guide

This guide provides frontend developers with everything needed to integrate with the Junk Removal Business Management API.

## 🚀 Quick Start

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
All endpoints (except auth endpoints) require Bearer token authentication:
```
Authorization: Bearer <jwt_token>
```

### Standard Response Format
```json
{
  "success": boolean,
  "data": object,
  "timestamp": string,
  "message"?: string
}
```

---

## 🔐 Authentication Endpoints

### 1. Business Signup
**POST** `/auth/signup`

Register a new junk removal business.

```javascript
const signupData = {
  business_name: "ABC Junk Removal",
  business_phone: "+1234567890",
  business_address: "123 Main St",
  business_city: "Los Angeles",
  business_state: "CA",
  business_zip_code: "90210",
  owner_first_name: "John",
  owner_last_name: "Smith",
  owner_email: "john@abcjunkremoval.com",
  owner_phone: "+1234567890",
  username: "abcjunkremoval",
  password: "SecurePass123!",
  license_number: "LIC123456",
  insurance_number: "INS123456",
  service_radius: 25,
  number_of_trucks: 2,
  years_in_business: 5
};

const response = await fetch('http://localhost:3000/api/v1/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(signupData)
});

const result = await response.json();
// Store token: localStorage.setItem('authToken', result.data.token);
```

### 2. Business Login
**POST** `/auth/login`

Authenticate existing business.

```javascript
const loginData = {
  username: "abcjunkremoval", // Can also use email
  password: "SecurePass123!"
};

const response = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(loginData)
});

const result = await response.json();
// Store token: localStorage.setItem('authToken', result.data.token);
```

### 3. Get Business Profile
**GET** `/auth/profile`

```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:3000/api/v1/auth/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
```

### 4. Update Business Profile
**PUT** `/auth/profile`

```javascript
const token = localStorage.getItem('authToken');
const updateData = {
  business_name: "Updated ABC Junk Removal",
  service_radius: 30,
  number_of_trucks: 3
};

const response = await fetch('http://localhost:3000/api/v1/auth/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData)
});

const result = await response.json();
```

---

## 👥 Customer Management

### 1. Get Customers List
**GET** `/customers`

```javascript
const token = localStorage.getItem('authToken');

// Basic request
const response = await fetch('http://localhost:3000/api/v1/customers', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

// With filtering and pagination
const params = new URLSearchParams({
  status: 'active',
  customer_type: 'residential',
  page: '1',
  limit: '20',
  sort_by: 'created_at',
  sort_order: 'desc'
});

const response = await fetch(`http://localhost:3000/api/v1/customers?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.data.customers - array of customers
// result.data.pagination - pagination info
```

### 2. Get Single Customer
**GET** `/customers/{id}`

```javascript
const token = localStorage.getItem('authToken');
const customerId = 123;

const response = await fetch(`http://localhost:3000/api/v1/customers/${customerId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.data.customer - customer object
```

### 3. Create Customer
**POST** `/customers`

```javascript
const token = localStorage.getItem('authToken');
const customerData = {
  name: "John Smith",
  email: "john@example.com",
  phone: "555-0123",
  address: "123 Main St",
  city: "Wilmington",
  state: "NC",
  zip_code: "28401",
  customer_type: "residential",
  status: "new"
};

const response = await fetch('http://localhost:3000/api/v1/customers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(customerData)
});

const result = await response.json();
// result.data.customer - created customer
```

### 4. Update Customer
**PUT** `/customers/{id}`

```javascript
const token = localStorage.getItem('authToken');
const customerId = 123;
const updateData = {
  name: "John Smith Updated",
  phone: "555-9999",
  status: "active"
};

const response = await fetch(`http://localhost:3000/api/v1/customers/${customerId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData)
});

const result = await response.json();
// result.data.customer - updated customer
```

### 5. Delete Customer
**DELETE** `/customers/{id}`

```javascript
const token = localStorage.getItem('authToken');
const customerId = 123;

const response = await fetch(`http://localhost:3000/api/v1/customers/${customerId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.message - success message
```

---

## 👷 Employee Management

### 1. Get Employees List
**GET** `/employees`

```javascript
const token = localStorage.getItem('authToken');

// With filtering
const params = new URLSearchParams({
  status: 'active',
  position: 'driver',
  employee_type: 'regular',
  page: '1',
  limit: '20'
});

const response = await fetch(`http://localhost:3000/api/v1/employees?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.data.employees - array of employees
```

### 2. Get Single Employee
**GET** `/employees/{id}`

```javascript
const token = localStorage.getItem('authToken');
const employeeId = 456;

const response = await fetch(`http://localhost:3000/api/v1/employees/${employeeId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.data.employee - employee object
```

### 3. Create Employee
**POST** `/employees`

```javascript
const token = localStorage.getItem('authToken');
const employeeData = {
  first_name: "Mike",
  last_name: "Johnson",
  email: "mike@company.com",
  phone: "555-0456",
  job_title: "Driver",
  employee_type: "regular",
  position: "driver",
  status: "active",
  hire_date: "2024-01-01"
};

const response = await fetch('http://localhost:3000/api/v1/employees', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(employeeData)
});

const result = await response.json();
// result.data.employee - created employee
```

### 4. Update Employee
**PUT** `/employees/{id}`

```javascript
const token = localStorage.getItem('authToken');
const employeeId = 456;
const updateData = {
  job_title: "Senior Driver",
  position: "supervisor",
  status: "active"
};

const response = await fetch(`http://localhost:3000/api/v1/employees/${employeeId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData)
});

const result = await response.json();
// result.data.employee - updated employee
```

### 5. Delete Employee
**DELETE** `/employees/{id}`

```javascript
const token = localStorage.getItem('authToken');
const employeeId = 456;

const response = await fetch(`http://localhost:3000/api/v1/employees/${employeeId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.message - success message
```

---

## 💰 Estimate Management

### 1. Get Estimates List
**GET** `/estimates`

```javascript
const token = localStorage.getItem('authToken');

// With filtering
const params = new URLSearchParams({
  status: 'sent',
  customer_id: '123',
  page: '1',
  limit: '20'
});

const response = await fetch(`http://localhost:3000/api/v1/estimates?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.data.estimates - array of estimates with customer info
```

### 2. Get Single Estimate
**GET** `/estimates/{id}`

```javascript
const token = localStorage.getItem('authToken');
const estimateId = 789;

const response = await fetch(`http://localhost:3000/api/v1/estimates/${estimateId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.data.estimate - estimate with customer details
```

### 3. Create Estimate
**POST** `/estimates`

```javascript
const token = localStorage.getItem('authToken');
const estimateData = {
  customer_id: 123,
  title: "Residential Cleanout Estimate",
  amount: 250.00,
  status: "draft",
  sent_date: "2024-01-01T10:00:00.000Z",
  expiry_date: "2024-01-15T10:00:00.000Z",
  notes: "Customer requested early morning pickup"
};

const response = await fetch('http://localhost:3000/api/v1/estimates', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(estimateData)
});

const result = await response.json();
// result.data.estimate - created estimate
```

### 4. Update Estimate
**PUT** `/estimates/{id}`

```javascript
const token = localStorage.getItem('authToken');
const estimateId = 789;
const updateData = {
  status: "sent",
  sent_date: "2024-01-02T10:00:00.000Z"
};

const response = await fetch(`http://localhost:3000/api/v1/estimates/${estimateId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData)
});

const result = await response.json();
// result.data.estimate - updated estimate
```

### 5. Delete Estimate
**DELETE** `/estimates/{id}`

```javascript
const token = localStorage.getItem('authToken');
const estimateId = 789;

const response = await fetch(`http://localhost:3000/api/v1/estimates/${estimateId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.message - success message
```

---

## 💼 Job Management

### 1. Get Jobs List
**GET** `/jobs`

```javascript
const token = localStorage.getItem('authToken');

// With filtering and pagination
const params = new URLSearchParams({
  status: 'scheduled',
  customer_id: '123',
  employee_id: '456',
  date_from: '2024-01-01',
  date_to: '2024-01-31',
  page: '1',
  limit: '20',
  sort_by: 'scheduled_date',
  sort_order: 'asc'
});

const response = await fetch(`http://localhost:3000/api/v1/jobs?${params}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.data.jobs - array of jobs with customer, employee, estimate info
// result.data.pagination - pagination info
```

### 2. Get Single Job (Full Details)
**GET** `/jobs/{id}`

```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.data.job - job with full details including:
// - customer info
// - employee info
// - estimate info
// - items array
// - photos array
// - notes array
// - status_history array
```

### 3. Create Job
**POST** `/jobs`

```javascript
const token = localStorage.getItem('authToken');
const jobData = {
  customer_id: 123,
  estimate_id: 789,
  assigned_employee_id: 456,
  title: "Residential Cleanout",
  description: "Remove old furniture and appliances",
  scheduled_date: "2024-01-15T09:00:00Z",
  total_cost: 250.00
};

const response = await fetch('http://localhost:3000/api/v1/jobs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(jobData)
});

const result = await response.json();
// result.data.job - created job
```

### 4. Update Job
**PUT** `/jobs/{id}`

```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;
const updateData = {
  status: "in_progress",
  assigned_employee_id: 456,
  total_cost: 275.00,
  completion_date: "2024-01-15T14:30:00Z",
  description: "Updated description with additional items"
};

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData)
});

const result = await response.json();
// result.data.job - updated job
```

### 5. Delete Job
**DELETE** `/jobs/{id}`

```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.message - success message
```

### 6. Get Job Statistics
**GET** `/jobs/stats`

```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:3000/api/v1/jobs/stats', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.data.stats - statistics object with:
// - total_jobs
// - scheduled_jobs
// - in_progress_jobs
// - completed_jobs
// - cancelled_jobs
// - total_revenue
// - average_job_value
// - jobs_today
// - scheduled_today
```

---

## 📦 Job Items Management

### 1. Add Job Item
**POST** `/jobs/{id}/items`

```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;
const itemData = {
  name: "Refrigerator",
  category: "appliances",
  quantity: 1,
  base_price: 75.00,
  difficulty: "hard",
  estimated_time: 45
};

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}/items`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(itemData)
});

const result = await response.json();
// result.data.item - created item
```

### 2. Update Job Item
**PUT** `/jobs/{jobId}/items/{itemId}`

```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;
const itemId = 201;
const updateData = {
  quantity: 2,
  base_price: 80.00
};

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}/items/${itemId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData)
});

const result = await response.json();
// result.data.item - updated item
```

### 3. Delete Job Item
**DELETE** `/jobs/{jobId}/items/{itemId}`

```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;
const itemId = 201;

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}/items/${itemId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.message - success message
```

---

## 📝 Job Notes Management

### 1. Add Job Note
**POST** `/jobs/{id}/notes`

```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;
const noteData = {
  note_type: "customer_communication",
  content: "Customer called to confirm pickup time",
  is_important: false
};

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}/notes`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(noteData)
});

const result = await response.json();
// result.data.note - created note with employee info
```

### 2. Update Job Note
**PUT** `/jobs/{jobId}/notes/{noteId}`

```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;
const noteId = 301;
const updateData = {
  content: "Updated note content",
  is_important: true
};

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}/notes/${noteId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData)
});

const result = await response.json();
// result.data.note - updated note
```

### 3. Delete Job Note
**DELETE** `/jobs/{jobId}/notes/{noteId}`

```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;
const noteId = 301;

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}/notes/${noteId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.message - success message
```

---

## 📊 Job Status History

### 1. Get Job Status History
**GET** `/jobs/{id}/status-history`

```javascript
const token = localStorage.getItem('authToken');
const jobId = 101;

const response = await fetch(`http://localhost:3000/api/v1/jobs/${jobId}/status-history`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const result = await response.json();
// result.data.status_history - array of status changes with employee info
```

---

## 🎨 Frontend Implementation Examples

### React Hook for API Calls
```javascript
import { useState, useEffect } from 'react';

const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = async (url, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/v1${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'API call failed');
      }
      
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { apiCall, loading, error };
};

export default useApi;
```

### React Component Example
```jsx
import React, { useState, useEffect } from 'react';
import useApi from './hooks/useApi';

const CustomersList = () => {
  const { apiCall, loading, error } = useApi();
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const result = await apiCall('/customers?page=1&limit=20');
      setCustomers(result.data.customers);
      setPagination(result.data.pagination);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const createCustomer = async (customerData) => {
    try {
      const result = await apiCall('/customers', {
        method: 'POST',
        body: JSON.stringify(customerData)
      });
      setCustomers([...customers, result.data.customer]);
      return result.data.customer;
    } catch (err) {
      console.error('Failed to create customer:', err);
      throw err;
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Customers</h2>
      {customers.map(customer => (
        <div key={customer.id}>
          <h3>{customer.name}</h3>
          <p>{customer.email}</p>
          <p>{customer.phone}</p>
        </div>
      ))}
    </div>
  );
};

export default CustomersList;
```

### Vue.js Composition API Example
```javascript
import { ref, onMounted } from 'vue';

export function useCustomers() {
  const customers = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const apiCall = async (url, options = {}) => {
    loading.value = true;
    error.value = null;
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/v1${url}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers,
        },
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'API call failed');
      }
      
      return result;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const loadCustomers = async () => {
    try {
      const result = await apiCall('/customers?page=1&limit=20');
      customers.value = result.data.customers;
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const createCustomer = async (customerData) => {
    try {
      const result = await apiCall('/customers', {
        method: 'POST',
        body: JSON.stringify(customerData)
      });
      customers.value.push(result.data.customer);
      return result.data.customer;
    } catch (err) {
      console.error('Failed to create customer:', err);
      throw err;
    }
  };

  onMounted(() => {
    loadCustomers();
  });

  return {
    customers,
    loading,
    error,
    loadCustomers,
    createCustomer
  };
}
```

### Angular Service Example
```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000/api/v1';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Customers
  getCustomers(params?: any): Observable<any> {
    const queryParams = params ? new URLSearchParams(params).toString() : '';
    const url = `${this.baseUrl}/customers${queryParams ? '?' + queryParams : ''}`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  getCustomer(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/customers/${id}`, { headers: this.getHeaders() });
  }

  createCustomer(customerData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/customers`, customerData, { headers: this.getHeaders() });
  }

  updateCustomer(id: number, customerData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/customers/${id}`, customerData, { headers: this.getHeaders() });
  }

  deleteCustomer(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/customers/${id}`, { headers: this.getHeaders() });
  }

  // Jobs
  getJobs(params?: any): Observable<any> {
    const queryParams = params ? new URLSearchParams(params).toString() : '';
    const url = `${this.baseUrl}/jobs${queryParams ? '?' + queryParams : ''}`;
    return this.http.get(url, { headers: this.getHeaders() });
  }

  getJob(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/jobs/${id}`, { headers: this.getHeaders() });
  }

  createJob(jobData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/jobs`, jobData, { headers: this.getHeaders() });
  }

  updateJob(id: number, jobData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/jobs/${id}`, jobData, { headers: this.getHeaders() });
  }

  deleteJob(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/jobs/${id}`, { headers: this.getHeaders() });
  }

  getJobStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/jobs/stats`, { headers: this.getHeaders() });
  }
}
```

---

## ⚠️ Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Handling Example
```javascript
const handleApiCall = async (apiFunction) => {
  try {
    const result = await apiFunction();
    return { success: true, data: result.data };
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      const errorData = await error.response.json();
      return { 
        success: false, 
        message: errorData.message,
        errors: errorData.errors || []
      };
    } else if (error.request) {
      // Network error
      return { 
        success: false, 
        message: 'Network error. Please check your connection.' 
      };
    } else {
      // Other error
      return { 
        success: false, 
        message: error.message 
      };
    }
  }
};
```

---

## 🔧 Environment Configuration

### Development
```javascript
const API_BASE_URL = 'http://localhost:3000/api/v1';
```

### Production
```javascript
const API_BASE_URL = 'https://yourdomain.com/api/v1';
```

### Environment Variables
```javascript
// .env file
REACT_APP_API_URL=http://localhost:3000/api/v1
VUE_APP_API_URL=http://localhost:3000/api/v1
```

---

## 📱 Mobile App Considerations

### React Native
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store token
await AsyncStorage.setItem('authToken', token);

// Retrieve token
const token = await AsyncStorage.getItem('authToken');

// Remove token
await AsyncStorage.removeItem('authToken');
```

### Flutter
```dart
import 'package:shared_preferences/shared_preferences.dart';

// Store token
SharedPreferences prefs = await SharedPreferences.getInstance();
await prefs.setString('authToken', token);

// Retrieve token
String? token = prefs.getString('authToken');

// Remove token
await prefs.remove('authToken');
```

---

## 🧪 Testing

### Unit Test Example (Jest)
```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomersList from './CustomersList';

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      success: true,
      data: {
        customers: [
          { id: 1, name: 'John Smith', email: 'john@example.com' }
        ],
        pagination: { current_page: 1, total_pages: 1, total_items: 1 }
      }
    })
  })
);

test('should load and display customers', async () => {
  render(<CustomersList />);
  
  await waitFor(() => {
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

---

## 📞 Support

For technical support or questions about the API:
- Check the server health: `GET /health`
- Review the complete API documentation: `API_DOCUMENTATION.md`
- Server logs: Check console output

---

## 🔄 API Updates

This API follows semantic versioning. Check for updates and breaking changes in the changelog.

**Current Version:** 1.0.0  
**Last Updated:** January 2024

---

## 🚀 Quick Reference

### All Available Endpoints:
- **Authentication:** `/auth/signup`, `/auth/login`, `/auth/profile`
- **Customers:** `/customers` (GET, POST), `/customers/{id}` (GET, PUT, DELETE)
- **Employees:** `/employees` (GET, POST), `/employees/{id}` (GET, PUT, DELETE)
- **Estimates:** `/estimates` (GET, POST), `/estimates/{id}` (GET, PUT, DELETE)
- **Jobs:** `/jobs` (GET, POST), `/jobs/{id}` (GET, PUT, DELETE), `/jobs/stats` (GET)
- **Job Items:** `/jobs/{id}/items` (POST), `/jobs/{jobId}/items/{itemId}` (PUT, DELETE)
- **Job Notes:** `/jobs/{id}/notes` (POST), `/jobs/{jobId}/notes/{noteId}` (PUT, DELETE)
- **Status History:** `/jobs/{id}/status-history` (GET)

### Common Query Parameters:
- `page` - Page number for pagination
- `limit` - Items per page
- `sort_by` - Field to sort by
- `sort_order` - Sort direction (asc/desc)
- `status` - Filter by status
- `date_from` / `date_to` - Date range filters

### Required Headers:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```
