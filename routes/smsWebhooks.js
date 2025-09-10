const express = require('express');
const router = express.Router();
const smsWebhookController = require('../controllers/smsWebhookController');

// SMS Webhook Routes (no authentication required - Twilio calls these directly)
router.post('/inbound', smsWebhookController.handleInboundSMS);
router.post('/status', smsWebhookController.handleSMSStatusCallback);
router.post('/delivery', smsWebhookController.handleSMSDeliveryReceipt);

module.exports = router;
