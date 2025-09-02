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

// Get all notes for a specific lead
const getLeadNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { note_type, created_by, date_from, date_to } = req.query;

    let whereClause = 'WHERE lead_id = ?';
    const params = [id];

    if (note_type) {
      whereClause += ' AND note_type = ?';
      params.push(note_type);
    }

    if (created_by) {
      whereClause += ' AND created_by = ?';
      params.push(created_by);
    }

    if (date_from) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(date_to);
    }

    const notesSql = `
      SELECT 
        id, note_type, title, content, is_internal, is_important, priority,
        due_date, is_completed, completed_at, completed_by, created_at, updated_at
      FROM lead_notes 
      ${whereClause}
      ORDER BY created_at DESC
    `;
    
    const notes = await query(notesSql, params);

    const response = createResponse(true, 'Lead notes retrieved successfully', {
      lead_id: id,
      notes: notes.map(note => ({
        id: note.id,
        type: note.note_type,
        title: note.title,
        content: note.content,
        is_internal: note.is_internal,
        is_important: note.is_important,
        priority: note.priority,
        due_date: note.due_date,
        is_completed: note.is_completed,
        completed_at: note.completed_at,
        completed_by: note.completed_by,
        created: note.created_at,
        updated: note.updated_at
      }))
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting lead notes:', error);
    const response = createResponse(false, 'Failed to retrieve lead notes', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Add a new note to a lead
const addLeadNote = async (req, res) => {
  try {
    const { id } = req.params;
    const noteData = req.body;
    const noteId = uuidv4();

    // Check if lead exists
    const checkLeadSql = 'SELECT id FROM leads WHERE id = ? AND status != "deleted"';
    const existingLead = await query(checkLeadSql, [id]);
    
    if (existingLead.length === 0) {
      const response = createResponse(false, 'Lead not found', null, 'LEAD_NOT_FOUND');
      return res.status(404).json(response);
    }

    const noteSql = `
      INSERT INTO lead_notes (
        id, lead_id, note_type, title, content, is_internal, is_important,
        priority, due_date, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await query(noteSql, [
      noteId,
      id,
      noteData.type || 'general',
      noteData.title,
      noteData.content,
      noteData.is_internal || false,
      noteData.is_important || false,
      noteData.priority || 'medium',
      noteData.due_date || null,
      req.user?.id || null
    ]);

    const response = createResponse(true, 'Note added successfully', {
      note_id: noteId,
      lead_id: id,
      type: noteData.type || 'general',
      title: noteData.title
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('Error adding lead note:', error);
    const response = createResponse(false, 'Failed to add note', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Update an existing note
const updateLeadNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const updateData = req.body;

    // Check if note exists
    const checkNoteSql = `
      SELECT id FROM lead_notes 
      WHERE id = ? AND lead_id = ?
    `;
    const existingNote = await query(checkNoteSql, [noteId, id]);
    
    if (existingNote.length === 0) {
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
    
    const updateSql = `
      UPDATE lead_notes 
      SET ${updateFields.join(', ')} 
      WHERE id = ? AND lead_id = ?
    `;
    updateParams.push(noteId, id);

    await query(updateSql, updateParams);

    const response = createResponse(true, 'Note updated successfully', {
      note_id: noteId,
      lead_id: id,
      updated_fields: Object.keys(updateData)
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating lead note:', error);
    const response = createResponse(false, 'Failed to update note', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Delete a note
const deleteLeadNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;

    // Check if note exists
    const checkNoteSql = `
      SELECT id FROM lead_notes 
      WHERE id = ? AND lead_id = ?
    `;
    const existingNote = await query(checkNoteSql, [noteId, id]);
    
    if (existingNote.length === 0) {
      const response = createResponse(false, 'Note not found', null, 'NOTE_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Delete the note
    const deleteSql = `
      DELETE FROM lead_notes 
      WHERE id = ? AND lead_id = ?
    `;
    await query(deleteSql, [noteId, id]);

    const response = createResponse(true, 'Note deleted successfully', {
      note_id: noteId,
      lead_id: id
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error deleting lead note:', error);
    const response = createResponse(false, 'Failed to delete note', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get a specific note by ID
const getLeadNoteById = async (req, res) => {
  try {
    const { id, noteId } = req.params;

    const noteSql = `
      SELECT 
        id, note_type, title, content, is_internal, is_important, priority,
        due_date, is_completed, completed_at, completed_by, created_at, updated_at
      FROM lead_notes 
      WHERE id = ? AND lead_id = ?
    `;
    
    const notes = await query(noteSql, [noteId, id]);
    
    if (notes.length === 0) {
      const response = createResponse(false, 'Note not found', null, 'NOTE_NOT_FOUND');
      return res.status(404).json(response);
    }

    const note = notes[0];

    const response = createResponse(true, 'Note retrieved successfully', {
      note: {
        id: note.id,
        type: note.note_type,
        title: note.title,
        content: note.content,
        is_internal: note.is_internal,
        is_important: note.is_important,
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
    console.error('Error getting lead note:', error);
    const response = createResponse(false, 'Failed to retrieve note', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Complete a note
const completeLeadNote = async (req, res) => {
  try {
    const { id, noteId } = req.params;
    const { notes } = req.body;

    // Check if note exists
    const checkNoteSql = `
      SELECT id FROM lead_notes 
      WHERE id = ? AND lead_id = ?
    `;
    const existingNote = await query(checkNoteSql, [noteId, id]);
    
    if (existingNote.length === 0) {
      const response = createResponse(false, 'Note not found', null, 'NOTE_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Update note as completed
    const completeSql = `
      UPDATE lead_notes 
      SET is_completed = TRUE, completed_at = CURRENT_TIMESTAMP,
          completed_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND lead_id = ?
    `;
    
    await query(completeSql, [req.user?.id || null, noteId, id]);

    const response = createResponse(true, 'Note completed successfully', {
      note_id: noteId,
      lead_id: id,
      is_completed: true,
      completed_at: new Date().toISOString()
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error completing lead note:', error);
    const response = createResponse(false, 'Failed to complete note', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

module.exports = {
  getLeadNotes,
  addLeadNote,
  updateLeadNote,
  deleteLeadNote,
  getLeadNoteById,
  completeLeadNote
};
