const crypto = require('crypto');
const config = require('../config/config');

const validateWebhook = (req, res, next) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    
    if (!signature || !timestamp) {
      const error = new Error('Missing webhook signature or timestamp');
      error.statusCode = 401;
      error.code = 'MISSING_WEBHOOK_HEADERS';
      return next(error);
    }

    // Check if timestamp is recent (within 5 minutes)
    const now = Date.now();
    const timestampMs = parseInt(timestamp);
    if (Math.abs(now - timestampMs) > 5 * 60 * 1000) {
      const error = new Error('Webhook timestamp is too old');
      error.statusCode = 401;
      error.code = 'WEBHOOK_TIMESTAMP_EXPIRED';
      return next(error);
    }

    // Verify signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', config.webhookSecret)
      .update(payload + timestamp)
      .digest('hex');

    if (signature !== expectedSignature) {
      const error = new Error('Invalid webhook signature');
      error.statusCode = 401;
      error.code = 'INVALID_WEBHOOK_SIGNATURE';
      return next(error);
    }

    next();
  } catch (error) {
    error.statusCode = 401;
    error.code = 'WEBHOOK_VALIDATION_FAILED';
    next(error);
  }
};

module.exports = {
  validateWebhook
};
