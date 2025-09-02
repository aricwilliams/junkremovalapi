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

// 16. Get Customer Notes
const getCustomerNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { note_type, created_by, date_from, date_to } = req.query;

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

    if (note_type) {
      conditions.push('note_type = ?');
      params.push(note_type);
    }

    if (created_by) {
      conditions.push('created_by = ?');
      params.push(created_by);
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

    // Get customer notes
    const notesSql = `
      SELECT 
        id, note_type, title, content, created_by, is_internal,
        priority, due_date, is_completed, completed_at, completed_by,
        created_at, updated_at
      FROM customer_notes 
      WHERE ${whereClause}
      ORDER BY created_at DESC
    `;
    
    const notes = await query(notesSql, params);

    const response = createResponse(true, 'Customer notes retrieved successfully', {
      customer_id: id,
      notes: notes.map(note => ({
        id: note.id,
        type: note.note_type,
        content: note.content,
        created_by: note.created_by,
        created_by_name: note.created_by, // Could be enhanced to get actual user name
        created: note.created_at,
        is_important: note.priority === 'high' || note.priority === 'urgent'
      }))
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting customer notes:', error);
    const response = createResponse(false, 'Failed to retrieve customer notes', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// 17. Add Customer Note
const addCustomerNote = async (req, res) => {
  try {
    const { id } = req.params;
    const noteData = req.body;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    const noteId = uuidv4();
    const insertSql = `
      INSERT INTO customer_notes (
        id, customer_id, note_type, title, content, created_by,
        is_internal, priority, due_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(insertSql, [
      noteId,
      id,
      noteData.type || 'general',
      noteData.title,
      noteData.content,
      req.user ? req.user.id : null,
      noteData.is_internal || false,
      noteData.priority || 'medium',
      noteData.due_date || null
    ]);

    const response = createResponse(true, 'Note added successfully', {
      note_id: noteId,
      customer_id: id,
      type: noteData.type || 'general'
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('Error adding customer note:', error);
    const response = createResponse(false, 'Failed to add customer note', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Update Customer Note
const updateCustomerNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const updateData = req.body;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if note exists
    const noteCheckSql = 'SELECT id FROM customer_notes WHERE id = ? AND customer_id = ?';
    const noteExists = await query(noteCheckSql, [noteId, id]);
    
    if (noteExists.length === 0) {
      const response = createResponse(false, 'Note not found', null, 'NOTE_NOT_FOUND');
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
    
    const updateSql = `UPDATE customer_notes SET ${updateFields.join(', ')} WHERE id = ? AND customer_id = ?`;
    updateParams.push(noteId, id);

    await query(updateSql, updateParams);

    const response = createResponse(true, 'Note updated successfully', {
      note_id: noteId,
      updated_fields: Object.keys(updateData)
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating customer note:', error);
    const response = createResponse(false, 'Failed to update customer note', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Delete Customer Note
const deleteCustomerNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if note exists
    const noteCheckSql = 'SELECT id FROM customer_notes WHERE id = ? AND customer_id = ?';
    const noteExists = await query(noteCheckSql, [noteId, id]);
    
    if (noteExists.length === 0) {
      const response = createResponse(false, 'Note not found', null, 'NOTE_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Delete the note
    const deleteSql = 'DELETE FROM customer_notes WHERE id = ? AND customer_id = ?';
    await query(deleteSql, [noteId, id]);

    const response = createResponse(true, 'Note deleted successfully', {
      note_id: noteId,
      customer_id: id
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error deleting customer note:', error);
    const response = createResponse(false, 'Failed to delete customer note', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get a specific note by ID
const getCustomerNoteById = async (req, res) => {
  try {
    const { id, noteId } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Get the specific note
    const noteSql = `
      SELECT 
        id, note_type, title, content, created_by, is_internal,
        priority, due_date, is_completed, completed_at, completed_by,
        created_at, updated_at
      FROM customer_notes 
      WHERE id = ? AND customer_id = ?
    `;
    
    const notes = await query(noteSql, [noteId, id]);
    
    if (notes.length === 0) {
      const response = createResponse(false, 'Note not found', null, 'NOTE_NOT_FOUND');
      return res.status(404).json(response);
    }

    const note = notes[0];

    const response = createResponse(true, 'Customer note retrieved successfully', {
      customer_id: id,
      note: {
        id: note.id,
        type: note.note_type,
        title: note.title,
        content: note.content,
        created_by: note.created_by,
        is_internal: note.is_internal,
        priority: note.priority,
        due_date: note.due_date,
        is_completed: note.is_completed,
        completed_at: note.completed_at,
        completed_by: note.completed_by,
        created: note.created_at,
        updated: note.updated_at
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting customer note:', error);
    const response = createResponse(false, 'Failed to retrieve customer note', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Mark note as completed
const completeCustomerNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if note exists
    const noteCheckSql = 'SELECT id FROM customer_notes WHERE id = ? AND customer_id = ?';
    const noteExists = await query(noteCheckSql, [noteId, id]);
    
    if (noteExists.length === 0) {
      const response = createResponse(false, 'Note not found', null, 'NOTE_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Mark note as completed
    const completeSql = `
      UPDATE customer_notes 
      SET is_completed = TRUE, completed_at = CURRENT_TIMESTAMP, completed_by = ?
      WHERE id = ? AND customer_id = ?
    `;
    
    await query(completeSql, [req.user ? req.user.id : null, noteId, id]);

    const response = createResponse(true, 'Note marked as completed', {
      note_id: noteId,
      customer_id: id,
      completed_at: new Date().toISOString()
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error completing customer note:', error);
    const response = createResponse(false, 'Failed to complete customer note', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

module.exports = {
  getCustomerNotes,
  addCustomerNote,
  updateCustomerNote,
  deleteCustomerNote,
  getCustomerNoteById,
  completeCustomerNote
};
