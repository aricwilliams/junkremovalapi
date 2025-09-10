const client = require('../config/twilioClient');
const config = require('../config/config');
const UserPhoneNumber = require('../models/UserPhoneNumber');
const TwilioCallLog = require('../models/TwilioCallLog');
const CallForwarding = require('../models/CallForwarding');

// Buy a phone number
exports.buyNumber = async (req, res, next) => {
  try {
    if (!client) {
      return res.status(503).json({ 
        error: 'Twilio service not configured. Please set up Twilio credentials.' 
      });
    }

    const { phoneNumber, areaCode, country = 'US' } = req.body;
    const userId = req.user.id;

    if (!phoneNumber && !areaCode) {
      return res.status(400).json({ 
        error: 'Either phoneNumber or areaCode is required' 
      });
    }

    let searchParams = {};
    if (phoneNumber) {
      searchParams.phoneNumber = phoneNumber;
    } else if (areaCode) {
      searchParams.areaCode = areaCode;
    }

    const availableNumbers = await client.availablePhoneNumbers(country)
      .local
      .list(searchParams);

    if (availableNumbers.length === 0) {
      return res.status(404).json({ 
        error: 'No available phone numbers found' 
      });
    }

    const numberToBuy = availableNumbers[0];
    const purchasedNumber = await client.incomingPhoneNumbers
      .create({
        phoneNumber: numberToBuy.phoneNumber,
        voiceApplicationSid: config.twilio.appSid,
        voiceUrl: `${config.twilio.serverUrl}/api/twilio/twiml`,
        statusCallback: `${config.twilio.serverUrl}/api/twilio/status-callback`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST'
      });

    const phoneNumberId = await UserPhoneNumber.create({
      user_id: userId,
      phone_number: purchasedNumber.phoneNumber,
      twilio_sid: purchasedNumber.sid,
      friendly_name: purchasedNumber.friendlyName || `${numberToBuy.locality || 'Unknown'} Number`,
      country: country,
      region: numberToBuy.region || null,
      locality: numberToBuy.locality || null,
      purchase_price: purchasedNumber.price || null,
      purchase_price_unit: purchasedNumber.priceUnit || 'USD',
      monthly_cost: 1.00,
      capabilities: numberToBuy.capabilities || null
    });

    res.json({
      success: true,
      message: 'Phone number purchased successfully',
      phoneNumber: purchasedNumber.phoneNumber,
      sid: purchasedNumber.sid,
      id: phoneNumberId
    });

  } catch (err) {
    console.error('Error buying number:', err);
    next(err);
  }
};

// Search available phone numbers
exports.searchAvailableNumbers = async (req, res, next) => {
  try {
    if (!client) {
      return res.status(503).json({ 
        error: 'Twilio service not configured. Please set up Twilio credentials.' 
      });
    }

    const { areaCode, country = 'US', limit = 10 } = req.query;

    if (!areaCode) {
      return res.status(400).json({ 
        error: 'areaCode is required' 
      });
    }

    const availableNumbers = await client.availablePhoneNumbers(country)
      .local
      .list({ areaCode, limit: parseInt(limit) });

    res.json({
      success: true,
      availableNumbers: availableNumbers.map(number => ({
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        locality: number.locality,
        region: number.region,
        country: number.countryCode,
        capabilities: number.capabilities
      }))
    });

  } catch (err) {
    console.error('Error searching available numbers:', err);
    next(err);
  }
};

// Get user's phone numbers
exports.getMyNumbers = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const phoneNumbers = await UserPhoneNumber.findByUserId(userId);
    const stats = await UserPhoneNumber.getUserPhoneNumberStats(userId);

    res.json({
      success: true,
      phoneNumbers: phoneNumbers.map(pn => pn.toJSON()),
      stats: stats
    });
  } catch (err) {
    console.error('Error fetching phone numbers:', err);
    next(err);
  }
};

// Update phone number
exports.updatePhoneNumber = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { friendly_name, is_active } = req.body;

    const phoneNumber = await UserPhoneNumber.findById(id);
    if (!phoneNumber) {
      return res.status(404).json({ error: 'Phone number not found' });
    }

    if (phoneNumber.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = {};
    if (friendly_name !== undefined) updateData.friendly_name = friendly_name;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updated = await UserPhoneNumber.update(id, updateData);
    if (!updated) {
      return res.status(500).json({ error: 'Failed to update phone number' });
    }

    res.json({
      success: true,
      message: 'Phone number updated successfully'
    });

  } catch (err) {
    console.error('Error updating phone number:', err);
    next(err);
  }
};

