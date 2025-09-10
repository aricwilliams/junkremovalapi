# SMS API Documentation

This document provides comprehensive information about the SMS functionality implemented in the Junk Removal API using Twilio.

## 🚀 Quick Start

### 1. Environment Variables

Add the following SMS configuration to your `.env` file:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_MESSAGING_SERVICE_SID=your_messaging_service_sid  # Optional
TWILIO_FROM_NUMBER=+15551234567  # Required if no messaging service
SERVER_URL=https://your-api-domain.com
```

### 2. Database Setup

Run the SMS migration to create the required database table:

```bash
node scripts/sms-migration.js
```

### 3. Test the Integration

```bash
# Test sending an SMS
curl -X POST http://localhost:3000/api/sms/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"to": "+15551234567", "body": "Hello from your junk removal service!"}'
```

## 📱 API Endpoints

### Send SMS

**Endpoint:** `POST /api/sms/send`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

**Request Body:**
```json
{
  "to": "+15551234567",
  "body": "Hello! Your junk removal appointment is confirmed for tomorrow at 2 PM.",
  "from": "+15559876543"  // Optional - uses messaging service if not provided
}
```

**Response:**
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "data": {
    "sid": "SM1234567890abcdef1234567890abcdef",
    "status": "queued",
    "to": "+15551234567",
    "from": "+15559876543",
    "body": "Hello! Your junk removal appointment is confirmed for tomorrow at 2 PM.",
    "dateSent": "2024-01-15T10:30:00.000Z"
  }
}
```

### Send Bulk SMS

**Endpoint:** `POST /api/sms/send-bulk`

**Request Body:**
```json
{
  "recipients": ["+15551234567", "+15559876543", "+15555555555"],
  "body": "Reminder: Your junk removal appointment is tomorrow at 2 PM.",
  "from": "+15559876543"  // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk SMS completed. 3 sent, 0 failed.",
  "data": {
    "total": 3,
    "successful": 3,
    "failed": 0,
    "results": [
      {
        "to": "+15551234567",
        "success": true,
        "message": {
          "sid": "SM1234567890abcdef1234567890abcdef",
          "status": "queued"
        },
        "error": null
      }
    ]
  }
}
```

### Get Message Details

**Endpoint:** `GET /api/sms/message/:messageSid`

**Response:**
```json
{
  "success": true,
  "data": {
    "sid": "SM1234567890abcdef1234567890abcdef",
    "to": "+15551234567",
    "from": "+15559876543",
    "body": "Hello! Your appointment is confirmed.",
    "status": "delivered",
    "direction": "outbound",
    "price": "0.0075",
    "priceUnit": "USD",
    "dateSent": "2024-01-15T10:30:00.000Z",
    "dateCreated": "2024-01-15T10:30:00.000Z",
    "dateUpdated": "2024-01-15T10:30:05.000Z",
    "errorCode": null,
    "errorMessage": null
  }
}
```

### Get SMS Logs

**Endpoint:** `GET /api/sms/logs`

