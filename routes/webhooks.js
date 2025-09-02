const express = require('express');
const { validateWebhook } = require('../middleware/webhook');
const { handleJobWebhook } = require('../controllers/webhookController');

const router = express.Router();

// Webhook endpoint for job updates
router.post('/jobs', validateWebhook, handleJobWebhook);

module.exports = router;
