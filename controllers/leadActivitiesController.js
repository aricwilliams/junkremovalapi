const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

// Helper function to create standardized API response
const createResponse = (success, message, data = null, error = null) => ({
  success,
  message,
  data,
  error,
  timestamp: new Date().toISOString()
});

// Get all activities for a specific lead
const getLeadActivities = async (req, res) => {
  try {
    const { id } = req.params;
    const { activity_type, date_from, date_to } = req.query;

    let whereClause = 'WHERE lead_id = ?';
    const params = [id];

    if (activity_type) {
      whereClause += ' AND activity_type = ?';
      params.push(activity_type);
    }

    if (date_from) {
      whereClause += ' AND DATE(activity_date) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(activity_date) <= ?';
      params.push(date_to);
    }

    const activitiesSql = `
      SELECT 
        id, activity_type, subject, description, activity_date, duration_minutes,
        outcome, next_action, next_action_date, scheduled_follow_up, 
        employee_id, is_completed, completed_at, notes, created_at
      FROM lead_activities 
      ${whereClause}
      ORDER BY activity_date DESC
    `;
    
    const activities = await query(activitiesSql, params);

    const response = createResponse(true, 'Lead activities retrieved successfully', {
      lead_id: id,
      activities: activities.map(activity => ({
        id: activity.id,
        type: activity.activity_type,
        subject: activity.subject,
        description: activity.description,
        activity_date: activity.activity_date,
        duration_minutes: activity.duration_minutes,
        outcome: activity.outcome,
        next_action: activity.next_action,
        next_action_date: activity.next_action_date,
        scheduled_follow_up: activity.scheduled_follow_up,
        employee_id: activity.employee_id,
        is_completed: activity.is_completed,
        completed_at: activity.completed_at,
        notes: activity.notes,
        created: activity.created_at
      }))
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting lead activities:', error);
    const response = createResponse(false, 'Failed to retrieve lead activities', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Add a new activity to a lead
const addLeadActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activityData = req.body;
    const activityId = uuidv4();

    // Check if lead exists
    const checkLeadSql = 'SELECT id FROM leads WHERE id = ? AND status != "deleted"';
    const existingLead = await query(checkLeadSql, [id]);
    
    if (existingLead.length === 0) {
      const response = createResponse(false, 'Lead not found', null, 'LEAD_NOT_FOUND');
      return res.status(404).json(response);
    }

    const activitySql = `
      INSERT INTO lead_activities (
        id, lead_id, activity_type, subject, description, activity_date,
        duration_minutes, outcome, next_action, next_action_date,
        scheduled_follow_up, employee_id, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await query(activitySql, [
      activityId,
      id,
      activityData.type,
      activityData.subject || null,
      activityData.description,
      activityData.activity_date || new Date(),
      activityData.duration_minutes || null,
      activityData.outcome || 'neutral',
      activityData.next_action || null,
      activityData.next_action_date || null,
      activityData.scheduled_follow_up || null,
      req.user?.id || null,
      activityData.notes || null
    ]);

    // Update lead's last_contact_date if this is a contact activity
    const contactActivities = ['phone_call', 'email', 'sms', 'meeting', 'site_visit'];
    if (contactActivities.includes(activityData.type)) {
      const updateLeadSql = `
        UPDATE leads 
        SET last_contact_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      await query(updateLeadSql, [id]);
    }

    const response = createResponse(true, 'Activity added successfully', {
      activity_id: activityId,
      lead_id: id,
      type: activityData.type
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('Error adding lead activity:', error);
    const response = createResponse(false, 'Failed to add activity', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Update an existing activity
const updateLeadActivity = async (req, res) => {
  try {
    const { id, activityId } = req.params;
    const updateData = req.body;

    // Check if activity exists
    const checkActivitySql = `
      SELECT id FROM lead_activities 
      WHERE id = ? AND lead_id = ?
    `;
    const existingActivity = await query(checkActivitySql, [activityId, id]);
    
    if (existingActivity.length === 0) {
      const response = createResponse(false, 'Activity not found', null, 'ACTIVITY_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateParams.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      const response = createResponse(false, 'No fields to update', null, 'NO_FIELDS_TO_UPDATE');
      return res.status(400).json(response);
    }

    const updateSql = `
      UPDATE lead_activities 
      SET ${updateFields.join(', ')} 
      WHERE id = ? AND lead_id = ?
    `;
    updateParams.push(activityId, id);

    await query(updateSql, updateParams);

    const response = createResponse(true, 'Activity updated successfully', {
      activity_id: activityId,
      lead_id: id,
      updated_fields: Object.keys(updateData)
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating lead activity:', error);
    const response = createResponse(false, 'Failed to update activity', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Delete an activity
const deleteLeadActivity = async (req, res) => {
  try {
    const { id, activityId } = req.params;

    // Check if activity exists
    const checkActivitySql = `
      SELECT id FROM lead_activities 
      WHERE id = ? AND lead_id = ?
    `;
    const existingActivity = await query(checkActivitySql, [activityId, id]);
    
    if (existingActivity.length === 0) {
      const response = createResponse(false, 'Activity not found', null, 'ACTIVITY_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Delete the activity
    const deleteSql = `
      DELETE FROM lead_activities 
      WHERE id = ? AND lead_id = ?
    `;
    await query(deleteSql, [activityId, id]);

    const response = createResponse(true, 'Activity deleted successfully', {
      activity_id: activityId,
      lead_id: id
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error deleting lead activity:', error);
    const response = createResponse(false, 'Failed to delete activity', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get a specific activity by ID
const getLeadActivityById = async (req, res) => {
  try {
    const { id, activityId } = req.params;

    const activitySql = `
      SELECT 
        id, activity_type, subject, description, activity_date, duration_minutes,
        outcome, next_action, next_action_date, scheduled_follow_up, 
        employee_id, is_completed, completed_at, notes, created_at
      FROM lead_activities 
      WHERE id = ? AND lead_id = ?
    `;
    
    const activities = await query(activitySql, [activityId, id]);
    
    if (activities.length === 0) {
      const response = createResponse(false, 'Activity not found', null, 'ACTIVITY_NOT_FOUND');
      return res.status(404).json(response);
    }

    const activity = activities[0];

    const response = createResponse(true, 'Activity retrieved successfully', {
      activity: {
        id: activity.id,
        type: activity.activity_type,
        subject: activity.subject,
        description: activity.description,
        activity_date: activity.activity_date,
        duration_minutes: activity.duration_minutes,
        outcome: activity.outcome,
        next_action: activity.next_action,
        next_action_date: activity.next_action_date,
        scheduled_follow_up: activity.scheduled_follow_up,
        employee_id: activity.employee_id,
        is_completed: activity.is_completed,
        completed_at: activity.completed_at,
        notes: activity.notes,
        created: activity.created_at
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting lead activity:', error);
    const response = createResponse(false, 'Failed to retrieve activity', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Complete an activity
const completeLeadActivity = async (req, res) => {
  try {
    const { id, activityId } = req.params;
    const { outcome, notes } = req.body;

    // Check if activity exists
    const checkActivitySql = `
      SELECT id FROM lead_activities 
      WHERE id = ? AND lead_id = ?
    `;
    const existingActivity = await query(checkActivitySql, [activityId, id]);
    
    if (existingActivity.length === 0) {
      const response = createResponse(false, 'Activity not found', null, 'ACTIVITY_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Update activity as completed
    const completeSql = `
      UPDATE lead_activities 
      SET is_completed = TRUE, completed_at = CURRENT_TIMESTAMP,
          outcome = ?, notes = ?
      WHERE id = ? AND lead_id = ?
    `;
    
    await query(completeSql, [outcome || 'neutral', notes || null, activityId, id]);

    const response = createResponse(true, 'Activity completed successfully', {
      activity_id: activityId,
      lead_id: id,
      is_completed: true,
      completed_at: new Date().toISOString()
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error completing lead activity:', error);
    const response = createResponse(false, 'Failed to complete activity', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

module.exports = {
  getLeadActivities,
  addLeadActivity,
  updateLeadActivity,
  deleteLeadActivity,
  getLeadActivityById,
  completeLeadActivity
};