// Release phone number
exports.releasePhoneNumber = async (req, res, next) => {
  try {
    if (!client) {
      return res.status(503).json({ 
        error: 'Twilio service not configured. Please set up Twilio credentials.' 
      });
    }

    const { id } = req.params;
    const userId = req.user.id;

    const phoneNumber = await UserPhoneNumber.findById(id);
    if (!phoneNumber) {
      return res.status(404).json({ error: 'Phone number not found' });
    }

    if (phoneNumber.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Release from Twilio
    await client.incomingPhoneNumbers(phoneNumber.twilio_sid).remove();

    // Delete from database
    const deleted = await UserPhoneNumber.delete(id);
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete phone number' });
    }

    res.json({
      success: true,
      message: 'Phone number released successfully'
    });

  } catch (err) {
    console.error('Error releasing phone number:', err);
    next(err);
  }
};

// Generate Twilio Voice Access Token for browser calling
exports.getAccessToken = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const userNumbers = await UserPhoneNumber.findActiveByUserId(userId);
    if (userNumbers.length === 0) {
      return res.status(400).json({ 
        error: 'No active phone numbers found' 
      });
    }
    
    const AccessToken = require('twilio').jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;
    
    const token = new AccessToken(
      config.twilio.accountSid,
      config.twilio.apiKey,
      config.twilio.apiSecret,
      { identity: `user-${userId}` }
    );
    
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: config.twilio.twimlAppSid,
      incomingAllow: true
    });
    
    token.addGrant(voiceGrant);
    
    res.json({ 
      token: token.toJwt(),
      identity: `user-${userId}`,
      availableNumbers: userNumbers.map(num => ({
        phoneNumber: num.phone_number,
        friendlyName: num.friendly_name
      }))
    });
    
  } catch (error) {
    console.error('Error generating access token:', error);
    next(error);
  }
};

