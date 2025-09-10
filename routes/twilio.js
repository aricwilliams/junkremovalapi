const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const twilioController = require('../controllers/twilioController');

// Phone Number Management Routes
router.post('/buy-number', auth, twilioController.buyNumber);
router.get('/available-numbers', auth, twilioController.searchAvailableNumbers);
router.get('/my-numbers', auth, twilioController.getMyNumbers);
router.put('/my-numbers/:id', auth, twilioController.updatePhoneNumber);
router.delete('/my-numbers/:id', auth, twilioController.releasePhoneNumber);

// Browser Calling
router.get('/access-token', auth, twilioController.getAccessToken);

// Call Handling & Webhooks
router.post('/twiml', twilioController.handleTwiml);
router.post('/status-callback', twilioController.handleStatusCallback);
router.post('/recording-callback', twilioController.handleRecordingCallback);

// Call Management
router.get('/call-logs', auth, twilioController.getCallLogs);
router.get('/recordings', auth, twilioController.getRecordings);

module.exports = router;