const { sendSMS, sendBulkSMS, getMessageDetails, getMessagesForNumber } = require('../services/sms');
const TwilioSMSLog = require('../models/TwilioSMSLog');

/**
 * Send SMS message
 */
exports.sendSMS = async (req, res, next) => {
  try {
    const { to, body, from } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!to || !body) {
      return res.status(400).json({
        success: false,
        error: 'Phone number (to) and message body are required'
      });
    }

    // Validate phone number format (basic validation)
    if (!to.match(/^\+[1-9]\d{1,14}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Use E.164 format (e.g., +15551234567)'
      });
    }

    // Validate message length
    if (body.length > 1600) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Maximum 1600 characters allowed.'
      });
    }

    // Send SMS
    const result = await sendSMS(to, body, from);

    // Log SMS to database
    await TwilioSMSLog.create({
      user_id: userId,
      message_sid: result.sid,
      to_number: result.to,
      from_number: result.from,
      body: body,
      status: result.status,
      direction: 'outbound',
      price: result.price,
      price_unit: result.priceUnit,
      date_sent: result.dateSent
    });

    res.json({
      success: true,
      message: 'SMS sent successfully',
      data: {
        sid: result.sid,
        status: result.status,
        to: result.to,
        from: result.from,
        body: body,
        dateSent: result.dateSent
      }
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    next(error);
  }
};

/**
 * Send bulk SMS messages
 */
exports.sendBulkSMS = async (req, res, next) => {
  try {
    const { recipients, body, from } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Recipients array is required and must not be empty'
      });
    }

    if (!body) {
      return res.status(400).json({
        success: false,
        error: 'Message body is required'
      });
    }

    // Validate message length
    if (body.length > 1600) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Maximum 1600 characters allowed.'
      });
    }

    // Validate phone numbers
    const invalidNumbers = recipients.filter(num => !num.match(/^\+[1-9]\d{1,14}$/));
    if (invalidNumbers.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid phone number format: ${invalidNumbers.join(', ')}. Use E.164 format (e.g., +15551234567)`
      });
    }

    // Send bulk SMS
    const results = await sendBulkSMS(recipients, body, from);

    // Log successful SMS to database
    const successfulMessages = results.filter(r => r.success);
    for (const result of successfulMessages) {
      await TwilioSMSLog.create({
        user_id: userId,
        message_sid: result.message.sid,
        to_number: result.to,
        from_number: result.message.from,
        body: body,
        status: result.message.status,
        direction: 'outbound',
        price: result.message.price,
        price_unit: result.message.priceUnit,
        date_sent: result.message.dateSent
      });
    }

    const successCount = successfulMessages.length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      message: `Bulk SMS completed. ${successCount} sent, ${failureCount} failed.`,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results: results
      }
    });

  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    next(error);
  }
};

/**
 * Get SMS message details
 */
exports.getMessageDetails = async (req, res, next) => {
  try {
    const { messageSid } = req.params;
    const userId = req.user.id;

    // Get message from Twilio
    const message = await getMessageDetails(messageSid);

    // Verify user has access to this message (optional security check)
    const dbMessage = await TwilioSMSLog.findByMessageSid(messageSid);
    if (dbMessage && dbMessage.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this message'
      });
    }

    res.json({
      success: true,
      data: {
        sid: message.sid,
        to: message.to,
        from: message.from,
        body: message.body,
        status: message.status,
        direction: message.direction,
        price: message.price,
        priceUnit: message.priceUnit,
        dateSent: message.dateSent,
        dateCreated: message.dateCreated,
        dateUpdated: message.dateUpdated,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      }
    });

  } catch (error) {
    console.error('Error getting message details:', error);
    next(error);
  }
};

/**
 * Get SMS logs for user
 */
exports.getSMSLogs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      phone_number, 
      status, 
      direction, 
      start_date, 
      end_date,
      limit = 50,
      offset = 0
    } = req.query;

    const options = {};
    if (phone_number) options.phone_number = phone_number;
    if (status) options.status = status;
    if (direction) options.direction = direction;
    if (start_date && end_date) {
      options.start_date = start_date;
      options.end_date = end_date;
    }
    options.limit = parseInt(limit);
    options.offset = parseInt(offset);

    const smsLogs = await TwilioSMSLog.findByUserId(userId, options);
    const stats = await TwilioSMSLog.getSMSStats(userId, options);

    res.json({
      success: true,
      data: {
        smsLogs: smsLogs.map(log => log.toJSON()),
        stats: stats
      }
    });

  } catch (error) {
    console.error('Error getting SMS logs:', error);
    next(error);
  }
};

/**
 * Get SMS statistics
 */
exports.getSMSStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    const options = {};
    if (start_date && end_date) {
      options.start_date = start_date;
      options.end_date = end_date;
    }

    const stats = await TwilioSMSLog.getSMSStats(userId, options);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error getting SMS stats:', error);
    next(error);
  }
};
