const db = require('../config/database');

// Get all customers for the authenticated business
const getCustomers = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { 
      status, 
      customer_type, 
      page = 1, 
      limit = 20, 
      sort_by = 'created_at', 
      sort_order = 'desc' 
    } = req.query;

    // Build WHERE clause
    let whereClause = 'WHERE business_id = ?';
    const params = [businessId];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (customer_type) {
      whereClause += ' AND customer_type = ?';
      params.push(customer_type);
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM customers ${whereClause}`;
    const [countResult] = await db.query(countQuery, params);
    const totalItems = countResult[0].total;

    // Get customers with pagination
    const customersQuery = `
      SELECT * FROM customers 
      ${whereClause} 
      ORDER BY ${sort_by} ${sort_order.toUpperCase()} 
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);
    
    const customers = await db.query(customersQuery, params);

    res.json({
      success: true,
      data: {
        customers,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalItems / limit),
          total_items: totalItems,
          items_per_page: parseInt(limit)
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get customers error:', error);
    next(error);
  }
};

// Get single customer
const getCustomer = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const customerId = req.params.id;

    const customer = await db.query(
      'SELECT * FROM customers WHERE id = ? AND business_id = ?',
      [customerId, businessId]
    );

    if (customer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        error: 'CUSTOMER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: { customer: customer[0] },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get customer error:', error);
    next(error);
  }
};

// Create new customer
const createCustomer = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zip_code,
      customer_type = 'residential',
      status = 'new'
    } = req.body;

    // Check if customer with same email already exists for this business
    const existingCustomer = await db.query(
      'SELECT id FROM customers WHERE email = ? AND business_id = ?',
      [email, businessId]
    );

    if (existingCustomer.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this email already exists',
        error: 'CUSTOMER_EXISTS',
        timestamp: new Date().toISOString()
      });
    }

    const result = await db.query(
      `INSERT INTO customers (
        business_id, name, email, phone, address, city, state, 
        zip_code, customer_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [businessId, name, email, phone, address, city, state, zip_code, customer_type, status]
    );

    const newCustomer = await db.query(
      'SELECT * FROM customers WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: { customer: newCustomer[0] },
      message: 'Customer created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create customer error:', error);
    next(error);
  }
};

// Update customer
const updateCustomer = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const customerId = req.params.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.business_id;
    delete updateData.created_at;

    // Check if customer exists and belongs to business
    const existingCustomer = await db.query(
      'SELECT id FROM customers WHERE id = ? AND business_id = ?',
      [customerId, businessId]
    );

    if (existingCustomer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        error: 'CUSTOMER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // If email is being updated, check for duplicates
    if (updateData.email) {
      const duplicateCustomer = await db.query(
        'SELECT id FROM customers WHERE email = ? AND business_id = ? AND id != ?',
        [updateData.email, businessId, customerId]
      );

      if (duplicateCustomer.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this email already exists',
          error: 'CUSTOMER_EXISTS',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Build dynamic update query
    const allowedFields = [
      'name', 'email', 'phone', 'address', 'city', 'state', 
      'zip_code', 'customer_type', 'status'
    ];

    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        error: 'NO_VALID_FIELDS',
        timestamp: new Date().toISOString()
      });
    }

    updateValues.push(customerId);

    await db.query(
      `UPDATE customers SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    const updatedCustomer = await db.query(
      'SELECT * FROM customers WHERE id = ?',
      [customerId]
    );

    res.json({
      success: true,
      data: { customer: updatedCustomer[0] },
      message: 'Customer updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update customer error:', error);
    next(error);
  }
};

// Delete customer
const deleteCustomer = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const customerId = req.params.id;

    // Check if customer exists and belongs to business
    const existingCustomer = await db.query(
      'SELECT id FROM customers WHERE id = ? AND business_id = ?',
      [customerId, businessId]
    );

    if (existingCustomer.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
        error: 'CUSTOMER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Check if customer has associated jobs
    const associatedJobs = await db.query(
      'SELECT COUNT(*) as count FROM jobs WHERE customer_id = ?',
      [customerId]
    );

    if (associatedJobs[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete customer with associated jobs',
        error: 'CUSTOMER_HAS_JOBS',
        timestamp: new Date().toISOString()
      });
    }

    await db.query('DELETE FROM customers WHERE id = ?', [customerId]);

    res.json({
      success: true,
      message: 'Customer deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
