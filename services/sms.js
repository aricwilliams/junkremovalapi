const twilio = require('twilio');
const config = require('../config/config');

// Initialize Twilio client
const client = twilio(config.twilio.accountSid, config.twilio.authToken);

/**
 * Send SMS message
 * @param {string} to - Recipient phone number
 * @param {string} body - Message body
 * @param {string} from - Sender phone number (optional, uses messaging service if not provided)
 * @returns {Promise<Object>} Twilio message object
 */
async function sendSMS(to, body, from = null) {
  try {
    const params = {
      to: to,
      body: body
    };

    // Use messaging service if available, otherwise use from number
    if (config.twilio.messagingServiceSid) {
      params.messagingServiceSid = config.twilio.messagingServiceSid;
    } else if (from) {
      params.from = from;
    } else {
      throw new Error('Either messagingServiceSid or from number must be configured');
    }

    // Add status callback for delivery tracking
    params.statusCallback = `${config.twilio.serverUrl}/webhooks/twilio/status`;
    params.statusCallbackMethod = 'POST';

    console.log('📱 Sending SMS:', { to, body: body.substring(0, 50) + '...' });

    const msg = await client.messages.create(params);
    
    console.log('✅ SMS sent successfully:', {
      sid: msg.sid,
      status: msg.status,
      to: msg.to,
      from: msg.from
    });

    return msg;
  } catch (error) {
    console.error('❌ SMS send failed:', error);
    throw error;
  }
}

/**
 * Send bulk SMS messages
 * @param {Array} recipients - Array of phone numbers
 * @param {string} body - Message body
 * @param {string} from - Sender phone number (optional)
 * @returns {Promise<Array>} Array of message results
 */
async function sendBulkSMS(recipients, body, from = null) {
  try {
    const promises = recipients.map(to => sendSMS(to, body, from));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => ({
      to: recipients[index],
      success: result.status === 'fulfilled',
      message: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
  } catch (error) {
    console.error('❌ Bulk SMS send failed:', error);
    throw error;
  }
}

/**
 * Get message details by SID
 * @param {string} messageSid - Twilio message SID
 * @returns {Promise<Object>} Message details
 */
async function getMessageDetails(messageSid) {
  try {
    const message = await client.messages(messageSid).fetch();
    return message;
  } catch (error) {
    console.error('❌ Failed to get message details:', error);
    throw error;
  }
}

/**
 * Get messages for a specific phone number
 * @param {string} phoneNumber - Phone number to get messages for
 * @param {Object} options - Query options (limit, dateSent, etc.)
 * @returns {Promise<Array>} Array of messages
 */
async function getMessagesForNumber(phoneNumber, options = {}) {
  try {
    const messages = await client.messages.list({
      to: phoneNumber,
      limit: options.limit || 50,
      dateSent: options.dateSent,
      ...options
    });
    return messages;
  } catch (error) {
    console.error('❌ Failed to get messages for number:', error);
    throw error;
  }
}

module.exports = {
  sendSMS,
  sendBulkSMS,
  getMessageDetails,
  getMessagesForNumber
};
