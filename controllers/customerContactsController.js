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

// 7. Get Customer Contacts
const getCustomerContacts = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Get all contacts for the customer
    const contactsSql = `
      SELECT 
        id, contact_type, first_name, last_name, email, phone, mobile,
        relationship, is_primary_contact, can_make_decisions,
        preferred_contact_method, notes, created_at
      FROM customer_contacts 
      WHERE customer_id = ?
      ORDER BY is_primary_contact DESC, created_at ASC
    `;
    
    const contacts = await query(contactsSql, [id]);

    const response = createResponse(true, 'Customer contacts retrieved successfully', {
      customer_id: id,
      contacts: contacts.map(contact => ({
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`,
        title: contact.contact_type,
        email: contact.email,
        phone: contact.phone,
        mobile: contact.mobile,
        is_primary: contact.is_primary_contact,
        notes: contact.notes,
        created: contact.created_at
      }))
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting customer contacts:', error);
    const response = createResponse(false, 'Failed to retrieve customer contacts', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// 8. Add Customer Contact
const addCustomerContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contactData = req.body;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // If this is a primary contact, unset other primary contacts
    if (contactData.is_primary_contact) {
      const unsetPrimarySql = `
        UPDATE customer_contacts 
        SET is_primary_contact = FALSE 
        WHERE customer_id = ?
      `;
      await query(unsetPrimarySql, [id]);
    }

    const contactId = uuidv4();
    const insertSql = `
      INSERT INTO customer_contacts (
        id, customer_id, contact_type, first_name, last_name,
        email, phone, mobile, relationship, is_primary_contact,
        can_make_decisions, preferred_contact_method, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(insertSql, [
      contactId,
      id,
      contactData.contact_type || 'secondary',
      contactData.first_name,
      contactData.last_name,
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
      customer_id: id,
      contact_name: `${contactData.first_name} ${contactData.last_name}`
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('Error adding customer contact:', error);
    const response = createResponse(false, 'Failed to add customer contact', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// 9. Update Customer Contact
const updateCustomerContact = async (req, res) => {
  try {
    const { id, contactId } = req.params;
    const updateData = req.body;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if contact exists
    const contactCheckSql = 'SELECT id FROM customer_contacts WHERE id = ? AND customer_id = ?';
    const contactExists = await query(contactCheckSql, [contactId, id]);
    
    if (contactExists.length === 0) {
      const response = createResponse(false, 'Contact not found', null, 'CONTACT_NOT_FOUND');
      return res.status(404).json(response);
    }

    // If this is being set as primary contact, unset other primary contacts
    if (updateData.is_primary_contact) {
      const unsetPrimarySql = `
        UPDATE customer_contacts 
        SET is_primary_contact = FALSE 
        WHERE customer_id = ? AND id != ?
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
    
    const updateSql = `UPDATE customer_contacts SET ${updateFields.join(', ')} WHERE id = ? AND customer_id = ?`;
    updateParams.push(contactId, id);

    await query(updateSql, updateParams);

    const response = createResponse(true, 'Contact updated successfully', {
      contact_id: contactId,
      updated_fields: Object.keys(updateData)
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating customer contact:', error);
    const response = createResponse(false, 'Failed to update customer contact', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// 10. Delete Customer Contact
const deleteCustomerContact = async (req, res) => {
  try {
    const { id, contactId } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if contact exists
    const contactCheckSql = 'SELECT id, is_primary_contact FROM customer_contacts WHERE id = ? AND customer_id = ?';
    const contactExists = await query(contactCheckSql, [contactId, id]);
    
    if (contactExists.length === 0) {
      const response = createResponse(false, 'Contact not found', null, 'CONTACT_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Delete the contact
    const deleteSql = 'DELETE FROM customer_contacts WHERE id = ? AND customer_id = ?';
    await query(deleteSql, [contactId, id]);

    // If this was a primary contact, set another contact as primary if available
    if (contactExists[0].is_primary_contact) {
      const setNewPrimarySql = `
        UPDATE customer_contacts 
        SET is_primary_contact = TRUE 
        WHERE customer_id = ? 
        ORDER BY created_at ASC 
        LIMIT 1
      `;
      await query(setNewPrimarySql, [id]);
    }

    const response = createResponse(true, 'Contact deleted successfully', {
      contact_id: contactId,
      customer_id: id
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error deleting customer contact:', error);
    const response = createResponse(false, 'Failed to delete customer contact', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get a specific contact by ID
const getCustomerContactById = async (req, res) => {
  try {
    const { id, contactId } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Get the specific contact
    const contactSql = `
      SELECT 
        id, contact_type, first_name, last_name, email, phone, mobile,
        relationship, is_primary_contact, can_make_decisions,
        preferred_contact_method, notes, created_at, updated_at
      FROM customer_contacts 
      WHERE id = ? AND customer_id = ?
    `;
    
    const contacts = await query(contactSql, [contactId, id]);
    
    if (contacts.length === 0) {
      const response = createResponse(false, 'Contact not found', null, 'CONTACT_NOT_FOUND');
      return res.status(404).json(response);
    }

    const contact = contacts[0];

    const response = createResponse(true, 'Customer contact retrieved successfully', {
      customer_id: id,
      contact: {
        id: contact.id,
        name: `${contact.first_name} ${contact.last_name}`,
        title: contact.contact_type,
        email: contact.email,
        phone: contact.phone,
        mobile: contact.mobile,
        is_primary: contact.is_primary_contact,
        notes: contact.notes,
        created: contact.created_at,
        updated: contact.updated_at
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting customer contact:', error);
    const response = createResponse(false, 'Failed to retrieve customer contact', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

module.exports = {
  getCustomerContacts,
  addCustomerContact,
  updateCustomerContact,
  deleteCustomerContact,
  getCustomerContactById
};
