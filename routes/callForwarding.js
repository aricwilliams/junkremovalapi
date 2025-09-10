const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const callForwardingController = require('../controllers/callForwardingController');

// Call Forwarding Routes
router.post('/', auth, callForwardingController.createForwarding);
router.get('/', auth, callForwardingController.getForwardingRules);
router.get('/phone/:phoneNumberId', auth, callForwardingController.getForwardingByPhoneNumber);
router.put('/:id', auth, callForwardingController.updateForwarding);
router.patch('/:id/toggle', auth, callForwardingController.toggleForwarding);
router.delete('/:id', auth, callForwardingController.deleteForwarding);
router.get('/stats', auth, callForwardingController.getForwardingStats);

module.exports = router;