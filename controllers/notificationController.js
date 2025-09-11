const db = require('../config/database');

/**
 * Create or update a notification (upsert - one per business)
 */
const createNotification = async (req, res, next) => {
  try {
    const { google_review_link } = req.body;
    const businessId = req.user.id;

    // Validate required fields
    if (!google_review_link) {
      return res.status(400).json({
        success: false,
        message: 'Google review link is required',
        error: 'MISSING_REQUIRED_FIELD'
      });
    }

    // Validate URL format
    try {
      new URL(google_review_link);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL format for Google review link',
        error: 'INVALID_URL_FORMAT'
      });
    }

    // Check if notification already exists for this business
    const existingNotifications = await db.query(
      'SELECT * FROM notifications WHERE business_id = ?',
      [businessId]
    );

    let notification;
    let message;

    if (existingNotifications.length > 0) {
      // Update existing notification
      await db.query(
        'UPDATE notifications SET google_review_link = ?, updated_at = CURRENT_TIMESTAMP WHERE business_id = ?',
        [google_review_link, businessId]
      );

      // Get the updated notification
      const updatedNotifications = await db.query(
        'SELECT * FROM notifications WHERE business_id = ?',
        [businessId]
      );

      notification = updatedNotifications[0];
      message = 'Notification updated successfully';
    } else {
      // Insert new notification
      const result = await db.query(
        'INSERT INTO notifications (business_id, google_review_link) VALUES (?, ?)',
        [businessId, google_review_link]
      );

      const notificationId = result.insertId;

      // Get the created notification
      const newNotifications = await db.query(
        'SELECT * FROM notifications WHERE id = ?',
        [notificationId]
      );

      notification = newNotifications[0];
      message = 'Notification created successfully';
    }

    res.status(201).json({
      success: true,
      message: message,
      data: {
        notification: notification
      }
    });

  } catch (error) {
    console.error('Error creating/updating notification:', error);
    next(error);
  }
};

/**
 * Get all notifications for the authenticated business
 */
const getNotifications = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { limit = 50, offset = 0, sort = 'created_at', order = 'DESC' } = req.query;

    // Parse and validate inputs
    const businessIdNum = Number(businessId);
    const limitRaw = Number(limit);
    const offsetRaw = Number(offset);
    
    const limitNum = Math.min(Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 50), 100);
    const offsetNum = Math.max(0, Number.isFinite(offsetRaw) ? offsetRaw : 0);

    if (!Number.isFinite(businessIdNum)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid business_id' 
      });
    }

    // Validate sort field
    const allowedSortFields = ['id', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get notifications with pagination - inline sanitized integers
    const notifications = await db.query(
      `SELECT * FROM notifications 
       WHERE business_id = ? 
       ORDER BY ${sortField} ${sortOrder} 
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      [businessIdNum]
    );

    // Get total count for pagination
    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM notifications WHERE business_id = ?',
      [businessIdNum]
    );

    const total = countResult[0].total;

    res.json({
      success: true,
      data: {
        notifications: notifications,
        pagination: {
          total: total,
          limit: limitNum,
          offset: offsetNum,
          hasMore: (offsetNum + limitNum) < total
        }
      }
    });

  } catch (error) {
    console.error('Error getting notifications:', error);
    next(error);
  }
};

/**
 * Get a specific notification by ID
 */
const getNotificationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const businessId = req.user.id;

    // Get notification and verify ownership
    const notifications = await db.query(
      'SELECT * FROM notifications WHERE id = ? AND business_id = ?',
      [id, businessId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        error: 'NOTIFICATION_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        notification: notifications[0]
      }
    });

  } catch (error) {
    console.error('Error getting notification:', error);
    next(error);
  }
};

/**
 * Update a notification
 */
const updateNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { google_review_link } = req.body;
    const businessId = req.user.id;

    // Check if notification exists and belongs to the business
    const existingNotifications = await db.query(
      'SELECT * FROM notifications WHERE id = ? AND business_id = ?',
      [id, businessId]
    );

    if (existingNotifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        error: 'NOTIFICATION_NOT_FOUND'
      });
    }

    // Validate URL format if provided
    if (google_review_link) {
      try {
        new URL(google_review_link);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid URL format for Google review link',
          error: 'INVALID_URL_FORMAT'
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (google_review_link !== undefined) {
      updateFields.push('google_review_link = ?');
      updateValues.push(google_review_link);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        error: 'NO_VALID_FIELDS'
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    // Update notification
    await db.query(
      `UPDATE notifications SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Get updated notification
    const updatedNotification = await db.query(
      'SELECT * FROM notifications WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Notification updated successfully',
      data: {
        notification: updatedNotification[0]
      }
    });

  } catch (error) {
    console.error('Error updating notification:', error);
    next(error);
  }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const businessId = req.user.id;

    // Check if notification exists and belongs to the business
    const existingNotifications = await db.query(
      'SELECT * FROM notifications WHERE id = ? AND business_id = ?',
      [id, businessId]
    );

    if (existingNotifications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
        error: 'NOTIFICATION_NOT_FOUND'
      });
    }

    // Delete notification
    await db.query(
      'DELETE FROM notifications WHERE id = ? AND business_id = ?',
      [id, businessId]
    );

    res.json({
      success: true,
      message: 'Notification deleted successfully',
      data: {
        deletedId: parseInt(id)
      }
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    next(error);
  }
};

/**
 * Get notification statistics
 */
const getNotificationStats = async (req, res, next) => {
  try {
    const businessId = req.user.id;

    // Get basic statistics
    const stats = await db.query(
      `SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN google_review_link IS NOT NULL THEN 1 END) as notifications_with_links,
        COUNT(CASE WHEN google_review_link IS NULL THEN 1 END) as notifications_without_links,
        MIN(created_at) as first_notification_date,
        MAX(created_at) as last_notification_date
       FROM notifications 
       WHERE business_id = ?`,
      [businessId]
    );

    res.json({
      success: true,
      data: {
        stats: stats[0]
      }
    });

  } catch (error) {
    console.error('Error getting notification stats:', error);
    next(error);
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  getNotificationStats
};
