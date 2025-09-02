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

// 20. Get Customer Preferences
const getCustomerPreferences = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Get customer preferences
    const preferencesSql = `
      SELECT preference_key, preference_value, preference_type, description
      FROM customer_preferences 
      WHERE customer_id = ?
      ORDER BY preference_key ASC
    `;
    
    const preferences = await query(preferencesSql, [id]);

    // Format preferences object
    const preferencesObj = {};
    preferences.forEach(pref => {
      // Convert boolean strings to actual booleans
      if (pref.preference_type === 'boolean') {
        preferencesObj[pref.preference_key] = pref.preference_value === 'true';
      } else if (pref.preference_type === 'number') {
        preferencesObj[pref.preference_key] = parseFloat(pref.preference_value);
      } else {
        preferencesObj[pref.preference_key] = pref.preference_value;
      }
    });

    const response = createResponse(true, 'Customer preferences retrieved successfully', {
      customer_id: id,
      preferences: preferencesObj
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting customer preferences:', error);
    const response = createResponse(false, 'Failed to retrieve customer preferences', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// 21. Update Customer Preferences
const updateCustomerPreferences = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    const updatedFields = [];
    const updatedPreferences = {};

    // Process each preference update
    for (const [key, value] of Object.entries(updateData)) {
      // Determine preference type
      let preferenceType = 'string';
      if (typeof value === 'boolean') {
        preferenceType = 'boolean';
      } else if (typeof value === 'number') {
        preferenceType = 'number';
      } else if (typeof value === 'object') {
        preferenceType = 'json';
      }

      // Check if preference already exists
      const existingPreferenceSql = `
        SELECT id FROM customer_preferences 
        WHERE customer_id = ? AND preference_key = ?
      `;
      const existingPreference = await query(existingPreferenceSql, [id, key]);

      if (existingPreference.length > 0) {
        // Update existing preference
        const updateSql = `
          UPDATE customer_preferences 
          SET preference_value = ?, preference_type = ?, updated_at = CURRENT_TIMESTAMP
          WHERE customer_id = ? AND preference_key = ?
        `;
        await query(updateSql, [String(value), preferenceType, id, key]);
      } else {
        // Create new preference
        const preferenceId = uuidv4();
        const insertSql = `
          INSERT INTO customer_preferences (
            id, customer_id, preference_key, preference_value, 
            preference_type, description
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        await query(insertSql, [preferenceId, id, key, String(value), preferenceType, null]);
      }

      updatedFields.push(key);
      updatedPreferences[key] = value;
    }

    const response = createResponse(true, 'Customer preferences updated successfully', {
      customer_id: id,
      updated_fields: updatedFields,
      preferences: updatedPreferences
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating customer preferences:', error);
    const response = createResponse(false, 'Failed to update customer preferences', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Create a single customer preference
const createCustomerPreference = async (req, res) => {
  try {
    const { id } = req.params;
    const { preference_key, preference_value, preference_type, description } = req.body;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if preference already exists
    const existingPreferenceSql = `
      SELECT id FROM customer_preferences 
      WHERE customer_id = ? AND preference_key = ?
    `;
    const existingPreference = await query(existingPreferenceSql, [id, preference_key]);
    
    if (existingPreference.length > 0) {
      const response = createResponse(false, 'Preference already exists', null, 'PREFERENCE_ALREADY_EXISTS');
      return res.status(409).json(response);
    }

    const preferenceId = uuidv4();
    const insertSql = `
      INSERT INTO customer_preferences (
        id, customer_id, preference_key, preference_value, 
        preference_type, description
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    await query(insertSql, [
      preferenceId,
      id,
      preference_key,
      String(preference_value),
      preference_type || 'string',
      description || null
    ]);

    const response = createResponse(true, 'Customer preference created successfully', {
      preference_id: preferenceId,
      customer_id: id,
      preference_key,
      preference_value
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('Error creating customer preference:', error);
    const response = createResponse(false, 'Failed to create customer preference', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Update a single customer preference
const updateCustomerPreference = async (req, res) => {
  try {
    const { id, preferenceId } = req.params;
    const updateData = req.body;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if preference exists
    const preferenceCheckSql = `
      SELECT id FROM customer_preferences 
      WHERE id = ? AND customer_id = ?
    `;
    const preferenceExists = await query(preferenceCheckSql, [preferenceId, id]);
    
    if (preferenceExists.length === 0) {
      const response = createResponse(false, 'Preference not found', null, 'PREFERENCE_NOT_FOUND');
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
    
    const updateSql = `UPDATE customer_preferences SET ${updateFields.join(', ')} WHERE id = ? AND customer_id = ?`;
    updateParams.push(preferenceId, id);

    await query(updateSql, updateParams);

    const response = createResponse(true, 'Customer preference updated successfully', {
      preference_id: preferenceId,
      updated_fields: Object.keys(updateData)
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating customer preference:', error);
    const response = createResponse(false, 'Failed to update customer preference', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Delete a customer preference
const deleteCustomerPreference = async (req, res) => {
  try {
    const { id, preferenceId } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if preference exists
    const preferenceCheckSql = `
      SELECT id FROM customer_preferences 
      WHERE id = ? AND customer_id = ?
    `;
    const preferenceExists = await query(preferenceCheckSql, [preferenceId, id]);
    
    if (preferenceExists.length === 0) {
      const response = createResponse(false, 'Preference not found', null, 'PREFERENCE_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Delete the preference
    const deleteSql = 'DELETE FROM customer_preferences WHERE id = ? AND customer_id = ?';
    await query(deleteSql, [preferenceId, id]);

    const response = createResponse(true, 'Customer preference deleted successfully', {
      preference_id: preferenceId,
      customer_id: id
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error deleting customer preference:', error);
    const response = createResponse(false, 'Failed to delete customer preference', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get a specific preference by ID
const getCustomerPreferenceById = async (req, res) => {
  try {
    const { id, preferenceId } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Get the specific preference
    const preferenceSql = `
      SELECT 
        id, preference_key, preference_value, preference_type, 
        description, created_at, updated_at
      FROM customer_preferences 
      WHERE id = ? AND customer_id = ?
    `;
    
    const preferences = await query(preferenceSql, [preferenceId, id]);
    
    if (preferences.length === 0) {
      const response = createResponse(false, 'Preference not found', null, 'PREFERENCE_NOT_FOUND');
      return res.status(404).json(response);
    }

    const preference = preferences[0];

    // Convert value based on type
    let convertedValue = preference.preference_value;
    if (preference.preference_type === 'boolean') {
      convertedValue = preference.preference_value === 'true';
    } else if (preference.preference_type === 'number') {
      convertedValue = parseFloat(preference.preference_value);
    }

    const response = createResponse(true, 'Customer preference retrieved successfully', {
      customer_id: id,
      preference: {
        id: preference.id,
        key: preference.preference_key,
        value: convertedValue,
        type: preference.preference_type,
        description: preference.description,
        created: preference.created_at,
        updated: preference.updated_at
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting customer preference:', error);
    const response = createResponse(false, 'Failed to retrieve customer preference', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

module.exports = {
  getCustomerPreferences,
  updateCustomerPreferences,
  createCustomerPreference,
  updateCustomerPreference,
  deleteCustomerPreference,
  getCustomerPreferenceById
};
