const db = require('../config/database');

// Get all customers for the authenticated business
const getCustomers = async (req, res, next) => {
  try {
    const businessId = req.user?.business_id ?? req.user.id;

    const {
      status,
      customer_type,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const allowedSort = ['created_at','updated_at','name','email','phone','id','city','state','customer_type','status'];
    const sortBy = allowedSort.includes(String(sort_by)) ? sort_by : 'created_at';
    const sortOrder = ['asc','desc'].includes(String(sort_order).toLowerCase())
      ? sort_order.toUpperCase()
      : 'DESC';

    const p = Math.max(1, Number.parseInt(page, 10) || 1);
    const l = Math.min(200, Math.max(1, Number.parseInt(limit, 10) || 20));
    const offset = (p - 1) * l;

    let whereClause = 'WHERE business_id = ?';
    const whereParams = [businessId];

    if (status)         { whereClause += ' AND status = ?';         whereParams.push(status); }
    if (customer_type)  { whereClause += ' AND customer_type = ?';  whereParams.push(customer_type); }

    // count
    const countSql = `SELECT COUNT(*) AS total FROM customers ${whereClause}`;
    const countRows = await db.query(countSql, whereParams);
    const total = countRows[0]?.total ?? 0;

    // data (inline LIMIT/OFFSET after sanitizing)
    const dataSql = `
      SELECT *
      FROM customers
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ${l} OFFSET ${offset}
    `;
    const rows = await db.query(dataSql, whereParams);

    res.json({
      success: true,
      data: {
        customers: rows,
        pagination: {
          current_page: p,
          items_per_page: l,
          total_items: total,
          total_pages: Math.ceil(total / l),
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Get customers error:', err);
    next(err);
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

    // Allow customers with same email to exist

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

    // Allow customers with same email to exist

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
