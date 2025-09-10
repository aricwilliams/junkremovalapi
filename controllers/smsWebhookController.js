const { twiml: { MessagingResponse } } = require('twilio');
const TwilioSMSLog = require('../models/TwilioSMSLog');
const UserPhoneNumber = require('../models/UserPhoneNumber');

/**
 * Handle inbound SMS messages
 */
exports.handleInboundSMS = async (req, res, next) => {
  try {
    const {
      From: from,
      To: to,
      Body: body,
      MessageSid: messageSid,
      NumMedia: numMedia,
      MediaUrl0: mediaUrl0,
      MediaContentType0: mediaContentType0
    } = req.body;

    console.log('📱 Inbound SMS received:', {
      from,
      to,
      body: body ? body.substring(0, 50) + '...' : 'No body',
      messageSid,
      hasMedia: numMedia > 0
    });

    // Find user by phone number
    const userPhoneNumber = await UserPhoneNumber.findByPhoneNumber(to);
    const userId = userPhoneNumber ? userPhoneNumber.business_id : null;

    // Log inbound SMS to database (if available)
    try {
      await TwilioSMSLog.create({
        user_id: userId,
        message_sid: messageSid,
        to_number: to,
        from_number: from,
        body: body,
        status: 'received',
        direction: 'inbound',
        price: null,
        price_unit: null,
        date_sent: new Date(),
        date_created: new Date(),
        date_updated: new Date()
      });
    } catch (dbError) {
      console.warn('⚠️ Failed to log SMS to database:', dbError.message);
      // Continue processing even if database logging fails
    }

    // Create TwiML response
    const response = new MessagingResponse();

    // Handle different message types
    if (body) {
      const lowerBody = body.toLowerCase().trim();
      
      // Handle STOP/UNSUBSCRIBE commands
      if (lowerBody === 'stop' || lowerBody === 'unsubscribe' || lowerBody === 'quit') {
        response.message('You have been unsubscribed from our messages. Reply START to resubscribe.');
        
        // TODO: Update user preferences to stop receiving messages
        console.log('🚫 User unsubscribed:', from);
      }
      // Handle START/SUBSCRIBE commands
      else if (lowerBody === 'start' || lowerBody === 'subscribe') {
        response.message('You are now subscribed to receive messages from us. Reply STOP to unsubscribe.');
        
        // TODO: Update user preferences to allow receiving messages
        console.log('✅ User subscribed:', from);
      }
      // Handle HELP commands
      else if (lowerBody === 'help') {
        response.message('Reply with:\n• START to subscribe\n• STOP to unsubscribe\n• HELP for this message\n\nFor support, call us at your business number.');
      }
      // Default response for other messages
      else {
        response.message('Thanks for your message! We\'ll get back to you shortly. Reply STOP to opt out.');
        
        // TODO: Trigger notification to business owner
        console.log('💬 New customer message:', { from, body });
      }
    } else {
      // Handle media messages
      response.message('Thanks for your message! We\'ll get back to you shortly. Reply STOP to opt out.');
    }

    res.type('text/xml').send(response.toString());

  } catch (error) {
    console.error('Error handling inbound SMS:', error);
    
    // Send error response
    const response = new MessagingResponse();
    response.message('Sorry, there was an error processing your message. Please try again later.');
    
    res.type('text/xml').send(response.toString());
  }
};

/**
 * Handle SMS status callbacks
 */
exports.handleSMSStatusCallback = async (req, res, next) => {
  try {
    const {
      MessageSid: messageSid,
      MessageStatus: messageStatus,
      To: to,
      From: from,
      ErrorCode: errorCode,
      ErrorMessage: errorMessage
    } = req.body;

    console.log('📊 SMS Status Update:', {
      messageSid,
      messageStatus,
      to,
      from,
      errorCode,
      errorMessage
    });

    // Update SMS log status (if available)
    try {
      const updated = await TwilioSMSLog.updateStatus(
        messageSid,
        messageStatus,
        errorCode,
        errorMessage
      );

      if (updated) {
        console.log('✅ SMS status updated successfully');
      } else {
        console.log('⚠️ SMS log not found for SID:', messageSid);
      }
    } catch (dbError) {
      console.warn('⚠️ Failed to update SMS status in database:', dbError.message);
      // Continue processing even if database update fails
    }

    // Send 204 No Content response
    res.sendStatus(204);

  } catch (error) {
    console.error('Error handling SMS status callback:', error);
    res.sendStatus(500);
  }
};

/**
 * Handle SMS delivery receipts
 */
exports.handleSMSDeliveryReceipt = async (req, res, next) => {
  try {
    const {
      MessageSid: messageSid,
      MessageStatus: messageStatus,
      To: to,
      From: from,
      ErrorCode: errorCode,
      ErrorMessage: errorMessage,
      DateDelivered: dateDelivered
    } = req.body;

    console.log('📬 SMS Delivery Receipt:', {
      messageSid,
      messageStatus,
      to,
      from,
      errorCode,
      errorMessage,
      dateDelivered
    });

    // Update SMS log with delivery information (if available)
    try {
      const updated = await TwilioSMSLog.updateStatus(
        messageSid,
        messageStatus,
        errorCode,
        errorMessage
      );

      if (updated) {
        console.log('✅ SMS delivery receipt processed');
      } else {
        console.log('⚠️ SMS log not found for delivery receipt:', messageSid);
      }
    } catch (dbError) {
      console.warn('⚠️ Failed to update SMS delivery receipt in database:', dbError.message);
      // Continue processing even if database update fails
    }

    res.sendStatus(204);

  } catch (error) {
    console.error('Error handling SMS delivery receipt:', error);
    res.sendStatus(500);
  }
};