// TwiML endpoint for call handling
exports.handleTwiml = async (req, res, next) => {
  try {
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();

    const to = req.body.To || req.query.To;
    const from = req.body.From || req.query.From;
    const direction = req.body.Direction || req.query.Direction;
    const caller = req.body.Caller || req.query.Caller;
    const callSid = req.body.CallSid || req.query.CallSid;
    
    // Handle browser-to-phone calls
    const isBrowserCall = direction === 'inbound' && 
                         caller && caller.startsWith('client:') && 
                         to && to.startsWith('+') && 
                         from && from.startsWith('+');
    
    if (isBrowserCall) {
      const dial = twiml.dial({
        callerId: from,
        record: 'record-from-answer-dual',
        recordingStatusCallback: `${config.twilio.serverUrl}/api/twilio/recording-callback`,
        recordingStatusCallbackEvent: ['completed'],
        statusCallback: `${config.twilio.serverUrl}/api/twilio/status-callback`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        statusCallbackMethod: 'POST'
      });
      dial.number(to);
    } else if (direction === 'inbound') {
      // Handle real inbound calls with call forwarding
      const phoneNumberToCheck = req.body.Called || req.body.To;
      const userPhoneNumber = await UserPhoneNumber.findByPhoneNumber(phoneNumberToCheck);
      
      if (userPhoneNumber) {
        const forwarding = await CallForwarding.getActiveForwardingForNumber(userPhoneNumber.id);
        
        if (forwarding && forwarding.is_active) {
          const dial = twiml.dial({
            callerId: phoneNumberToCheck,
            record: 'record-from-answer-dual',
            recordingStatusCallback: `${config.twilio.serverUrl}/api/twilio/recording-callback`,
            recordingStatusCallbackEvent: ['completed'],
            statusCallback: `${config.twilio.serverUrl}/api/twilio/status-callback`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            statusCallbackMethod: 'POST',
            timeout: forwarding.ring_timeout || 20
          });
          dial.number(forwarding.forward_to_number);
        } else {
          twiml.say('Hello! Thank you for calling.');
          twiml.pause({ length: 1 });
          twiml.say('This is a Twilio phone system. Goodbye!');
        }
      } else {
        twiml.say('Hello! Thank you for calling.');
        twiml.pause({ length: 1 });
        twiml.say('This is a Twilio phone system. Goodbye!');
      }
    }

    res.type('text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('Error in TwiML endpoint:', error);
    const VoiceResponse = require('twilio').twiml.VoiceResponse;
    const twiml = new VoiceResponse();
    twiml.say('I\'m sorry, there was an error processing your call. Please try again.');
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  }
};

// Call status callback
exports.handleStatusCallback = async (req, res, next) => {
  try {
    const { 
      CallSid, 
      CallStatus, 
      CallDuration, 
      CallPrice, 
      CallPriceUnit,
      From,
      To,
      Direction,
      StartTime,
      EndTime
    } = req.body;
    
    // Find or create call log entry
    let callLog = await TwilioCallLog.findByCallSid(CallSid);
    
    if (!callLog) {
      // Try to find user by phone number
      const userPhoneNumber = await UserPhoneNumber.findByPhoneNumber(To || From);
      const userId = userPhoneNumber ? userPhoneNumber.user_id : null;
      
      await TwilioCallLog.create({
        user_id: userId,
        phone_number_id: userPhoneNumber ? userPhoneNumber.id : null,
        call_sid: CallSid,
        from_number: From,
        to_number: To,
        status: CallStatus,
        direction: Direction,
        duration: CallDuration || 0,
        price: CallPrice,
        price_unit: CallPriceUnit,
        start_time: StartTime,
        end_time: EndTime
      });
    } else {
      await TwilioCallLog.update(CallSid, {
        status: CallStatus,
        duration: CallDuration || 0,
        price: CallPrice,
        price_unit: CallPriceUnit,
        start_time: StartTime,
        end_time: EndTime
      });
    }

    console.log(`Call ${CallSid} status updated to: ${CallStatus}`);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error updating call status:', err);
    res.sendStatus(500);
  }
};

// Recording callback
exports.handleRecordingCallback = async (req, res, next) => {
  try {
    const { 
      RecordingUrl, 
      RecordingSid, 
      CallSid, 
      RecordingDuration,
      RecordingChannels,
      RecordingStatus 
    } = req.body;

    await TwilioCallLog.update(CallSid, {
      recording_url: RecordingUrl,
      recording_sid: RecordingSid,
      recording_duration: RecordingDuration,
      recording_channels: RecordingChannels,
      recording_status: RecordingStatus
    });

    console.log(`Recording saved for call ${CallSid}: ${RecordingUrl}`);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error processing recording callback:', err);
    res.sendStatus(500);
  }
};

// Get call logs
exports.getCallLogs = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { 
      phone_number_id, 
      status, 
      direction, 
      start_date, 
      end_date,
      limit = 50,
      offset = 0
    } = req.query;

    const options = {};
    if (phone_number_id) options.phone_number_id = phone_number_id;
    if (status) options.status = status;
    if (direction) options.direction = direction;
    if (start_date && end_date) {
      options.start_date = start_date;
      options.end_date = end_date;
    }
    options.limit = parseInt(limit);
    options.offset = parseInt(offset);

    const callLogs = await TwilioCallLog.findByUserId(userId, options);
    const stats = await TwilioCallLog.getCallStats(userId, options);

    res.json({
      success: true,
      callLogs: callLogs.map(log => log.toJSON()),
      stats: stats
    });

  } catch (err) {
    console.error('Error fetching call logs:', err);
    next(err);
  }
};

// Get call recordings
exports.getRecordings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const callLogs = await TwilioCallLog.findByUserId(userId, { 
      limit: parseInt(limit) 
    });

    const recordings = callLogs
      .filter(log => log.recording_url)
      .map(log => ({
        call_sid: log.call_sid,
        recording_url: log.recording_url,
        recording_sid: log.recording_sid,
        recording_duration: log.recording_duration,
        recording_status: log.recording_status,
        from_number: log.from_number,
        to_number: log.to_number,
        created_at: log.created_at
      }));

    res.json({
      success: true,
      recordings: recordings
    });

  } catch (err) {
    console.error('Error fetching recordings:', err);
    next(err);
  }
};
