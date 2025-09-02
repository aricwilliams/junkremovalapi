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

// 13. Get Customer Tags
const getCustomerTags = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Get all tags assigned to the customer
    const tagsSql = `
      SELECT 
        ct.id, ct.name, ct.color, ct.description,
        cta.assigned_at
      FROM customer_tag_assignments cta
      JOIN customer_tags ct ON cta.tag_id = ct.id
      WHERE cta.customer_id = ? AND ct.is_active = TRUE
      ORDER BY cta.assigned_at DESC
    `;
    
    const tags = await query(tagsSql, [id]);

    const response = createResponse(true, 'Customer tags retrieved successfully', {
      customer_id: id,
      tags: tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        description: tag.description,
        assigned_date: tag.assigned_at
      }))
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting customer tags:', error);
    const response = createResponse(false, 'Failed to retrieve customer tags', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// 14. Assign Tag to Customer
const assignTagToCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_id, notes } = req.body;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if tag exists and is active
    const tagCheckSql = 'SELECT id, name FROM customer_tags WHERE id = ? AND is_active = TRUE';
    const tagExists = await query(tagCheckSql, [tag_id]);
    
    if (tagExists.length === 0) {
      const response = createResponse(false, 'Tag not found or inactive', null, 'TAG_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if tag is already assigned to this customer
    const existingAssignmentSql = `
      SELECT id FROM customer_tag_assignments 
      WHERE customer_id = ? AND tag_id = ?
    `;
    const existingAssignment = await query(existingAssignmentSql, [id, tag_id]);
    
    if (existingAssignment.length > 0) {
      const response = createResponse(false, 'Tag is already assigned to this customer', null, 'TAG_ALREADY_ASSIGNED');
      return res.status(409).json(response);
    }

    // Assign the tag
    const assignmentId = uuidv4();
    const assignSql = `
      INSERT INTO customer_tag_assignments (
        id, customer_id, tag_id, assigned_by
      ) VALUES (?, ?, ?, ?)
    `;

    await query(assignSql, [
      assignmentId,
      id,
      tag_id,
      req.user ? req.user.id : null
    ]);

    const response = createResponse(true, 'Tag assigned successfully', {
      customer_id: id,
      tag_id: tag_id,
      tag_name: tagExists[0].name
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('Error assigning tag to customer:', error);
    const response = createResponse(false, 'Failed to assign tag to customer', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// 15. Remove Tag from Customer
const removeTagFromCustomer = async (req, res) => {
  try {
    const { id, tagId } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if tag assignment exists
    const assignmentCheckSql = `
      SELECT id FROM customer_tag_assignments 
      WHERE customer_id = ? AND tag_id = ?
    `;
    const assignmentExists = await query(assignmentCheckSql, [id, tagId]);
    
    if (assignmentExists.length === 0) {
      const response = createResponse(false, 'Tag is not assigned to this customer', null, 'TAG_NOT_ASSIGNED');
      return res.status(404).json(response);
    }

    // Remove the tag assignment
    const removeSql = `
      DELETE FROM customer_tag_assignments 
      WHERE customer_id = ? AND tag_id = ?
    `;
    await query(removeSql, [id, tagId]);

    const response = createResponse(true, 'Tag removed successfully', {
      customer_id: id,
      tag_id: tagId
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error removing tag from customer:', error);
    const response = createResponse(false, 'Failed to remove tag from customer', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get all available tags (for tag selection)
const getAllTags = async (req, res) => {
  try {
    const tagsSql = `
      SELECT id, name, color, description, created_at
      FROM customer_tags 
      WHERE is_active = TRUE
      ORDER BY name ASC
    `;
    
    const tags = await query(tagsSql);

    const response = createResponse(true, 'Tags retrieved successfully', {
      tags: tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        description: tag.description,
        created: tag.created_at
      }))
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting tags:', error);
    const response = createResponse(false, 'Failed to retrieve tags', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Create a new tag (admin function)
const createTag = async (req, res) => {
  try {
    const { name, color, description } = req.body;

    // Check if tag name already exists
    const existingTagSql = 'SELECT id FROM customer_tags WHERE name = ?';
    const existingTag = await query(existingTagSql, [name]);
    
    if (existingTag.length > 0) {
      const response = createResponse(false, 'Tag with this name already exists', null, 'DUPLICATE_TAG_NAME');
      return res.status(409).json(response);
    }

    const tagId = uuidv4();
    const insertSql = `
      INSERT INTO customer_tags (id, name, color, description)
      VALUES (?, ?, ?, ?)
    `;

    await query(insertSql, [
      tagId,
      name,
      color || '#3B82F6',
      description || null
    ]);

    const response = createResponse(true, 'Tag created successfully', {
      tag_id: tagId,
      tag: {
        id: tagId,
        name,
        color: color || '#3B82F6',
        description: description || null
      }
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('Error creating tag:', error);
    const response = createResponse(false, 'Failed to create tag', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Update a tag (admin function)
const updateTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const updateData = req.body;

    // Check if tag exists
    const tagCheckSql = 'SELECT id FROM customer_tags WHERE id = ?';
    const tagExists = await query(tagCheckSql, [tagId]);
    
    if (tagExists.length === 0) {
      const response = createResponse(false, 'Tag not found', null, 'TAG_NOT_FOUND');
      return res.status(404).json(response);
    }

    // If updating name, check for duplicates
    if (updateData.name) {
      const duplicateCheckSql = 'SELECT id FROM customer_tags WHERE name = ? AND id != ?';
      const duplicateTag = await query(duplicateCheckSql, [updateData.name, tagId]);
      
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

    const updateSql = `UPDATE customer_tags SET ${updateFields.join(', ')} WHERE id = ?`;
    updateParams.push(tagId);

    await query(updateSql, updateParams);

    const response = createResponse(true, 'Tag updated successfully', {
      tag_id: tagId,
      updated_fields: Object.keys(updateData)
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating tag:', error);
    const response = createResponse(false, 'Failed to update tag', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Delete a tag (admin function - soft delete)
const deleteTag = async (req, res) => {
  try {
    const { tagId } = req.params;

    // Check if tag exists
    const tagCheckSql = 'SELECT id FROM customer_tags WHERE id = ?';
    const tagExists = await query(tagCheckSql, [tagId]);
    
    if (tagExists.length === 0) {
      const response = createResponse(false, 'Tag not found', null, 'TAG_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if tag is assigned to any customers
    const assignmentCheckSql = 'SELECT id FROM customer_tag_assignments WHERE tag_id = ?';
    const assignments = await query(assignmentCheckSql, [tagId]);
    
    if (assignments.length > 0) {
      const response = createResponse(false, 'Cannot delete tag that is assigned to customers', null, 'TAG_IN_USE');
      return res.status(409).json(response);
    }

    // Soft delete - set as inactive
    const deleteSql = 'UPDATE customer_tags SET is_active = FALSE WHERE id = ?';
    await query(deleteSql, [tagId]);

    const response = createResponse(true, 'Tag deleted successfully', {
      tag_id: tagId
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error deleting tag:', error);
    const response = createResponse(false, 'Failed to delete tag', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

module.exports = {
  getCustomerTags,
  assignTagToCustomer,
  removeTagFromCustomer,
  getAllTags,
  createTag,
  updateTag,
  deleteTag
};
