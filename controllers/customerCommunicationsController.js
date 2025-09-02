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

// 18. Get Customer Communications
const getCustomerCommunications = async (req, res) => {
  try {
    const { id } = req.params;
    const { communication_type, direction, date_from, date_to } = req.query;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Build WHERE clause for filtering
    const conditions = ['customer_id = ?'];
    const params = [id];

    if (communication_type) {
      conditions.push('communication_type = ?');
      params.push(communication_type);
    }

    if (direction) {
      conditions.push('direction = ?');
      params.push(direction);
    }

    if (date_from) {
      conditions.push('DATE(created_at) >= ?');
      params.push(date_from);
    }

    if (date_to) {
      conditions.push('DATE(created_at) <= ?');
      params.push(date_to);
    }

    const whereClause = conditions.join(' AND ');

    // Get customer communications
    const communicationsSql = `
      SELECT 
        id, communication_type, direction, subject, content,
        duration_seconds, contact_person_id, employee_id, status,
        scheduled_at, completed_at, follow_up_required, follow_up_date,
        follow_up_notes, created_at
      FROM customer_communications 
      WHERE ${whereClause}
      ORDER BY created_at DESC
    `;
    
    const communications = await query(communicationsSql, params);

    const response = createResponse(true, 'Customer communications retrieved successfully', {
      customer_id: id,
      communications: communications.map(comm => ({
        id: comm.id,
        type: comm.communication_type,
        direction: comm.direction,
        subject: comm.subject,
        content: comm.content,
        sent_at: comm.completed_at || comm.created_at,
        status: comm.status,
        recipient: comm.contact_person_id // Could be enhanced to get actual contact info
      }))
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting customer communications:', error);
    const response = createResponse(false, 'Failed to retrieve customer communications', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// 19. Log Customer Communication
const logCustomerCommunication = async (req, res) => {
  try {
    const { id } = req.params;
    const communicationData = req.body;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    const communicationId = uuidv4();
    const insertSql = `
      INSERT INTO customer_communications (
        id, customer_id, communication_type, direction, subject, content,
        duration_seconds, contact_person_id, employee_id, status,
        scheduled_at, follow_up_required, follow_up_date, follow_up_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(insertSql, [
      communicationId,
      id,
      communicationData.type,
      communicationData.direction,
      communicationData.subject || null,
      communicationData.content || null,
      communicationData.duration_minutes ? communicationData.duration_minutes * 60 : null,
      communicationData.contact_person_id || null,
      req.user ? req.user.id : null,
      communicationData.status || 'completed',
      communicationData.scheduled_at || null,
      communicationData.follow_up_required || false,
      communicationData.follow_up_date || null,
      communicationData.notes || null
    ]);

    const response = createResponse(true, 'Communication logged successfully', {
      communication_id: communicationId,
      customer_id: id,
      type: communicationData.type,
      direction: communicationData.direction
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('Error logging customer communication:', error);
    const response = createResponse(false, 'Failed to log customer communication', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Update Customer Communication
const updateCustomerCommunication = async (req, res) => {
  try {
    const { id, communicationId } = req.params;
    const updateData = req.body;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if communication exists
    const communicationCheckSql = 'SELECT id FROM customer_communications WHERE id = ? AND customer_id = ?';
    const communicationExists = await query(communicationCheckSql, [communicationId, id]);
    
    if (communicationExists.length === 0) {
      const response = createResponse(false, 'Communication not found', null, 'COMMUNICATION_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Build update query dynamically
    const updateFields = [];
    const updateParams = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        // Convert duration_minutes to duration_seconds if provided
        if (key === 'duration_minutes') {
          updateFields.push('duration_seconds = ?');
          updateParams.push(updateData[key] * 60);
        } else {
          updateFields.push(`${key} = ?`);
          updateParams.push(updateData[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      const response = createResponse(false, 'No fields to update', null, 'NO_FIELDS_TO_UPDATE');
      return res.status(400).json(response);
    }

    const updateSql = `UPDATE customer_communications SET ${updateFields.join(', ')} WHERE id = ? AND customer_id = ?`;
    updateParams.push(communicationId, id);

    await query(updateSql, updateParams);

    const response = createResponse(true, 'Communication updated successfully', {
      communication_id: communicationId,
      updated_fields: Object.keys(updateData)
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating customer communication:', error);
    const response = createResponse(false, 'Failed to update customer communication', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Delete Customer Communication
const deleteCustomerCommunication = async (req, res) => {
  try {
    const { id, communicationId } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if communication exists
    const communicationCheckSql = 'SELECT id FROM customer_communications WHERE id = ? AND customer_id = ?';
    const communicationExists = await query(communicationCheckSql, [communicationId, id]);
    
    if (communicationExists.length === 0) {
      const response = createResponse(false, 'Communication not found', null, 'COMMUNICATION_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Delete the communication
    const deleteSql = 'DELETE FROM customer_communications WHERE id = ? AND customer_id = ?';
    await query(deleteSql, [communicationId, id]);

    const response = createResponse(true, 'Communication deleted successfully', {
      communication_id: communicationId,
      customer_id: id
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error deleting customer communication:', error);
    const response = createResponse(false, 'Failed to delete customer communication', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get a specific communication by ID
const getCustomerCommunicationById = async (req, res) => {
  try {
    const { id, communicationId } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Get the specific communication
    const communicationSql = `
      SELECT 
        id, communication_type, direction, subject, content,
        duration_seconds, contact_person_id, employee_id, status,
        scheduled_at, completed_at, follow_up_required, follow_up_date,
        follow_up_notes, created_at
      FROM customer_communications 
      WHERE id = ? AND customer_id = ?
    `;
    
    const communications = await query(communicationSql, [communicationId, id]);
    
    if (communications.length === 0) {
      const response = createResponse(false, 'Communication not found', null, 'COMMUNICATION_NOT_FOUND');
      return res.status(404).json(response);
    }

    const communication = communications[0];

    const response = createResponse(true, 'Customer communication retrieved successfully', {
      customer_id: id,
      communication: {
        id: communication.id,
        type: communication.communication_type,
        direction: communication.direction,
        subject: communication.subject,
        content: communication.content,
        duration_minutes: communication.duration_seconds ? Math.round(communication.duration_seconds / 60) : null,
        contact_person_id: communication.contact_person_id,
        employee_id: communication.employee_id,
        status: communication.status,
        scheduled_at: communication.scheduled_at,
        completed_at: communication.completed_at,
        follow_up_required: communication.follow_up_required,
        follow_up_date: communication.follow_up_date,
        follow_up_notes: communication.follow_up_notes,
        created: communication.created_at
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting customer communication:', error);
    const response = createResponse(false, 'Failed to retrieve customer communication', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Mark communication as completed
const completeCustomerCommunication = async (req, res) => {
  try {
    const { id, communicationId } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if communication exists
    const communicationCheckSql = 'SELECT id FROM customer_communications WHERE id = ? AND customer_id = ?';
    const communicationExists = await query(communicationCheckSql, [communicationId, id]);
    
    if (communicationExists.length === 0) {
      const response = createResponse(false, 'Communication not found', null, 'COMMUNICATION_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Mark communication as completed
    const completeSql = `
      UPDATE customer_communications 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ? AND customer_id = ?
    `;
    
    await query(completeSql, [communicationId, id]);

    const response = createResponse(true, 'Communication marked as completed', {
      communication_id: communicationId,
      customer_id: id,
      completed_at: new Date().toISOString()
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error completing customer communication:', error);
    const response = createResponse(false, 'Failed to complete customer communication', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

module.exports = {
  getCustomerCommunications,
  logCustomerCommunication,
  updateCustomerCommunication,
  deleteCustomerCommunication,
  getCustomerCommunicationById,
  completeCustomerCommunication
};
