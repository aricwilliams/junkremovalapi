const db = require('../config/database');

// Get all estimates for the authenticated business
const getEstimates = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { 
      status, 
      customer_id, 
      page = 1, 
      limit = 20, 
      sort_by = 'created_at', 
      sort_order = 'desc' 
    } = req.query;

    // Build WHERE clause
    let whereClause = 'WHERE e.business_id = ?';
    const params = [businessId];

    if (status) {
      whereClause += ' AND e.status = ?';
      params.push(status);
    }

    if (customer_id) {
      whereClause += ' AND e.customer_id = ?';
      params.push(customer_id);
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM estimates e 
      ${whereClause}
    `;
    const [countResult] = await db.query(countQuery, params);
    const totalItems = countResult[0].total;

    // Get estimates with customer info
    const estimatesQuery = `
      SELECT 
        e.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone
      FROM estimates e
      LEFT JOIN customers c ON e.customer_id = c.id
      ${whereClause}
      ORDER BY e.${sort_by} ${sort_order.toUpperCase()}
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);
    
    const estimates = await db.query(estimatesQuery, params);

    res.json({
      success: true,
      data: {
        estimates,
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
    console.error('Get estimates error:', error);
    next(error);
  }
};

// Get single estimate
const getEstimate = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const estimateId = req.params.id;

    const estimate = await db.query(
      `SELECT 
        e.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        c.city as customer_city,
        c.state as customer_state,
        c.zip_code as customer_zip_code
      FROM estimates e
      LEFT JOIN customers c ON e.customer_id = c.id
      WHERE e.id = ? AND e.business_id = ?`,
      [estimateId, businessId]
    );

    if (estimate.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found',
        error: 'ESTIMATE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: { estimate: estimate[0] },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get estimate error:', error);
    next(error);
  }
};

// Create new estimate
const createEstimate = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const {
      customer_id,
      title,
      amount,
      status = 'draft',
      sent_date,
      expiry_date,
      notes
    } = req.body;

    // Verify customer belongs to this business
    const customer = await db.query(
      'SELECT id FROM customers WHERE id = ? AND business_id = ?',
      [customer_id, businessId]
    );

    if (customer.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer not found or does not belong to your business',
        error: 'CUSTOMER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const result = await db.query(
      `INSERT INTO estimates (
        business_id, customer_id, title, amount, status, 
        sent_date, expiry_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [businessId, customer_id, title, amount, status, sent_date, expiry_date, notes]
    );

    const newEstimate = await db.query(
      `SELECT 
        e.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone
      FROM estimates e
      LEFT JOIN customers c ON e.customer_id = c.id
      WHERE e.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      data: { estimate: newEstimate[0] },
      message: 'Estimate created successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create estimate error:', error);
    next(error);
  }
};

// Update estimate
const updateEstimate = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const estimateId = req.params.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.business_id;
    delete updateData.created_at;

    // Check if estimate exists and belongs to business
    const existingEstimate = await db.query(
      'SELECT id FROM estimates WHERE id = ? AND business_id = ?',
      [estimateId, businessId]
    );

    if (existingEstimate.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found',
        error: 'ESTIMATE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // If customer_id is being updated, verify it belongs to business
    if (updateData.customer_id) {
      const customer = await db.query(
        'SELECT id FROM customers WHERE id = ? AND business_id = ?',
        [updateData.customer_id, businessId]
      );

      if (customer.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Customer not found or does not belong to your business',
          error: 'CUSTOMER_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Build dynamic update query
    const allowedFields = [
      'customer_id', 'title', 'amount', 'status', 
      'sent_date', 'expiry_date', 'notes'
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

    updateValues.push(estimateId);

    await db.query(
      `UPDATE estimates SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    const updatedEstimate = await db.query(
      `SELECT 
        e.*,
        c.name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone
      FROM estimates e
      LEFT JOIN customers c ON e.customer_id = c.id
      WHERE e.id = ?`,
      [estimateId]
    );

    res.json({
      success: true,
      data: { estimate: updatedEstimate[0] },
      message: 'Estimate updated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Update estimate error:', error);
    next(error);
  }
};

// Delete estimate
const deleteEstimate = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const estimateId = req.params.id;

    // Check if estimate exists and belongs to business
    const existingEstimate = await db.query(
      'SELECT id FROM estimates WHERE id = ? AND business_id = ?',
      [estimateId, businessId]
    );

    if (existingEstimate.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found',
        error: 'ESTIMATE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Check if estimate has associated jobs
    const associatedJobs = await db.query(
      'SELECT COUNT(*) as count FROM jobs WHERE estimate_id = ?',
      [estimateId]
    );

    if (associatedJobs[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete estimate with associated jobs',
        error: 'ESTIMATE_HAS_JOBS',
        timestamp: new Date().toISOString()
      });
    }

    await db.query('DELETE FROM estimates WHERE id = ?', [estimateId]);

    res.json({
      success: true,
      message: 'Estimate deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Delete estimate error:', error);
    next(error);
  }
};

module.exports = {
  getEstimates,
  getEstimate,
  createEstimate,
  updateEstimate,
  deleteEstimate
};
