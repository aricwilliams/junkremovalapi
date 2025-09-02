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

// 11. Get Customer Addresses
const getCustomerAddresses = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Get all addresses for the customer
    const addressesSql = `
      SELECT 
        id, address_type, address_line_1, address_line_2, city, state, 
        zip_code, country, latitude, longitude, is_primary, 
        access_notes, service_area_notes, created_at
      FROM customer_addresses 
      WHERE customer_id = ?
      ORDER BY is_primary DESC, created_at ASC
    `;
    
    const addresses = await query(addressesSql, [id]);

    const response = createResponse(true, 'Customer addresses retrieved successfully', {
      customer_id: id,
      addresses: addresses.map(address => ({
        id: address.id,
        type: address.address_type,
        street: address.address_line_1,
        city: address.city,
        state: address.state,
        zip_code: address.zip_code,
        country: address.country,
        is_primary: address.is_primary,
        notes: address.access_notes,
        created: address.created_at
      }))
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting customer addresses:', error);
    const response = createResponse(false, 'Failed to retrieve customer addresses', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// 12. Add Customer Address
const addCustomerAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const addressData = req.body;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // If this is a primary address, unset other primary addresses
    if (addressData.is_primary) {
      const unsetPrimarySql = `
        UPDATE customer_addresses 
        SET is_primary = FALSE 
        WHERE customer_id = ?
      `;
      await query(unsetPrimarySql, [id]);
    }

    const addressId = uuidv4();
    const insertSql = `
      INSERT INTO customer_addresses (
        id, customer_id, address_type, address_line_1, address_line_2,
        city, state, zip_code, country, latitude, longitude,
        is_primary, access_notes, service_area_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(insertSql, [
      addressId,
      id,
      addressData.address_type || 'service',
      addressData.address_line_1,
      addressData.address_line_2 || null,
      addressData.city,
      addressData.state,
      addressData.zip_code,
      addressData.country || 'USA',
      addressData.latitude || null,
      addressData.longitude || null,
      addressData.is_primary || false,
      addressData.access_notes || null,
      addressData.service_area_notes || null
    ]);

    const response = createResponse(true, 'Address added successfully', {
      address_id: addressId,
      customer_id: id,
      address_type: addressData.address_type || 'service'
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('Error adding customer address:', error);
    const response = createResponse(false, 'Failed to add customer address', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Update Customer Address
const updateCustomerAddress = async (req, res) => {
  try {
    const { id, addressId } = req.params;
    const updateData = req.body;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if address exists
    const addressCheckSql = 'SELECT id FROM customer_addresses WHERE id = ? AND customer_id = ?';
    const addressExists = await query(addressCheckSql, [addressId, id]);
    
    if (addressExists.length === 0) {
      const response = createResponse(false, 'Address not found', null, 'ADDRESS_NOT_FOUND');
      return res.status(404).json(response);
    }

    // If this is being set as primary address, unset other primary addresses
    if (updateData.is_primary) {
      const unsetPrimarySql = `
        UPDATE customer_addresses 
        SET is_primary = FALSE 
        WHERE customer_id = ? AND id != ?
      `;
      await query(unsetPrimarySql, [id, addressId]);
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
    
    const updateSql = `UPDATE customer_addresses SET ${updateFields.join(', ')} WHERE id = ? AND customer_id = ?`;
    updateParams.push(addressId, id);

    await query(updateSql, updateParams);

    const response = createResponse(true, 'Address updated successfully', {
      address_id: addressId,
      updated_fields: Object.keys(updateData)
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating customer address:', error);
    const response = createResponse(false, 'Failed to update customer address', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Delete Customer Address
const deleteCustomerAddress = async (req, res) => {
  try {
    const { id, addressId } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if address exists
    const addressCheckSql = 'SELECT id, is_primary FROM customer_addresses WHERE id = ? AND customer_id = ?';
    const addressExists = await query(addressCheckSql, [addressId, id]);
    
    if (addressExists.length === 0) {
      const response = createResponse(false, 'Address not found', null, 'ADDRESS_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Delete the address
    const deleteSql = 'DELETE FROM customer_addresses WHERE id = ? AND customer_id = ?';
    await query(deleteSql, [addressId, id]);

    // If this was a primary address, set another address as primary if available
    if (addressExists[0].is_primary) {
      const setNewPrimarySql = `
        UPDATE customer_addresses 
        SET is_primary = TRUE 
        WHERE customer_id = ? 
        ORDER BY created_at ASC 
        LIMIT 1
      `;
      await query(setNewPrimarySql, [id]);
    }

    const response = createResponse(true, 'Address deleted successfully', {
      address_id: addressId,
      customer_id: id
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error deleting customer address:', error);
    const response = createResponse(false, 'Failed to delete customer address', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get a specific address by ID
const getCustomerAddressById = async (req, res) => {
  try {
    const { id, addressId } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Get the specific address
    const addressSql = `
      SELECT 
        id, address_type, address_line_1, address_line_2, city, state, 
        zip_code, country, latitude, longitude, is_primary, 
        access_notes, service_area_notes, created_at, updated_at
      FROM customer_addresses 
      WHERE id = ? AND customer_id = ?
    `;
    
    const addresses = await query(addressSql, [addressId, id]);
    
    if (addresses.length === 0) {
      const response = createResponse(false, 'Address not found', null, 'ADDRESS_NOT_FOUND');
      return res.status(404).json(response);
    }

    const address = addresses[0];

    const response = createResponse(true, 'Customer address retrieved successfully', {
      customer_id: id,
      address: {
        id: address.id,
        type: address.address_type,
        street: address.address_line_1,
        city: address.city,
        state: address.state,
        zip_code: address.zip_code,
        country: address.country,
        is_primary: address.is_primary,
        notes: address.access_notes,
        created: address.created_at,
        updated: address.updated_at
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting customer address:', error);
    const response = createResponse(false, 'Failed to retrieve customer address', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

module.exports = {
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  getCustomerAddressById
};
