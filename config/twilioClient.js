const twilio = require('twilio');
const config = require('./config');
require('dotenv').config();

// Validate Twilio configuration
if (!config.twilio.accountSid || !config.twilio.authToken) {
  console.warn('⚠️  Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your .env file');
}

if (!config.twilio.apiKey || !config.twilio.apiSecret) {
  console.warn('⚠️  Twilio API credentials not configured. Please set TWILIO_API_KEY and TWILIO_API_SECRET in your .env file');
}

if (!config.twilio.twimlAppSid) {
  console.warn('⚠️  Twilio TwiML App SID not configured. Please set TWILIO_TWIML_APP_SID in your .env file');
}

// Initialize Twilio client only if credentials are available
let client = null;
if (config.twilio.accountSid && config.twilio.authToken) {
  try {
    client = twilio(config.twilio.accountSid, config.twilio.authToken);
    console.log('✅ Twilio client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Twilio client:', error.message);
  }
} else {
  console.warn('⚠️  Twilio client not initialized - missing credentials');
}

module.exports = client;
