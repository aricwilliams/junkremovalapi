const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// Helper function to build dynamic WHERE clause for service requests
function buildServiceRequestWhereClause(filters, customerId) {
  const conditions = [`pr.customer_id = ?`];
  const values = [customerId];

  if (filters.status) {
    conditions.push('pr.status = ?');
    values.push(filters.status);
  }

  if (filters.request_type) {
    conditions.push('pr.type = ?');
    values.push(filters.request_type);
  }

  if (filters.date_from) {
    conditions.push('pr.created_at >= ?');
    values.push(filters.date_from);
  }

  if (filters.date_to) {
    conditions.push('pr.created_at <= ?');
    values.push(filters.date_to);
  }

  return {
    whereClause: 'WHERE ' + conditions.join(' AND '),
    values
  };
}

// Helper function to build ORDER BY clause for service requests
function buildServiceRequestOrderByClause(sortBy, sortOrder) {
  const validSortFields = {
    'created_at': 'pr.created_at',
    'requested_date': 'pr.requested_date',
    'preferred_date': 'pr.preferred_date',
    'priority': 'pr.priority',
    'status': 'pr.status'
  };

  const field = validSortFields[sortBy] || 'pr.created_at';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  return `ORDER BY ${field} ${order}`;
}

// Get all service requests for the authenticated user
async function getAllServiceRequests(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      request_type,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const customerId = req.user.customerId;
    const offset = (page - 1) * limit;
    const filters = { status, request_type, date_from, date_to };
    
    const { whereClause, values } = buildServiceRequestWhereClause(filters, customerId);
    const orderByClause = buildServiceRequestOrderByClause(sort_by, sort_order);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM portal_requests pr
      ${whereClause}
    `;
    
    const [countResult] = await mysql.execute(countQuery, values);
    const total = countResult[0].total;

    // Get paginated results
    const query = `
      SELECT 
        pr.id,
        pr.request_number,
        pr.title,
        pr.description,
        pr.type,
        pr.status,
        pr.priority,
        pr.requested_date,
        pr.preferred_date,
        pr.preferred_time,
        pr.location_address,
        pr.location_city,
        pr.location_state,
        pr.location_zip_code,
        pr.estimated_weight,
        pr.estimated_yardage,
        pr.created_at
      FROM portal_requests pr
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const [requests] = await mysql.execute(query, [...values, parseInt(limit), offset]);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing_requests,
        SUM(CASE WHEN status = 'quoted' THEN 1 ELSE 0 END) as quoted_requests,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_requests,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_requests,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_requests,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_requests
      FROM portal_requests
      WHERE customer_id = ?
    `;

    const [summaryResult] = await mysql.execute(summaryQuery, [customerId]);
    const summary = summaryResult[0];

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    };

    res.json({
      success: true,
      message: 'Service requests retrieved successfully',
      data: {
        requests,
        pagination,
        summary
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting service requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve service requests',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Get service request by ID
async function getServiceRequestById(req, res) {
  try {
    const { id } = req.params;
    const customerId = req.user.customerId;

    // Get basic request information
    const requestQuery = `
      SELECT 
        pr.*,
        c.first_name,
        c.last_name,
        c.company_name
      FROM portal_requests pr
      JOIN customers c ON pr.customer_id = c.id
      WHERE pr.id = ? AND pr.customer_id = ?
    `;

    const [requests] = await mysql.execute(requestQuery, [id, customerId]);
    
    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
        error: 'SERVICE_REQUEST_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const request = requests[0];

    // Get attachments
    const attachmentsQuery = `
      SELECT 
        id,
        file_name,
        original_name,
        file_type,
        media_type,
        description,
        is_primary,
        upload_date
      FROM portal_request_attachments
      WHERE request_id = ?
      ORDER BY is_primary DESC, upload_date ASC
    `;

    const [attachments] = await mysql.execute(attachmentsQuery, [id]);

    // Get status history
    const statusHistoryQuery = `
      SELECT 
        old_status,
        new_status,
        change_reason,
        changed_at,
        notes
      FROM portal_request_status_history
      WHERE request_id = ?
      ORDER BY changed_at ASC
    `;

    const [statusHistory] = await mysql.execute(statusHistoryQuery, [id]);

    // Parse material types JSON
    let materialTypes = [];
    if (request.material_types) {
      try {
        materialTypes = JSON.parse(request.material_types);
      } catch (e) {
        materialTypes = [];
      }
    }

    // Build comprehensive request object
    const requestData = {
      id: request.id,
      request_number: request.request_number || `SR-${request.id.substring(0, 8).toUpperCase()}`,
      title: request.title,
      description: request.description,
      request_type: request.type,
      status: request.status,
      priority: request.priority,
      location: {
        address: request.location_address,
        city: request.location_city,
        state: request.location_state,
        zip_code: request.location_zip_code,
        latitude: request.location_latitude,
        longitude: request.location_longitude,
        gate_code: request.gate_code,
        apartment_number: request.apartment_number,
        location_on_property: request.location_on_property,
        access_considerations: request.access_considerations
      },
      items: [], // This would be populated from a separate items table if needed
      scheduling: {
        preferred_date: request.preferred_date,
        preferred_time: request.preferred_time,
        flexible_timing: true, // Default value
        estimated_duration: '2-3 hours' // Default value
      },
      pricing: {
        estimated_cost: 0, // This would come from estimates table
        deposit_required: 0,
        payment_terms: '50% deposit, balance upon completion'
      },
      status_history: statusHistory.map(status => ({
        status: status.new_status,
        timestamp: status.changed_at,
        notes: status.notes
      })),
      attachments: attachments.map(att => ({
        id: att.id,
        filename: att.original_name,
        file_type: att.file_type,
        uploaded: att.upload_date
      })),
      created: request.created_at,
      updated: request.updated_at
    };

    res.json({
      success: true,
      message: 'Service request retrieved successfully',
      data: {
        request: requestData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve service request',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Create new service request
async function createServiceRequest(req, res) {
  try {
    const {
      title,
      description,
      request_type = 'service',
      priority = 'standard',
      location,
      items = [],
      scheduling,
      material_types = [],
      hazardous_material = false,
      hazardous_description,
      oversized_items = false,
      oversized_description,
      heavy_lifting_required = false,
      disassembly_required = false,
      disassembly_description,
      notes
    } = req.body;

    const customerId = req.user.customerId;
    const userId = req.user.userId;

    // Generate request number
    const requestNumber = `SR-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create service request
    const requestId = uuidv4();
    const createRequestQuery = `
      INSERT INTO portal_requests (
        id, customer_id, customer_name, type, priority, status, subject, description,
        requested_date, preferred_date, preferred_time, location_address, location_city,
        location_state, location_zip_code, location_latitude, location_longitude,
        gate_code, apartment_number, location_on_property, access_considerations,
        material_types, hazardous_material, hazardous_description, oversized_items,
        oversized_description, heavy_lifting_required, disassembly_required,
        disassembly_description, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await mysql.execute(createRequestQuery, [
      requestId,
      customerId,
      req.user.company_name || `${req.user.first_name} ${req.user.last_name}`,
      request_type,
      priority,
      title,
      description,
      scheduling.preferred_date,
      scheduling.preferred_time,
      location.address,
      location.city,
      location.state,
      location.zip_code,
      location.latitude || null,
      location.longitude || null,
      location.gate_code || null,
      location.apartment_number || null,
      location.location_on_property || null,
      location.access_considerations || null,
      JSON.stringify(material_types),
      hazardous_material,
      hazardous_description || null,
      oversized_items,
      oversized_description || null,
      heavy_lifting_required,
      disassembly_required,
      disassembly_description || null,
      notes || null,
      userId
    ]);

    // Create initial status history entry
    const statusHistoryQuery = `
      INSERT INTO portal_request_status_history (id, request_id, new_status, change_reason, changed_by)
      VALUES (?, ?, 'pending', 'Request submitted', ?)
    `;

    await mysql.execute(statusHistoryQuery, [uuidv4(), requestId, userId]);

    // Log activity
    const activityQuery = `
      INSERT INTO portal_activity_logs (id, user_id, customer_id, activity_type, description, request_id)
      VALUES (?, ?, ?, 'create_request', 'Service request created: ${title}', ?)
    `;

    await mysql.execute(activityQuery, [uuidv4(), userId, customerId, requestId]);

    res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      data: {
        request_id: requestId,
        request_number: requestNumber,
        status: 'pending',
        estimated_response_time: '24 hours'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service request',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Update service request
async function updateServiceRequest(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const customerId = req.user.customerId;
    const userId = req.user.userId;

    // Check if request exists and belongs to user
    const requestQuery = `
      SELECT id, status FROM portal_requests 
      WHERE id = ? AND customer_id = ?
    `;
    
    const [requests] = await mysql.execute(requestQuery, [id, customerId]);
    
    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
        error: 'SERVICE_REQUEST_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const request = requests[0];

    // Check if request can be updated
    if (['completed', 'cancelled'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed or cancelled requests',
        error: 'INVALID_REQUEST_STATUS',
        timestamp: new Date().toISOString()
      });
    }

    const updatedFields = [];
    const updateValues = [];

    // Build dynamic update query
    if (updateData.title) {
      updatedFields.push('subject = ?');
      updateValues.push(updateData.title);
    }

    if (updateData.description) {
      updatedFields.push('description = ?');
      updateValues.push(updateData.description);
    }

    if (updateData.priority) {
      updatedFields.push('priority = ?');
      updateValues.push(updateData.priority);
    }

    if (updateData.location) {
      if (updateData.location.address) {
        updatedFields.push('location_address = ?');
        updateValues.push(updateData.location.address);
      }
      if (updateData.location.city) {
        updatedFields.push('location_city = ?');
        updateValues.push(updateData.location.city);
      }
      if (updateData.location.state) {
        updatedFields.push('location_state = ?');
        updateValues.push(updateData.location.state);
      }
      if (updateData.location.zip_code) {
        updatedFields.push('location_zip_code = ?');
        updateValues.push(updateData.location.zip_code);
      }
    }

    if (updateData.scheduling) {
      if (updateData.scheduling.preferred_date) {
        updatedFields.push('preferred_date = ?');
        updateValues.push(updateData.scheduling.preferred_date);
      }
      if (updateData.scheduling.preferred_time) {
        updatedFields.push('preferred_time = ?');
        updateValues.push(updateData.scheduling.preferred_time);
      }
    }

    if (updateData.notes) {
      updatedFields.push('notes = ?');
      updateValues.push(updateData.notes);
    }

    if (updatedFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        error: 'NO_UPDATE_FIELDS',
        timestamp: new Date().toISOString()
      });
    }

    // Add updated_at and id to values
    updatedFields.push('updated_at = NOW()');
    updateValues.push(id);

    const updateQuery = `
      UPDATE portal_requests 
      SET ${updatedFields.join(', ')}
      WHERE id = ?
    `;

    await mysql.execute(updateQuery, updateValues);

    // Log activity
    const activityQuery = `
      INSERT INTO portal_activity_logs (id, user_id, customer_id, activity_type, description, request_id)
      VALUES (?, ?, ?, 'edit_request', 'Service request updated', ?)
    `;

    await mysql.execute(activityQuery, [uuidv4(), userId, customerId, id]);

    res.json({
      success: true,
      message: 'Service request updated successfully',
      data: {
        request_id: id,
        updated_fields: updatedFields.filter(field => field !== 'updated_at = NOW()')
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service request',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Cancel service request
async function cancelServiceRequest(req, res) {
  try {
    const { id } = req.params;
    const { cancellation_reason, cancellation_notes } = req.body;
    const customerId = req.user.customerId;
    const userId = req.user.userId;

    // Check if request exists and belongs to user
    const requestQuery = `
      SELECT id, status FROM portal_requests 
      WHERE id = ? AND customer_id = ?
    `;
    
    const [requests] = await mysql.execute(requestQuery, [id, customerId]);
    
    if (requests.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found',
        error: 'SERVICE_REQUEST_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const request = requests[0];

    // Check if request can be cancelled
    if (['completed', 'cancelled'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed or already cancelled requests',
        error: 'INVALID_REQUEST_STATUS',
        timestamp: new Date().toISOString()
      });
    }

    // Update request status to cancelled
    const updateQuery = `
      UPDATE portal_requests 
      SET status = 'cancelled', updated_at = NOW()
      WHERE id = ?
    `;

    await mysql.execute(updateQuery, [id]);

    // Add status history entry
    const statusHistoryQuery = `
      INSERT INTO portal_request_status_history (id, request_id, old_status, new_status, change_reason, changed_by, notes)
      VALUES (?, ?, ?, 'cancelled', ?, ?, ?)
    `;

    await mysql.execute(statusHistoryQuery, [
      uuidv4(),
      id,
      request.status,
      cancellation_reason,
      userId,
      cancellation_notes || null
    ]);

    // Log activity
    const activityQuery = `
      INSERT INTO portal_activity_logs (id, user_id, customer_id, activity_type, description, request_id)
      VALUES (?, ?, ?, 'edit_request', 'Service request cancelled: ${cancellation_reason}', ?)
    `;

    await mysql.execute(activityQuery, [uuidv4(), userId, customerId, id]);

    res.json({
      success: true,
      message: 'Service request cancelled successfully',
      data: {
        request_id: id,
        status: 'cancelled',
        cancellation_date: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error cancelling service request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel service request',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getAllServiceRequests,
  getServiceRequestById,
  createServiceRequest,
  updateServiceRequest,
  cancelServiceRequest
};
