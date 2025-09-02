const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../config/database');

/**
 * Estimates Controller
 * Handles all estimate operations
 */

// Helper function to build WHERE clause for filtering
function buildEstimateWhereClause(filters) {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push(`(e.customer_name LIKE ? OR e.id LIKE ?)`);
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (filters.status) {
    conditions.push('e.status = ?');
    params.push(filters.status);
  }

  if (filters.client_request_id) {
    conditions.push('e.client_request_id = ?');
    params.push(filters.client_request_id);
  }

  if (filters.date_from) {
    conditions.push('e.created_at >= ?');
    params.push(filters.date_from);
  }

  if (filters.date_to) {
    conditions.push('e.created_at <= ?');
    params.push(filters.date_to);
  }

  if (filters.min_total) {
    conditions.push('e.total >= ?');
    params.push(filters.min_total);
  }

  if (filters.max_total) {
    conditions.push('e.total <= ?');
    params.push(filters.max_total);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

// Helper function to build ORDER BY clause
function buildEstimateOrderClause(sortBy, sortOrder) {
  const validSortFields = {
    'created_at': 'e.created_at',
    'sent_date': 'e.sent_date',
    'expiry_date': 'e.expiry_date',
    'total': 'e.total',
    'customer_name': 'e.customer_name'
  };

  const field = validSortFields[sortBy] || 'e.created_at';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  return `ORDER BY ${field} ${order}`;
}

/**
 * Get all estimates with filtering, sorting, and pagination
 */
async function getAllEstimates(req, res) {
  try {
    const connection = await getConnection();
    
    const {
      page = 1,
      limit = 20,
      search,
      status,
      client_request_id,
      date_from,
      date_to,
      min_total,
      max_total,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const filters = { search, status, client_request_id, date_from, date_to, min_total, max_total };
    
    const { whereClause, params } = buildEstimateWhereClause(filters);
    const orderClause = buildEstimateOrderClause(sort_by, sort_order);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM estimates e
      ${whereClause}
    `;
    
    const [countResult] = await connection.execute(countQuery, params);
    const total = countResult[0].total;

    // Get estimates
    const query = `
      SELECT 
        e.id,
        e.customer_id,
        e.customer_name,
        e.customer_email,
        e.customer_phone,
        e.address,
        e.city,
        e.state,
        e.zip_code,
        e.country,
        e.labor_hours,
        e.labor_rate,
        e.subtotal,
        e.total,
        e.status,
        e.sent_date,
        e.expiry_date,
        e.accepted_date,
        e.rejected_date,
        e.rejection_reason,
        e.notes,
        e.terms_conditions,
        e.payment_terms,
        e.volume_weight,
        e.volume_yardage,
        e.created_at,
        e.updated_at
      FROM estimates e
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const [estimates] = await connection.execute(query, [...params, parseInt(limit), offset]);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_estimates,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_estimates,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_estimates,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_estimates,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_estimates,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_estimates,
        SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_estimates,
        SUM(total) as total_value
      FROM estimates
      ${whereClause}
    `;

    const [summaryResult] = await connection.execute(summaryQuery, params);
    const summary = summaryResult[0];

    const response = {
      success: true,
      message: 'Estimates retrieved successfully',
      data: {
        estimates: estimates.map(est => ({
          id: est.id,
          estimate_number: est.id, // Would need to be added to schema
          client_name: est.customer_name,
          client_email: est.customer_email,
          service_type: 'Junk Removal', // Would need to be added to schema
          status: est.status,
          total_amount: est.total,
          valid_until: est.expiry_date,
          created: est.created_at,
          sent_date: est.sent_date
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        summary: {
          total_estimates: summary.total_estimates,
          draft_estimates: summary.draft_estimates,
          sent_estimates: summary.sent_estimates,
          accepted_estimates: summary.accepted_estimates,
          rejected_estimates: summary.rejected_estimates,
          total_value: summary.total_value || 0
        }
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting estimates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve estimates',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get estimate by ID
 */
async function getEstimateById(req, res) {
  try {
    const { id } = req.params;
    const connection = await getConnection();

    // Get estimate details
    const estimateQuery = `
      SELECT 
        e.*,
        cr.id as client_request_id,
        cr.subject as client_request_subject,
        cr.description as client_request_description
      FROM estimates e
      LEFT JOIN client_requests cr ON e.client_request_id = cr.id
      WHERE e.id = ?
    `;

    const [estimateResults] = await connection.execute(estimateQuery, [id]);

    if (estimateResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found',
        error: 'ESTIMATE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const estimate = estimateResults[0];

    // Get estimate items
    const itemsQuery = `
      SELECT 
        id, name, category, quantity, base_price, price_per_unit, total,
        difficulty, estimated_time, volume_weight, volume_yardage, description, notes
      FROM estimate_items
      WHERE estimate_id = ?
      ORDER BY created_at
    `;

    const [items] = await connection.execute(itemsQuery, [id]);

    // Get additional fees
    const feesQuery = `
      SELECT 
        id, fee_type, description, amount, is_percentage, percentage_rate
      FROM estimate_additional_fees
      WHERE estimate_id = ?
      ORDER BY created_at
    `;

    const [fees] = await connection.execute(feesQuery, [id]);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
    const feesTotal = fees.reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
    const total = subtotal + feesTotal;

    const response = {
      success: true,
      message: 'Estimate retrieved successfully',
      data: {
        estimate: {
          id: estimate.id,
          estimate_number: estimate.id, // Would need to be added to schema
          client_request_id: estimate.client_request_id,
          client_name: estimate.customer_name,
          client_email: estimate.customer_email,
          client_phone: estimate.customer_phone,
          client_address: `${estimate.address}, ${estimate.city}, ${estimate.state} ${estimate.zip_code}`,
          service_type: 'Junk Removal', // Would need to be added to schema
          status: estimate.status,
          project_details: {
            description: estimate.client_request_description || 'Junk removal service',
            square_footage: null, // Would need to be added to schema
            estimated_duration: `${estimate.labor_hours || 0} hours`,
            crew_size: Math.ceil((estimate.labor_hours || 0) / 8) // Estimate crew size
          },
          items: items.map(item => ({
            id: item.id,
            description: item.name,
            quantity: item.quantity,
            unit_price: item.price_per_unit || item.base_price,
            total_price: item.total,
            category: item.category
          })),
          additional_fees: fees.map(fee => ({
            id: fee.id,
            description: fee.description || fee.fee_type,
            amount: fee.amount,
            type: fee.fee_type
          })),
          pricing: {
            subtotal: subtotal,
            tax_rate: 0, // Would need to be added to schema
            tax_amount: 0,
            total_amount: total,
            deposit_required: total * 0.5, // 50% deposit
            payment_terms: estimate.payment_terms || '50% deposit, balance upon completion'
          },
          timeline: {
            estimated_start_date: null, // Would need to be added to schema
            estimated_completion_date: null, // Would need to be added to schema
            valid_until: estimate.expiry_date
          },
          terms_conditions: estimate.terms_conditions || 'Standard terms apply. Estimate valid for 30 days.',
          notes: estimate.notes,
          created_by: null, // Would need to be added to schema
          created_by_name: null,
          created: estimate.created_at,
          sent_date: estimate.sent_date,
          updated: estimate.updated_at
        }
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting estimate by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve estimate',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Create new estimate
 */
async function createEstimate(req, res) {
  try {
    const connection = await getConnection();
    const estimateId = uuidv4();
    
    const {
      client_request_id,
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      address,
      city,
      state,
      zip_code,
      country = 'USA',
      latitude,
      longitude,
      labor_hours = 0,
      labor_rate = 0,
      items,
      additional_fees,
      expiry_date,
      terms_conditions,
      payment_terms,
      notes,
      volume_weight,
      volume_yardage
    } = req.body;

    // Start transaction
    await connection.beginTransaction();

    try {
      // Create estimate
      const estimateQuery = `
        INSERT INTO estimates (
          id, customer_id, customer_name, customer_email, customer_phone,
          address, city, state, zip_code, country, latitude, longitude,
          labor_hours, labor_rate, subtotal, total, status, expiry_date,
          terms_conditions, payment_terms, notes, volume_weight, volume_yardage
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // Calculate totals
      const subtotal = items.reduce((sum, item) => {
        const itemTotal = (item.price_per_unit || item.base_price) * item.quantity;
        return sum + itemTotal;
      }, 0);

      const feesTotal = (additional_fees || []).reduce((sum, fee) => sum + parseFloat(fee.amount || 0), 0);
      const total = subtotal + feesTotal;

      const estimateParams = [
        estimateId, customer_id, customer_name, customer_email, customer_phone,
        address, city, state, zip_code, country, latitude, longitude,
        labor_hours, labor_rate, subtotal, total, 'draft', expiry_date,
        terms_conditions, payment_terms, notes, volume_weight, volume_yardage
      ];

      await connection.execute(estimateQuery, estimateParams);

      // Create estimate items
      if (items && items.length > 0) {
        const itemQuery = `
          INSERT INTO estimate_items (
            id, estimate_id, name, category, quantity, base_price, price_per_unit,
            total, difficulty, estimated_time, volume_weight, volume_yardage, description, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        for (const item of items) {
          const itemId = uuidv4();
          const itemTotal = (item.price_per_unit || item.base_price) * item.quantity;
          
          const itemParams = [
            itemId, estimateId, item.name, item.category, item.quantity,
            item.base_price, item.price_per_unit, itemTotal, item.difficulty || 'medium',
            item.estimated_time, item.volume_weight, item.volume_yardage,
            item.description, item.notes
          ];

          await connection.execute(itemQuery, itemParams);
        }
      }

      // Create additional fees
      if (additional_fees && additional_fees.length > 0) {
        const feeQuery = `
          INSERT INTO estimate_additional_fees (
            id, estimate_id, fee_type, description, amount, is_percentage, percentage_rate
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        for (const fee of additional_fees) {
          const feeId = uuidv4();
          
          const feeParams = [
            feeId, estimateId, fee.fee_type, fee.description, fee.amount,
            fee.is_percentage || false, fee.percentage_rate
          ];

          await connection.execute(feeQuery, feeParams);
        }
      }

      // Update client request if provided
      if (client_request_id) {
        const updateRequestQuery = `
          UPDATE client_requests 
          SET estimate_status = 'created', estimate_id = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        await connection.execute(updateRequestQuery, [estimateId, client_request_id]);
      }

      // Commit transaction
      await connection.commit();

      const response = {
        success: true,
        message: 'Estimate created successfully',
        data: {
          estimate_id: estimateId,
          estimate_number: estimateId, // Would need to be added to schema
          total_amount: total,
          created: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      };

      res.status(201).json(response);

    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error creating estimate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create estimate',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update estimate
 */
async function updateEstimate(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const connection = await getConnection();

    // Check if estimate exists
    const checkQuery = 'SELECT id FROM estimates WHERE id = ?';
    const [checkResult] = await connection.execute(checkQuery, [id]);

    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found',
        error: 'ESTIMATE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Build dynamic UPDATE query
    const updateFields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        updateFields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        error: 'INVALID_UPDATE_DATA',
        timestamp: new Date().toISOString()
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE estimates SET ${updateFields.join(', ')} WHERE id = ?`;
    await connection.execute(query, params);

    // Recalculate total if items or fees were updated
    if (updateData.items || updateData.additional_fees) {
      // This would need to be implemented to recalculate totals
      // For now, we'll just return success
    }

    const response = {
      success: true,
      message: 'Estimate updated successfully',
      data: {
        estimate_id: id,
        updated_fields: Object.keys(updateData).filter(key => updateData[key] !== undefined && updateData[key] !== null)
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error updating estimate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update estimate',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Send estimate to client
 */
async function sendEstimate(req, res) {
  try {
    const { id } = req.params;
    const { send_method = 'email', email_template, additional_message, cc_emails } = req.body;
    const connection = await getConnection();

    // Check if estimate exists
    const checkQuery = 'SELECT id, status FROM estimates WHERE id = ?';
    const [checkResult] = await connection.execute(checkQuery, [id]);

    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found',
        error: 'ESTIMATE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const estimate = checkResult[0];

    if (estimate.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft estimates can be sent',
        error: 'INVALID_ESTIMATE_STATUS',
        timestamp: new Date().toISOString()
      });
    }

    // Update estimate status to 'sent' and set sent date
    const updateQuery = `
      UPDATE estimates 
      SET status = 'sent', sent_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await connection.execute(updateQuery, [id]);

    // Here you would implement the actual sending logic (email, SMS, etc.)
    // For now, we'll just simulate success

    const response = {
      success: true,
      message: 'Estimate sent successfully',
      data: {
        estimate_id: id,
        sent_date: new Date().toISOString(),
        sent_to: 'client@example.com', // Would need to be retrieved from estimate
        email_id: `email-${Date.now()}` // Would be generated by email service
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error sending estimate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send estimate',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update estimate status
 */
async function updateEstimateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, status_notes, accepted_date, rejected_date, rejection_reason, next_action } = req.body;
    const connection = await getConnection();

    // Check if estimate exists
    const checkQuery = 'SELECT id FROM estimates WHERE id = ?';
    const [checkResult] = await connection.execute(checkQuery, [id]);

    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found',
        error: 'ESTIMATE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Build update data
    const updateData = { status };
    
    if (status === 'accepted' && accepted_date) {
      updateData.accepted_date = accepted_date;
    }
    
    if (status === 'rejected' && rejected_date) {
      updateData.rejected_date = rejected_date;
      updateData.rejection_reason = rejection_reason;
    }

    // Build dynamic UPDATE query
    const updateFields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        updateFields.push(`${key} = ?`);
        params.push(updateData[key]);
      }
    });

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE estimates SET ${updateFields.join(', ')} WHERE id = ?`;
    await connection.execute(query, params);

    const response = {
      success: true,
      message: 'Estimate status updated successfully',
      data: {
        estimate_id: id,
        status,
        ...(accepted_date && { accepted_date }),
        ...(rejected_date && { rejected_date })
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error updating estimate status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update estimate status',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getAllEstimates,
  getEstimateById,
  createEstimate,
  updateEstimate,
  sendEstimate,
  updateEstimateStatus
};
