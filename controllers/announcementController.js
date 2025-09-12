const db = require('../config/database');

// Get all announcements
const getAnnouncements = async (req, res, next) => {
  try {
    const { visible_only = false } = req.query;
    
    let sql = 'SELECT * FROM announcements';
    let params = [];
    
    if (visible_only === 'true') {
      sql += ' WHERE is_visible = 1';
    }
    
    sql += ' ORDER BY id DESC';
    
    const announcements = await db.query(sql, params);
    
    res.json({
      success: true,
      data: { announcements },
      count: announcements.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get announcements error:', error);
    next(error);
  }
};

// Get announcement by ID
const getAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const announcements = await db.query(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );
    
    if (announcements.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
        error: 'ANNOUNCEMENT_NOT_FOUND'
      });
    }
    
    res.json({
      success: true,
      data: { announcement: announcements[0] },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get announcement error:', error);
    next(error);
  }
};

// Create new announcement
const createAnnouncement = async (req, res, next) => {
  try {
    const { message, is_visible = false } = req.body;
    
    // Validate required fields
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
        error: 'MISSING_MESSAGE'
      });
    }
    
    // Create announcement
    const result = await db.query(
      'INSERT INTO announcements (message, is_visible) VALUES (?, ?)',
      [message.trim(), is_visible ? 1 : 0]
    );
    
    // Get the created announcement
    const newAnnouncement = await db.query(
      'SELECT * FROM announcements WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: { announcement: newAnnouncement[0] },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create announcement error:', error);
    next(error);
  }
};

// Update announcement
const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, is_visible } = req.body;
    
    // Check if announcement exists
    const existingAnnouncement = await db.query(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );
    
    if (existingAnnouncement.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
        error: 'ANNOUNCEMENT_NOT_FOUND'
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (message !== undefined) {
      if (!message || message.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Message cannot be empty',
          error: 'INVALID_MESSAGE'
        });
      }
      updates.push('message = ?');
      values.push(message.trim());
    }
    
    if (is_visible !== undefined) {
      updates.push('is_visible = ?');
      values.push(is_visible ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        error: 'NO_UPDATES'
      });
    }
    
    values.push(id);
    
    // Update announcement
    await db.query(
      `UPDATE announcements SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Get updated announcement
    const updatedAnnouncement = await db.query(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: { announcement: updatedAnnouncement[0] },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update announcement error:', error);
    next(error);
  }
};

// Delete announcement
const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if announcement exists
    const existingAnnouncement = await db.query(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );
    
    if (existingAnnouncement.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
        error: 'ANNOUNCEMENT_NOT_FOUND'
      });
    }
    
    // Delete announcement
    await db.query('DELETE FROM announcements WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Announcement deleted successfully',
      data: { deleted_announcement: existingAnnouncement[0] },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete announcement error:', error);
    next(error);
  }
};

// Toggle announcement visibility
const toggleAnnouncementVisibility = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if announcement exists
    const existingAnnouncement = await db.query(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );
    
    if (existingAnnouncement.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
        error: 'ANNOUNCEMENT_NOT_FOUND'
      });
    }
    
    const currentVisibility = existingAnnouncement[0].is_visible;
    const newVisibility = currentVisibility ? 0 : 1;
    
    // Toggle visibility
    await db.query(
      'UPDATE announcements SET is_visible = ? WHERE id = ?',
      [newVisibility, id]
    );
    
    // Get updated announcement
    const updatedAnnouncement = await db.query(
      'SELECT * FROM announcements WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: `Announcement ${newVisibility ? 'made visible' : 'hidden'}`,
      data: { announcement: updatedAnnouncement[0] },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Toggle announcement visibility error:', error);
    next(error);
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementVisibility
};
