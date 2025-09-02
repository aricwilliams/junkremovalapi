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

// Get all follow-up activities for a specific lead
const getLeadFollowUps = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date_from, date_to } = req.query;

    let whereClause = 'WHERE lead_id = ?';
    const params = [id];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (date_from) {
      whereClause += ' AND DATE(scheduled_date) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(scheduled_date) <= ?';
      params.push(date_to);
    }

    const followUpsSql = `
      SELECT 
        id, follow_up_type, subject, description, scheduled_date, scheduled_time,
        priority, assigned_to, status, completed_at, outcome, next_follow_up_date,
        created_at, updated_at
      FROM lead_follow_ups 
      ${whereClause}
      ORDER BY scheduled_date ASC
    `;
    
    const followUps = await query(followUpsSql, params);

    const response = createResponse(true, 'Lead follow-ups retrieved successfully', {
      lead_id: id,
      follow_ups: followUps.map(followUp => ({
        id: followUp.id,
        type: followUp.follow_up_type,
        subject: followUp.subject,
        description: followUp.description,
        scheduled_date: followUp.scheduled_date,
        scheduled_time: followUp.scheduled_time,
        priority: followUp.priority,
        assigned_to: followUp.assigned_to,
        status: followUp.status,
        completed_at: followUp.completed_at,
        outcome: followUp.outcome,
        next_follow_up_date: followUp.next_follow_up_date,
        created: followUp.created_at,
        updated: followUp.updated_at
      }))
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting lead follow-ups:', error);
    const response = createResponse(false, 'Failed to retrieve lead follow-ups', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Schedule a new follow-up for a lead
const scheduleLeadFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const followUpData = req.body;
    const followUpId = uuidv4();

    // Check if lead exists
    const checkLeadSql = 'SELECT id FROM leads WHERE id = ? AND status != "deleted"';
    const existingLead = await query(checkLeadSql, [id]);
    
    if (existingLead.length === 0) {
      const response = createResponse(false, 'Lead not found', null, 'LEAD_NOT_FOUND');
      return res.status(404).json(response);
    }

    const followUpSql = `
      INSERT INTO lead_follow_ups (
        id, lead_id, follow_up_type, subject, description, scheduled_date,
        scheduled_time, priority, assigned_to, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await query(followUpSql, [
      followUpId,
      id,
      followUpData.type,
      followUpData.subject,
      followUpData.description || null,
      followUpData.scheduled_date,
      followUpData.scheduled_time || null,
      followUpData.priority || 'medium',
      followUpData.assigned_to || null,
      followUpData.notes || null
    ]);

    // Update lead's next_follow_up_date if this is the earliest scheduled follow-up
    const updateLeadSql = `
      UPDATE leads 
      SET next_follow_up_date = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND (next_follow_up_date IS NULL OR next_follow_up_date > ?)
    `;
    await query(updateLeadSql, [followUpData.scheduled_date, id, followUpData.scheduled_date]);

    const response = createResponse(true, 'Follow-up scheduled successfully', {
      followup_id: followUpId,
      lead_id: id,
      type: followUpData.type,
      scheduled_date: followUpData.scheduled_date
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('Error scheduling lead follow-up:', error);
    const response = createResponse(false, 'Failed to schedule follow-up', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Update a follow-up
const updateLeadFollowUp = async (req, res) => {
  try {
    const { id, followupId } = req.params;
    const updateData = req.body;

    // Check if follow-up exists
    const checkFollowUpSql = `
      SELECT id FROM lead_follow_ups 
      WHERE id = ? AND lead_id = ?
    `;
    const existingFollowUp = await query(checkFollowUpSql, [followupId, id]);
    
    if (existingFollowUp.length === 0) {
      const response = createResponse(false, 'Follow-up not found', null, 'FOLLOWUP_NOT_FOUND');
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

    // Add updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    
    const updateSql = `
      UPDATE lead_follow_ups 
      SET ${updateFields.join(', ')} 
      WHERE id = ? AND lead_id = ?
    `;
    updateParams.push(followupId, id);

    await query(updateSql, updateParams);

    const response = createResponse(true, 'Follow-up updated successfully', {
      followup_id: followupId,
      lead_id: id,
      updated_fields: Object.keys(updateData)
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating lead follow-up:', error);
    const response = createResponse(false, 'Failed to update follow-up', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Complete a follow-up
const completeLeadFollowUp = async (req, res) => {
  try {
    const { id, followupId } = req.params;
    const { status, completion_notes, outcome, next_action } = req.body;

    // Check if follow-up exists
    const checkFollowUpSql = `
      SELECT id FROM lead_follow_ups 
      WHERE id = ? AND lead_id = ?
    `;
    const existingFollowUp = await query(checkFollowUpSql, [followupId, id]);
    
    if (existingFollowUp.length === 0) {
      const response = createResponse(false, 'Follow-up not found', null, 'FOLLOWUP_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Update follow-up as completed
    const completeSql = `
      UPDATE lead_follow_ups 
      SET status = ?, completed_at = CURRENT_TIMESTAMP,
          outcome = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND lead_id = ?
    `;
    
    await query(completeSql, [
      status || 'completed',
      outcome || null,
      completion_notes || null,
      followupId,
      id
    ]);

    // Update lead's next_follow_up_date if this was the next scheduled follow-up
    if (next_action) {
      const updateLeadSql = `
        UPDATE leads 
        SET next_follow_up_date = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      await query(updateLeadSql, [next_action, id]);
    }

    const response = createResponse(true, 'Follow-up completed successfully', {
      followup_id: followupId,
      status: status || 'completed',
      completion_notes: completion_notes
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error completing lead follow-up:', error);
    const response = createResponse(false, 'Failed to complete follow-up', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Delete a follow-up
const deleteLeadFollowUp = async (req, res) => {
  try {
    const { id, followupId } = req.params;

    // Check if follow-up exists
    const checkFollowUpSql = `
      SELECT id FROM lead_follow_ups 
      WHERE id = ? AND lead_id = ?
    `;
    const existingFollowUp = await query(checkFollowUpSql, [followupId, id]);
    
    if (existingFollowUp.length === 0) {
      const response = createResponse(false, 'Follow-up not found', null, 'FOLLOWUP_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Delete the follow-up
    const deleteSql = `
      DELETE FROM lead_follow_ups 
      WHERE id = ? AND lead_id = ?
    `;
    await query(deleteSql, [followupId, id]);

    const response = createResponse(true, 'Follow-up deleted successfully', {
      followup_id: followupId,
      lead_id: id
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error deleting lead follow-up:', error);
    const response = createResponse(false, 'Failed to delete follow-up', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get a specific follow-up by ID
const getLeadFollowUpById = async (req, res) => {
  try {
    const { id, followupId } = req.params;

    const followUpSql = `
      SELECT 
        id, follow_up_type, subject, description, scheduled_date, scheduled_time,
        priority, assigned_to, status, completed_at, outcome, next_follow_up_date,
        created_at, updated_at
      FROM lead_follow_ups 
      WHERE id = ? AND lead_id = ?
    `;
    
    const followUps = await query(followUpSql, [followupId, id]);
    
    if (followUps.length === 0) {
      const response = createResponse(false, 'Follow-up not found', null, 'FOLLOWUP_NOT_FOUND');
      return res.status(404).json(response);
    }

    const followUp = followUps[0];

    const response = createResponse(true, 'Follow-up retrieved successfully', {
      follow_up: {
        id: followUp.id,
        type: followUp.follow_up_type,
        subject: followUp.subject,
        description: followUp.description,
        scheduled_date: followUp.scheduled_date,
        scheduled_time: followUp.scheduled_time,
        priority: followUp.priority,
        assigned_to: followUp.assigned_to,
        status: followUp.status,
        completed_at: followUp.completed_at,
        outcome: followUp.outcome,
        next_follow_up_date: followUp.next_follow_up_date,
        created: followUp.created_at,
        updated: followUp.updated_at
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting lead follow-up:', error);
    const response = createResponse(false, 'Failed to retrieve follow-up', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

module.exports = {
  getLeadFollowUps,
  scheduleLeadFollowUp,
  updateLeadFollowUp,
  completeLeadFollowUp,
  deleteLeadFollowUp,
  getLeadFollowUpById
};
