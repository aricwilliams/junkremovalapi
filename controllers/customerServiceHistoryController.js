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

// 22. Get Customer Service History
const getCustomerServiceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { date_from, date_to, service_type, status, page = 1, limit = 20 } = req.query;

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

    if (service_type) {
      conditions.push('service_type = ?');
      params.push(service_type);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (date_from) {
      conditions.push('service_date >= ?');
      params.push(date_from);
    }

    if (date_to) {
      conditions.push('service_date <= ?');
      params.push(date_to);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total 
      FROM customer_service_history 
      WHERE ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const total = countResult[0].total;

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Get service history with pagination
    const servicesSql = `
      SELECT 
        id, service_date, service_type, service_description, service_value,
        employee_id, customer_satisfaction, feedback, follow_up_required,
        follow_up_notes, created_at
      FROM customer_service_history 
      WHERE ${whereClause}
      ORDER BY service_date DESC
      LIMIT ? OFFSET ?
    `;
    
    const services = await query(servicesSql, [...params, parseInt(limit), offset]);

    // Get summary statistics
    const summarySql = `
      SELECT 
        COUNT(*) as total_jobs,
        SUM(service_value) as total_spent,
        AVG(service_value) as average_job_value,
        MIN(service_date) as first_service,
        MAX(service_date) as last_service
      FROM customer_service_history 
      WHERE customer_id = ?
    `;
    
    const summary = await query(summarySql, [id]);

    // Get favorite services
    const favoriteServicesSql = `
      SELECT service_type, COUNT(*) as count
      FROM customer_service_history 
      WHERE customer_id = ?
      GROUP BY service_type
      ORDER BY count DESC
      LIMIT 5
    `;
    const favoriteServices = await query(favoriteServicesSql, [id]);

    const response = createResponse(true, 'Customer service history retrieved successfully', {
      customer_id: id,
      summary: {
        total_jobs: summary[0].total_jobs || 0,
        total_spent: parseFloat(summary[0].total_spent || 0),
        average_job_value: parseFloat(summary[0].average_job_value || 0),
        first_service: summary[0].first_service,
        last_service: summary[0].last_service,
        favorite_services: favoriteServices.map(service => service.service_type)
      },
      services: services.map(service => ({
        id: service.id,
        type: service.service_type,
        date: service.service_date,
        status: 'completed', // Default status for service history
        amount: parseFloat(service.service_value || 0),
        crew: service.employee_id, // Could be enhanced to get actual employee name
        notes: service.service_description
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting customer service history:', error);
    const response = createResponse(false, 'Failed to retrieve customer service history', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Create Customer Service History Entry
const createCustomerServiceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const serviceData = req.body;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    const serviceHistoryId = uuidv4();
    const insertSql = `
      INSERT INTO customer_service_history (
        id, customer_id, service_date, service_type, service_description,
        service_value, employee_id, customer_satisfaction, feedback,
        follow_up_required, follow_up_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(insertSql, [
      serviceHistoryId,
      id,
      serviceData.service_date,
      serviceData.service_type,
      serviceData.service_description || null,
      serviceData.service_value || null,
      serviceData.employee_id || req.user ? req.user.id : null,
      serviceData.customer_satisfaction || null,
      serviceData.feedback || null,
      serviceData.follow_up_required || false,
      serviceData.follow_up_notes || null
    ]);

    // Update customer totals
    const updateCustomerSql = `
      UPDATE customers 
      SET 
        total_jobs = total_jobs + 1,
        total_spent = total_spent + ?,
        average_job_value = (total_spent + ?) / (total_jobs + 1),
        last_contact_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const serviceValue = parseFloat(serviceData.service_value || 0);
    await query(updateCustomerSql, [serviceValue, serviceValue, id]);

    const response = createResponse(true, 'Service history entry created successfully', {
      service_history_id: serviceHistoryId,
      customer_id: id,
      service_type: serviceData.service_type,
      service_date: serviceData.service_date
    });

    res.status(201).json(response);

  } catch (error) {
    console.error('Error creating customer service history:', error);
    const response = createResponse(false, 'Failed to create service history entry', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Update Customer Service History Entry
const updateCustomerServiceHistory = async (req, res) => {
  try {
    const { id, serviceHistoryId } = req.params;
    const updateData = req.body;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if service history entry exists
    const serviceCheckSql = `
      SELECT id, service_value FROM customer_service_history 
      WHERE id = ? AND customer_id = ?
    `;
    const serviceExists = await query(serviceCheckSql, [serviceHistoryId, id]);
    
    if (serviceExists.length === 0) {
      const response = createResponse(false, 'Service history entry not found', null, 'SERVICE_HISTORY_NOT_FOUND');
      return res.status(404).json(response);
    }

    const oldServiceValue = parseFloat(serviceExists[0].service_value || 0);

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

    const updateSql = `UPDATE customer_service_history SET ${updateFields.join(', ')} WHERE id = ? AND customer_id = ?`;
    updateParams.push(serviceHistoryId, id);

    await query(updateSql, updateParams);

    // If service value changed, update customer totals
    if (updateData.service_value !== undefined) {
      const newServiceValue = parseFloat(updateData.service_value || 0);
      const valueDifference = newServiceValue - oldServiceValue;

      if (valueDifference !== 0) {
        const updateCustomerSql = `
          UPDATE customers 
          SET 
            total_spent = total_spent + ?,
            average_job_value = total_spent / total_jobs,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        
        await query(updateCustomerSql, [valueDifference, id]);
      }
    }

    const response = createResponse(true, 'Service history entry updated successfully', {
      service_history_id: serviceHistoryId,
      updated_fields: Object.keys(updateData)
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error updating customer service history:', error);
    const response = createResponse(false, 'Failed to update service history entry', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Delete Customer Service History Entry
const deleteCustomerServiceHistory = async (req, res) => {
  try {
    const { id, serviceHistoryId } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Check if service history entry exists
    const serviceCheckSql = `
      SELECT id, service_value FROM customer_service_history 
      WHERE id = ? AND customer_id = ?
    `;
    const serviceExists = await query(serviceCheckSql, [serviceHistoryId, id]);
    
    if (serviceExists.length === 0) {
      const response = createResponse(false, 'Service history entry not found', null, 'SERVICE_HISTORY_NOT_FOUND');
      return res.status(404).json(response);
    }

    const serviceValue = parseFloat(serviceExists[0].service_value || 0);

    // Delete the service history entry
    const deleteSql = 'DELETE FROM customer_service_history WHERE id = ? AND customer_id = ?';
    await query(deleteSql, [serviceHistoryId, id]);

    // Update customer totals
    const updateCustomerSql = `
      UPDATE customers 
      SET 
        total_jobs = GREATEST(total_jobs - 1, 0),
        total_spent = GREATEST(total_spent - ?, 0),
        average_job_value = CASE 
          WHEN total_jobs - 1 > 0 THEN (total_spent - ?) / (total_jobs - 1)
          ELSE 0
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(updateCustomerSql, [serviceValue, serviceValue, id]);

    const response = createResponse(true, 'Service history entry deleted successfully', {
      service_history_id: serviceHistoryId,
      customer_id: id
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error deleting customer service history:', error);
    const response = createResponse(false, 'Failed to delete service history entry', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get a specific service history entry by ID
const getCustomerServiceHistoryById = async (req, res) => {
  try {
    const { id, serviceHistoryId } = req.params;

    // Check if customer exists
    const customerCheckSql = 'SELECT id FROM customers WHERE id = ?';
    const customerExists = await query(customerCheckSql, [id]);
    
    if (customerExists.length === 0) {
      const response = createResponse(false, 'Customer not found', null, 'CUSTOMER_NOT_FOUND');
      return res.status(404).json(response);
    }

    // Get the specific service history entry
    const serviceSql = `
      SELECT 
        id, service_date, service_type, service_description, service_value,
        employee_id, customer_satisfaction, feedback, follow_up_required,
        follow_up_notes, created_at
      FROM customer_service_history 
      WHERE id = ? AND customer_id = ?
    `;
    
    const services = await query(serviceSql, [serviceHistoryId, id]);
    
    if (services.length === 0) {
      const response = createResponse(false, 'Service history entry not found', null, 'SERVICE_HISTORY_NOT_FOUND');
      return res.status(404).json(response);
    }

    const service = services[0];

    const response = createResponse(true, 'Customer service history entry retrieved successfully', {
      customer_id: id,
      service: {
        id: service.id,
        service_date: service.service_date,
        service_type: service.service_type,
        service_description: service.service_description,
        service_value: parseFloat(service.service_value || 0),
        employee_id: service.employee_id,
        customer_satisfaction: service.customer_satisfaction,
        feedback: service.feedback,
        follow_up_required: service.follow_up_required,
        follow_up_notes: service.follow_up_notes,
        created: service.created_at
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting customer service history entry:', error);
    const response = createResponse(false, 'Failed to retrieve service history entry', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

module.exports = {
  getCustomerServiceHistory,
  createCustomerServiceHistory,
  updateCustomerServiceHistory,
  deleteCustomerServiceHistory,
  getCustomerServiceHistoryById
};
