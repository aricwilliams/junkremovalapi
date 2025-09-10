const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const smsController = require('../controllers/smsController');

// SMS Routes
router.post('/send', auth, smsController.sendSMS);
router.post('/send-bulk', auth, smsController.sendBulkSMS);
router.get('/message/:messageSid', auth, smsController.getMessageDetails);
router.get('/logs', auth, smsController.getSMSLogs);
router.get('/stats', auth, smsController.getSMSStats);

module.exports = router;
