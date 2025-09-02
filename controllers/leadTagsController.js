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

// Get all available lead tags
const getAllTags = async (req, res) => {
  try {
    const tagsSql = `
      SELECT id, name, color, description, is_active, created_at
      FROM lead_tags 
      ORDER BY name ASC
    `;
    
    const tags = await query(tagsSql);

    const response = createResponse(true, 'Lead tags retrieved successfully', {
      tags: tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        description: tag.description,
        is_active: tag.is_active,
        created: tag.created_at
      }))
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting lead tags:', error);
    const response = createResponse(false, 'Failed to retrieve lead tags', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Create a new lead tag
const createTag = async (req, res) => {
  try {
    const tagData = req.body;
    const tagId = uuidv4();

    // Check if tag name already exists
    const checkTagSql = 'SELECT id FROM lead_tags WHERE name = ?';
    const existingTag = await query(checkTagSql, [tagData.name]);
    
    if (existingTag.length > 0) {
      const response = createResponse(false, 'Tag with this name already exists', null, 'DUPLICATE_TAG_NAME');
      return res.status(409).json(response);
    }

    const tagSql = `
      INSERT INTO lead_tags (id, name, color, description, is_active)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await query(tagSql, [
      tagId,
      tagData.name,
      tagData.color || '#3B82F6',
      tagData.description || null,
      tagData.is_active !== undefined ? tagData.is_active : true
    ]);

    const response = createResponse(true, 'Tag created successfully', {
      tag_id: tagId,
      name: tagData.name,
      color: tagData.color || '#3B82F6',
      is_active: tagData.is_active !== undefined ? tagData.is_active : true
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('Error creating lead tag:', error);
    const response = createResponse(false, 'Failed to create tag', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Update an existing tag
const updateTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const updateData = req.body;

    // Check if tag exists
    const checkTagSql = 'SELECT id FROM lead_tags WHERE id = ?';
    const existingTag = await query(checkTagSql, [tagId]);
    
    if (existingTag.length === 0) {
      const response = createResponse(false, 'Tag not found', null, 'TAG_NOT_FOUND');
      return res.status(404).json(response);
    }

    // If updating name, check for duplicates
    if (updateData.name) {
      const checkDuplicateSql = 'SELECT id FROM lead_tags WHERE name = ? AND id != ?';
      const duplicateTag = await query(checkDuplicateSql, [updateData.name, tagId]);
      
      if (duplicateTag.length > 0) {
        const response = createResponse(false, 'Tag with this name already exists', null, 'DUPLICATE_TAG_NAME');
        return res.status(409).json(response);
      }
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

    const updateSql = `UPDATE lead_tags SET ${updateFields.join(', ')} WHERE id = ?`;
    updateParams.push(tagId);

    await query(updateSql, updateParams);

    const response = createResponse(true, 'Tag updated successfully', {
      tag_id: tagId,
      updated_fields: Object.keys(updateData)
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating lead tag:', error);
    const response = createResponse(false, 'Failed to update tag', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Delete a tag
const deleteTag = async (req, res) => {
  try {
    const { tagId } = req.params;

    // Check if tag exists
    const checkTagSql = 'SELECT id FROM lead_tags WHERE id = ?';
    const existingTag = await query(checkTagSql, [tagId]);
    
    if (existingTag.length === 0) {
      const response = createResponse(false, 'Tag not found', null, 'TAG_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if tag is assigned to any leads
    const checkUsageSql = 'SELECT id FROM lead_tag_assignments WHERE tag_id = ? LIMIT 1';
    const tagUsage = await query(checkUsageSql, [tagId]);
    
    if (tagUsage.length > 0) {
      const response = createResponse(false, 'Cannot delete tag that is assigned to leads', null, 'TAG_IN_USE');
      return res.status(409).json(response);
    }

    // Delete the tag
    const deleteSql = 'DELETE FROM lead_tags WHERE id = ?';
    await query(deleteSql, [tagId]);

    const response = createResponse(true, 'Tag deleted successfully', {
      tag_id: tagId
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error deleting lead tag:', error);
    const response = createResponse(false, 'Failed to delete tag', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get tags for a specific lead
const getLeadTags = async (req, res) => {
  try {
    const { id } = req.params;

    const tagsSql = `
      SELECT 
        lt.id, lt.name, lt.color, lt.description,
        lta.assigned_at, lta.assigned_by
      FROM lead_tag_assignments lta
      JOIN lead_tags lt ON lta.tag_id = lt.id
      WHERE lta.lead_id = ? AND lt.is_active = TRUE
      ORDER BY lta.assigned_at DESC
    `;
    
    const tags = await query(tagsSql, [id]);

    const response = createResponse(true, 'Lead tags retrieved successfully', {
      lead_id: id,
      tags: tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        description: tag.description,
        assigned_at: tag.assigned_at,
        assigned_by: tag.assigned_by
      }))
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting lead tags:', error);
    const response = createResponse(false, 'Failed to retrieve lead tags', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Assign a tag to a lead
const assignTagToLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_id } = req.body;

    // Check if lead exists
    const checkLeadSql = 'SELECT id FROM leads WHERE id = ? AND status != "deleted"';
    const existingLead = await query(checkLeadSql, [id]);
    
    if (existingLead.length === 0) {
      const response = createResponse(false, 'Lead not found', null, 'LEAD_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if tag exists and is active
    const checkTagSql = 'SELECT id FROM lead_tags WHERE id = ? AND is_active = TRUE';
    const existingTag = await query(checkTagSql, [tag_id]);
    
    if (existingTag.length === 0) {
      const response = createResponse(false, 'Tag not found or inactive', null, 'TAG_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if tag is already assigned
    const checkAssignmentSql = `
      SELECT id FROM lead_tag_assignments 
      WHERE lead_id = ? AND tag_id = ?
    `;
    const existingAssignment = await query(checkAssignmentSql, [id, tag_id]);
    
    if (existingAssignment.length > 0) {
      const response = createResponse(false, 'Tag is already assigned to this lead', null, 'TAG_ALREADY_ASSIGNED');
      return res.status(409).json(response);
    }

    // Assign the tag
    const assignmentId = uuidv4();
    const assignTagSql = `
      INSERT INTO lead_tag_assignments (id, lead_id, tag_id, assigned_by)
      VALUES (?, ?, ?, ?)
    `;
    
    await query(assignTagSql, [assignmentId, id, tag_id, req.user?.id || null]);

    const response = createResponse(true, 'Tag assigned successfully', {
      assignment_id: assignmentId,
      lead_id: id,
      tag_id: tag_id
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('Error assigning tag to lead:', error);
    const response = createResponse(false, 'Failed to assign tag', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Remove a tag from a lead
const removeTagFromLead = async (req, res) => {
  try {
    const { id, tagId } = req.params;

    // Check if tag assignment exists
    const checkAssignmentSql = `
      SELECT id FROM lead_tag_assignments 
      WHERE lead_id = ? AND tag_id = ?
    `;
    const existingAssignment = await query(checkAssignmentSql, [id, tagId]);
    
    if (existingAssignment.length === 0) {
      const response = createResponse(false, 'Tag assignment not found', null, 'TAG_ASSIGNMENT_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Remove the tag assignment
    const removeTagSql = `
      DELETE FROM lead_tag_assignments 
      WHERE lead_id = ? AND tag_id = ?
    `;
    await query(removeTagSql, [id, tagId]);

    const response = createResponse(true, 'Tag removed successfully', {
      lead_id: id,
      tag_id: tagId
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error removing tag from lead:', error);
    const response = createResponse(false, 'Failed to remove tag', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

module.exports = {
  getAllTags,
  createTag,
  updateTag,
  deleteTag,
  getLeadTags,
  assignTagToLead,
  removeTagFromLead
};
