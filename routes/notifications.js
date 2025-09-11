const express = require('express');
const router = express.Router();
const { 
  createNotification, 
  getNotifications, 
  getNotificationById, 
  updateNotification, 
  deleteNotification,
  getNotificationStats 
} = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');
const { validateNotification } = require('../middleware/notificationValidation');

// All routes require authentication
router.use(auth);

// Create notification
router.post('/', validateNotification, createNotification);

// Get all notifications for the authenticated business
router.get('/', getNotifications);

// Get notification statistics
router.get('/stats', getNotificationStats);

// Get specific notification by ID
router.get('/:id', getNotificationById);

// Update notification
router.put('/:id', validateNotification, updateNotification);

// Delete notification
router.delete('/:id', deleteNotification);

module.exports = router;
