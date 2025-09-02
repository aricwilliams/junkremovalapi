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

// Get all contacts for a specific lead
const getLeadContacts = async (req, res) => {
  try {
    const { id } = req.params;

    const contactsSql = `
      SELECT 
        id, contact_type, first_name, last_name, title, email, phone, mobile,
        relationship, is_primary_contact, can_make_decisions,
        preferred_contact_method, notes, created_at, updated_at
      FROM lead_contacts 
      WHERE lead_id = ?
      ORDER BY is_primary_contact DESC, created_at ASC
    `;
    
    const contacts = await query(contactsSql, [id]);

    const response = createResponse(true, 'Lead contacts retrieved successfully', {
      lead_id: id,
      contacts: contacts.map(contact => ({
        id: contact.id,
        contact_type: contact.contact_type,
        first_name: contact.first_name,
        last_name: contact.last_name,
        name: `${contact.first_name} ${contact.last_name}`,
        title: contact.title,
        email: contact.email,
        phone: contact.phone,
        mobile: contact.mobile,
        relationship: contact.relationship,
        is_primary_contact: contact.is_primary_contact,
        can_make_decisions: contact.can_make_decisions,
        preferred_contact_method: contact.preferred_contact_method,
        notes: contact.notes,
        created: contact.created_at,
        updated: contact.updated_at
      }))
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting lead contacts:', error);
    const response = createResponse(false, 'Failed to retrieve lead contacts', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Add a new contact to a lead
const addLeadContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contactData = req.body;
    const contactId = uuidv4();

    // Check if lead exists
    const checkLeadSql = 'SELECT id FROM leads WHERE id = ? AND status != "deleted"';
    const existingLead = await query(checkLeadSql, [id]);
    
    if (existingLead.length === 0) {
      const response = createResponse(false, 'Lead not found', null, 'LEAD_NOT_FOUND');
      return res.status(404).json(response);
    }

    // If this is a primary contact, unset other primary contacts
    if (contactData.is_primary_contact) {
      const unsetPrimarySql = `
        UPDATE lead_contacts 
        SET is_primary_contact = FALSE 
        WHERE lead_id = ?
      `;
      await query(unsetPrimarySql, [id]);
    }

    const contactSql = `
      INSERT INTO lead_contacts (
        id, lead_id, contact_type, first_name, last_name, title,
        email, phone, mobile, relationship, is_primary_contact,
        can_make_decisions, preferred_contact_method, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await query(contactSql, [
      contactId,
      id,
      contactData.contact_type || 'primary',
      contactData.first_name,
      contactData.last_name,
      contactData.title || null,
      contactData.email || null,
      contactData.phone || null,
      contactData.mobile || null,
      contactData.relationship || null,
      contactData.is_primary_contact || false,
      contactData.can_make_decisions || false,
      contactData.preferred_contact_method || 'phone',
      contactData.notes || null
    ]);

    const response = createResponse(true, 'Contact added successfully', {
      contact_id: contactId,
      lead_id: id,
      contact: {
        id: contactId,
        first_name: contactData.first_name,
        last_name: contactData.last_name,
        name: `${contactData.first_name} ${contactData.last_name}`,
        contact_type: contactData.contact_type || 'primary',
        is_primary_contact: contactData.is_primary_contact || false
      }
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('Error adding lead contact:', error);
    const response = createResponse(false, 'Failed to add contact', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Update an existing contact
const updateLeadContact = async (req, res) => {
  try {
    const { id, contactId } = req.params;
    const updateData = req.body;

    // Check if contact exists
    const checkContactSql = `
      SELECT id FROM lead_contacts 
      WHERE id = ? AND lead_id = ?
    `;
    const existingContact = await query(checkContactSql, [contactId, id]);
    
    if (existingContact.length === 0) {
      const response = createResponse(false, 'Contact not found', null, 'CONTACT_NOT_FOUND');
      return res.status(404).json(response);
    }

    // If this is being set as primary contact, unset other primary contacts
    if (updateData.is_primary_contact) {
      const unsetPrimarySql = `
        UPDATE lead_contacts 
        SET is_primary_contact = FALSE 
        WHERE lead_id = ? AND id != ?
      `;
      await query(unsetPrimarySql, [id, contactId]);
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
      UPDATE lead_contacts 
      SET ${updateFields.join(', ')} 
      WHERE id = ? AND lead_id = ?
    `;
    updateParams.push(contactId, id);

    await query(updateSql, updateParams);

    const response = createResponse(true, 'Contact updated successfully', {
      contact_id: contactId,
      lead_id: id,
      updated_fields: Object.keys(updateData)
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating lead contact:', error);
    const response = createResponse(false, 'Failed to update contact', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Delete a contact from a lead
const deleteLeadContact = async (req, res) => {
  try {
    const { id, contactId } = req.params;

    // Check if contact exists
    const checkContactSql = `
      SELECT id, is_primary_contact FROM lead_contacts 
      WHERE id = ? AND lead_id = ?
    `;
    const existingContact = await query(checkContactSql, [contactId, id]);
    
    if (existingContact.length === 0) {
      const response = createResponse(false, 'Contact not found', null, 'CONTACT_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Delete the contact
    const deleteSql = `
      DELETE FROM lead_contacts 
      WHERE id = ? AND lead_id = ?
    `;
    await query(deleteSql, [contactId, id]);

    // If this was the primary contact, set another contact as primary
    if (existingContact[0].is_primary_contact) {
      const setNewPrimarySql = `
        UPDATE lead_contacts 
        SET is_primary_contact = TRUE 
        WHERE lead_id = ? 
        ORDER BY created_at ASC 
        LIMIT 1
      `;
      await query(setNewPrimarySql, [id]);
    }

    const response = createResponse(true, 'Contact deleted successfully', {
      contact_id: contactId,
      lead_id: id
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error deleting lead contact:', error);
    const response = createResponse(false, 'Failed to delete contact', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get a specific contact by ID
const getLeadContactById = async (req, res) => {
  try {
    const { id, contactId } = req.params;

    const contactSql = `
      SELECT 
        id, contact_type, first_name, last_name, title, email, phone, mobile,
        relationship, is_primary_contact, can_make_decisions,
        preferred_contact_method, notes, created_at, updated_at
      FROM lead_contacts 
      WHERE id = ? AND lead_id = ?
    `;
    
    const contacts = await query(contactSql, [contactId, id]);
    
    if (contacts.length === 0) {
      const response = createResponse(false, 'Contact not found', null, 'CONTACT_NOT_FOUND');
      return res.status(404).json(response);
    }

    const contact = contacts[0];

    const response = createResponse(true, 'Contact retrieved successfully', {
      contact: {
        id: contact.id,
        contact_type: contact.contact_type,
        first_name: contact.first_name,
        last_name: contact.last_name,
        name: `${contact.first_name} ${contact.last_name}`,
        title: contact.title,
        email: contact.email,
        phone: contact.phone,
        mobile: contact.mobile,
        relationship: contact.relationship,
        is_primary_contact: contact.is_primary_contact,
        can_make_decisions: contact.can_make_decisions,
        preferred_contact_method: contact.preferred_contact_method,
        notes: contact.notes,
        created: contact.created_at,
        updated: contact.updated_at
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting lead contact:', error);
    const response = createResponse(false, 'Failed to retrieve contact', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

module.exports = {
  getLeadContacts,
  addLeadContact,
  updateLeadContact,
  deleteLeadContact,
  getLeadContactById
};
