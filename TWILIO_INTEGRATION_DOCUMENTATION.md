# Twilio Integration Documentation

This document provides comprehensive information about the Twilio Voice integration implemented in the Junk Removal API.

## 🚀 Quick Start

### 1. Install Dependencies

The required dependencies have been added to `package.json`:

```bash
npm install
```

### 2. Environment Variables

Add the following Twilio configuration to your `.env` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=your_api_key
TWILIO_API_SECRET=your_api_secret
TWILIO_APP_SID=your_twiml_app_sid
TWILIO_TWIML_APP_SID=your_twiml_app_sid

# Server Configuration
SERVER_URL=https://your-api-domain.com
```

### 3. Database Setup

Run the Twilio migration to create the required database tables:

```bash
npm run migrate:twilio
```

### 4. Test the Integration

Run the test suite to verify everything is working:

```bash
npm run test:twilio
```

## 🗄️ Database Schema

The integration creates three main tables:

### 1. `user_phone_numbers`
Stores purchased phone numbers and their metadata.

### 2. `twilio_call_logs`
Logs all call activities, status updates, and recordings.

### 3. `call_forwarding`
Manages call forwarding rules for each phone number.

## 🔧 Backend Implementation

### Configuration Files

- **`config/twilioClient.js`** - Twilio client initialization
- **`config/config.js`** - Updated with Twilio configuration

### Models

- **`models/UserPhoneNumber.js`** - Phone number management
- **`models/TwilioCallLog.js`** - Call logging and tracking
- **`models/CallForwarding.js`** - Call forwarding rules

### Routes

- **`routes/twilio.js`** - Main Twilio API endpoints
- **`routes/callForwarding.js`** - Call forwarding management

## 📱 API Endpoints

### Phone Number Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/twilio/buy-number` | Purchase a phone number |
| `GET` | `/api/twilio/available-numbers` | Search available numbers |
| `GET` | `/api/twilio/my-numbers` | Get user's phone numbers |
| `PUT` | `/api/twilio/my-numbers/:id` | Update phone number |
| `DELETE` | `/api/twilio/my-numbers/:id` | Release phone number |

### Browser Calling

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/twilio/access-token` | Generate access token for browser calling |

### Call Handling

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/twilio/twiml` | TwiML endpoint for call handling |
| `POST` | `/api/twilio/status-callback` | Call status webhook |
| `POST` | `/api/twilio/recording-callback` | Recording webhook |

### Call Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/twilio/call-logs` | Get call logs |
| `GET` | `/api/twilio/recordings` | Get call recordings |

### Call Forwarding

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/call-forwarding` | Create forwarding rule |
| `GET` | `/api/call-forwarding` | Get forwarding settings |
| `PUT` | `/api/call-forwarding/:id` | Update forwarding rule |
| `PATCH` | `/api/call-forwarding/:id/toggle` | Toggle forwarding |
| `DELETE` | `/api/call-forwarding/:id` | Delete forwarding rule |

## 🎨 Frontend Components

### React Components

- **`frontend/components/BrowserCallComponent.jsx`** - Browser calling interface
- **`frontend/components/CallForwardingComponent.jsx`** - Call forwarding management
- **`frontend/components/PhoneNumberManagement.jsx`** - Phone number management

### Key Features

1. **Browser Calling**
   - Make calls directly from web browser
   - Real-time call status updates
   - Mute/unmute functionality
   - Call recording

2. **Phone Number Management**
   - Search and purchase phone numbers
   - Manage phone number settings
   - Release phone numbers
   - View statistics

3. **Call Forwarding**
   - Forward calls to any number
   - Multiple forwarding types (always, busy, no answer)
   - Configurable ring timeout
   - Toggle forwarding on/off

4. **Call Logging & Recording**
   - Automatic call logging
   - Call status tracking
   - Recording management
   - Call statistics

## 🔧 Twilio Console Setup

### 1. Create TwiML App

1. Go to Twilio Console > Voice > TwiML Apps
2. Create a new TwiML App
3. Set Voice Configuration URL to: `https://your-api-url.com/api/twilio/twiml`
4. Copy the App SID to your environment variables

### 2. Configure Webhooks

Your API automatically handles these webhooks:
- Call Status Callback: `/api/twilio/status-callback`
- Recording Callback: `/api/twilio/recording-callback`

## 📋 Usage Examples

### Purchase a Phone Number

```javascript
const response = await fetch('/api/twilio/buy-number', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    areaCode: '555',
    country: 'US'
  })
});
```

### Generate Access Token for Browser Calling

```javascript
const response = await fetch('/api/twilio/access-token', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const { token, availableNumbers } = await response.json();
```

### Create Call Forwarding Rule

```javascript
const response = await fetch('/api/call-forwarding', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    phone_number_id: 1,
    forward_to_number: '+15551234567',
    forwarding_type: 'always',
    ring_timeout: 20
  })
});
```

## 🛠️ Development

### Running the Migration

```bash
npm run migrate:twilio
```

### Testing the API

```bash
npm run test:twilio
```

### File Structure

```
├── config/
│   ├── twilioClient.js          # Twilio client configuration
│   └── config.js                # Updated with Twilio settings
├── models/
│   ├── UserPhoneNumber.js       # Phone number model
│   ├── TwilioCallLog.js         # Call log model
│   └── CallForwarding.js        # Call forwarding model
├── routes/
│   ├── twilio.js                # Twilio API routes
│   └── callForwarding.js        # Call forwarding routes
├── scripts/
│   └── twilio-migration.js      # Database migration
├── frontend/components/
│   ├── BrowserCallComponent.jsx # Browser calling UI
│   ├── CallForwardingComponent.jsx # Call forwarding UI
│   └── PhoneNumberManagement.jsx # Phone number management UI
└── test-twilio-api.js           # API test suite
```

## 🔒 Security Considerations

1. **Authentication**: All endpoints require valid JWT authentication
2. **Authorization**: Users can only access their own phone numbers and data
3. **Webhook Security**: Implement webhook signature validation for production
4. **Rate Limiting**: Consider implementing rate limiting for Twilio API calls

## 🚨 Troubleshooting

### Common Issues

1. **Twilio Credentials Not Set**
   - Ensure all Twilio environment variables are configured
   - Check that credentials are valid in Twilio Console

2. **Database Connection Issues**
   - Run the migration: `npm run migrate:twilio`
   - Verify database connection settings

3. **Webhook Not Receiving Calls**
   - Check TwiML App configuration in Twilio Console
   - Ensure webhook URLs are publicly accessible
   - Verify SSL certificates for HTTPS endpoints

4. **Browser Calling Not Working**
   - Check access token generation
   - Verify TwiML App SID configuration
   - Ensure browser supports WebRTC

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment.

## 📞 Support

For issues related to:
- **Twilio Services**: Check [Twilio Documentation](https://www.twilio.com/docs)
- **API Integration**: Review this documentation and test suite
- **Database Issues**: Check migration scripts and database logs

## 🔄 Updates and Maintenance

### Regular Tasks

1. **Monitor Call Logs**: Review call statistics and costs
2. **Update Phone Numbers**: Manage active/inactive numbers
3. **Review Forwarding Rules**: Ensure forwarding rules are current
4. **Backup Data**: Regular database backups for call logs and settings

### Version Updates

When updating Twilio SDK or dependencies:
1. Test thoroughly in development environment
2. Update environment variables if needed
3. Run migration scripts if database schema changes
4. Update frontend components if API changes

---

This integration provides a complete foundation for Twilio Voice services in your Junk Removal application, including phone number management, browser calling, call forwarding, and comprehensive call logging.