**Query Parameters:**
- `phone_number` - Filter by phone number
- `status` - Filter by status (queued, sent, delivered, failed)
- `direction` - Filter by direction (inbound, outbound)
- `start_date` - Start date filter (YYYY-MM-DD)
- `end_date` - End date filter (YYYY-MM-DD)
- `limit` - Number of results (default: 50)
- `offset` - Offset for pagination (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "smsLogs": [
      {
        "id": 1,
        "user_id": 123,
        "message_sid": "SM1234567890abcdef1234567890abcdef",
        "to_number": "+15551234567",
        "from_number": "+15559876543",
        "body": "Hello! Your appointment is confirmed.",
        "status": "delivered",
        "direction": "outbound",
        "price": "0.0075",
        "price_unit": "USD",
        "error_code": null,
        "error_message": null,
        "date_sent": "2024-01-15T10:30:00.000Z",
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "stats": {
      "total_messages": 25,
      "outbound_count": 20,
      "inbound_count": 5,
      "delivered_count": 18,
      "failed_count": 2,
      "sent_count": 5,
      "total_cost": "0.15",
      "avg_cost_per_message": "0.0075"
    }
  }
}
```

### Get SMS Statistics

**Endpoint:** `GET /api/sms/stats`

**Query Parameters:**
- `start_date` - Start date filter (YYYY-MM-DD)
- `end_date` - End date filter (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "total_messages": 25,
    "outbound_count": 20,
    "inbound_count": 5,
    "delivered_count": 18,
    "failed_count": 2,
    "sent_count": 5,
    "total_cost": "0.15",
    "avg_cost_per_message": "0.0075"
  }
}
```

## 🔗 Webhook Endpoints

### Inbound SMS Webhook

**Endpoint:** `POST /webhooks/twilio/inbound`

This endpoint receives inbound SMS messages from Twilio. No authentication required.

**Request Body (from Twilio):**
```json
{
  "From": "+15551234567",
  "To": "+15559876543",
  "Body": "Hello, I need junk removal service",
  "MessageSid": "SM1234567890abcdef1234567890abcdef",
  "NumMedia": "0"
}
```

**Response (TwiML):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Thanks for your message! We'll get back to you shortly. Reply STOP to opt out.</Message>
</Response>
```

### SMS Status Callback

**Endpoint:** `POST /webhooks/twilio/status`

This endpoint receives delivery status updates from Twilio.

**Request Body (from Twilio):**
```json
{
  "MessageSid": "SM1234567890abcdef1234567890abcdef",
  "MessageStatus": "delivered",
  "To": "+15551234567",
  "From": "+15559876543",
  "ErrorCode": null,
  "ErrorMessage": null
}
```

## 🗄️ Database Schema

### `twilio_sms_logs` Table

```sql
CREATE TABLE twilio_sms_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message_sid VARCHAR(255) NOT NULL UNIQUE,
  to_number VARCHAR(20) NOT NULL,
  from_number VARCHAR(20) NOT NULL,
  body TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  direction ENUM('inbound', 'outbound') NOT NULL,
  price DECIMAL(10, 4) NULL,
  price_unit VARCHAR(10) DEFAULT 'USD',
  error_code VARCHAR(50) NULL,
  error_message TEXT NULL,
  date_sent DATETIME NULL,
  date_created DATETIME NULL,
  date_updated DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_message_sid (message_sid),
  INDEX idx_to_number (to_number),
  INDEX idx_from_number (from_number),
  INDEX idx_status (status),
  INDEX idx_direction (direction),
  INDEX idx_date_sent (date_sent)
);
```

## 📋 Usage Examples

### Frontend JavaScript Examples

```javascript
// Send SMS
const sendSMS = async (to, body) => {
  const response = await fetch('/api/sms/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    },
    body: JSON.stringify({ to, body })
  });
  return await response.json();
};

// Send bulk SMS
const sendBulkSMS = async (recipients, body) => {
  const response = await fetch('/api/sms/send-bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    },
    body: JSON.stringify({ recipients, body })
  });
  return await response.json();
};

// Get SMS logs
const getSMSLogs = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/sms/logs?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });
  return await response.json();
};

// Get SMS statistics
const getSMSStats = async (startDate, endDate) => {
  const params = new URLSearchParams();
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  
  const response = await fetch(`/api/sms/stats?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    }
  });
  return await response.json();
};
```

### React Component Example

```jsx
import React, { useState } from 'react';

const SMSComponent = () => {
  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const sendSMS = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ to, body })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error sending SMS:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Send SMS</h2>
      <form onSubmit={sendSMS}>
        <input
          type="tel"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Phone number (+15551234567)"
          required
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message body"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send SMS'}
        </button>
      </form>
      
      {result && (
        <div>
          <h3>Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default SMSComponent;
```

## 🔧 Twilio Console Setup

### 1. Configure Webhooks

In your Twilio Console:

1. Go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Click on your phone number
3. Set the webhook URL for incoming messages:
   - **A message comes in**: `https://your-api-domain.com/webhooks/twilio/sms/inbound`
4. Set the status callback URL:
   - **Status callback URL**: `https://your-api-domain.com/webhooks/twilio/sms/status`

### 2. Messaging Service (Recommended)

1. Go to **Messaging** → **Services**
2. Create a new Messaging Service
3. Add your phone numbers to the service
4. Configure webhooks:
   - **Inbound Request URL**: `https://your-api-domain.com/webhooks/twilio/inbound`
   - **Status Callback URL**: `https://your-api-domain.com/webhooks/twilio/status`

## 🛡️ Security Considerations

1. **Authentication**: All API endpoints require valid JWT authentication
2. **Webhook Security**: Implement webhook signature validation for production
3. **Rate Limiting**: Consider implementing rate limiting for SMS sending
4. **Phone Number Validation**: Validate phone numbers before sending
5. **Message Content**: Implement content filtering for compliance

## 🚨 Troubleshooting

### Common Issues

1. **SMS Not Sending**
   - Check Twilio credentials
   - Verify phone number format (E.164)
   - Check account balance
   - Verify webhook URLs are accessible

2. **Webhooks Not Receiving**
   - Ensure URLs are publicly accessible
   - Check SSL certificates for HTTPS
   - Verify webhook configuration in Twilio Console

3. **Database Errors**
   - Run migration: `node scripts/sms-migration.js`
   - Check database connection
   - Verify table permissions

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment.

## 📞 Support

For issues related to:
- **Twilio Services**: Check [Twilio SMS Documentation](https://www.twilio.com/docs/sms)
- **API Integration**: Review this documentation
- **Database Issues**: Check migration scripts and database logs

---

This SMS integration provides a complete foundation for sending and receiving SMS messages in your Junk Removal application, including delivery tracking, conversation management, and comprehensive logging.
