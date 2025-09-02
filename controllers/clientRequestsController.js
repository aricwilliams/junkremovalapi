const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const { getConnection } = require('../config/database');

/**
 * Client Requests Controller
 * Handles all client request operations
 */

// Helper function to build WHERE clause for filtering
function buildClientRequestWhereClause(filters) {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push(`(cr.customer_name LIKE ? OR cr.customer_email LIKE ? OR cr.phone LIKE ?)`);
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (filters.status) {
    conditions.push('cr.status = ?');
    params.push(filters.status);
  }

  if (filters.type) {
    conditions.push('cr.type = ?');
    params.push(filters.type);
  }

  if (filters.priority) {
    conditions.push('cr.priority = ?');
    params.push(filters.priority);
  }

  if (filters.date_from) {
    conditions.push('cr.created_at >= ?');
    params.push(filters.date_from);
  }

  if (filters.date_to) {
    conditions.push('cr.created_at <= ?');
    params.push(filters.date_to);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

// Helper function to build ORDER BY clause
function buildClientRequestOrderClause(sortBy, sortOrder) {
  const validSortFields = {
    'created_at': 'cr.created_at',
    'requested_date': 'cr.requested_date',
    'priority': 'cr.priority',
    'status': 'cr.status',
    'customer_name': 'cr.customer_name'
  };

  const field = validSortFields[sortBy] || 'cr.created_at';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  return `ORDER BY ${field} ${order}`;
}

/**
 * Get all client requests with filtering, sorting, and pagination
 */
async function getAllClientRequests(req, res) {
  try {
    const connection = await getConnection();
    
    const {
      page = 1,
      limit = 20,
      search,
      status,
      type,
      priority,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const filters = { search, status, type, priority, date_from, date_to };
    
    const { whereClause, params } = buildClientRequestWhereClause(filters);
    const orderClause = buildClientRequestOrderClause(sort_by, sort_order);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM client_requests cr
      ${whereClause}
    `;
    
    const [countResult] = await connection.execute(countQuery, params);
    const total = countResult[0].total;

    // Get client requests
    const query = `
      SELECT 
        cr.id,
        cr.customer_id,
        cr.customer_name,
        cr.full_name,
        cr.phone,
        cr.email,
        cr.type,
        cr.priority,
        cr.status,
        cr.subject,
        cr.description,
        cr.requested_date,
        cr.preferred_date,
        cr.preferred_time,
        cr.service_address,
        cr.city,
        cr.state,
        cr.zip_code,
        cr.country,
        cr.location_on_property,
        cr.approximate_volume,
        cr.approximate_item_count,
        cr.gate_code,
        cr.apartment_number,
        cr.access_considerations,
        cr.material_types,
        cr.hazardous_material,
        cr.hazardous_description,
        cr.has_mold,
        cr.has_pests,
        cr.has_sharp_objects,
        cr.heavy_lifting_required,
        cr.disassembly_required,
        cr.disassembly_description,
        cr.filled_with_water,
        cr.filled_with_oil,
        cr.items_in_bags,
        cr.bag_contents,
        cr.oversized_items,
        cr.oversized_description,
        cr.request_donation_pickup,
        cr.request_demolition,
        cr.demolition_description,
        cr.text_opt_in,
        cr.how_did_you_hear,
        cr.additional_notes,
        cr.attachments,
        cr.notes,
        cr.can_create_estimate,
        cr.estimate_status,
        cr.estimate_id,
        cr.volume_weight,
        cr.volume_yardage,
        cr.created_at,
        cr.updated_at
      FROM client_requests cr
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const [clientRequests] = await connection.execute(query, [...params, parseInt(limit), offset]);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
        SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as in_progress_requests,
        SUM(CASE WHEN status = 'quoted' THEN 1 ELSE 0 END) as quoted_requests,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_requests,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_requests,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_requests
      FROM client_requests
      ${whereClause}
    `;

    const [summaryResult] = await connection.execute(summaryQuery, params);
    const summary = summaryResult[0];

    // Calculate total potential value (if available)
    const totalPotentialValue = 0; // This would need to be calculated based on business logic

    const response = {
      success: true,
      message: 'Client requests retrieved successfully',
      data: {
        client_requests: clientRequests.map(cr => ({
          id: cr.id,
          customer_name: cr.customer_name,
          customer_email: cr.email,
          customer_phone: cr.phone,
          service_type: cr.type,
          status: cr.status,
          priority: cr.priority,
          location: `${cr.service_address}, ${cr.city}, ${cr.state}`,
          estimated_value: totalPotentialValue / total, // Placeholder
          requested_date: cr.requested_date,
          created: cr.created_at,
          assigned_to: null // Would need to be added if assignment tracking is implemented
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        summary: {
          total_requests: summary.total_requests,
          pending_requests: summary.pending_requests,
          in_progress_requests: summary.in_progress_requests,
          quoted_requests: summary.quoted_requests,
          scheduled_requests: summary.scheduled_requests,
          completed_requests: summary.completed_requests,
          total_potential_value: totalPotentialValue
        }
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting client requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve client requests',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get client request by ID
 */
async function getClientRequestById(req, res) {
  try {
    const { id } = req.params;
    const connection = await getConnection();

    const query = `
      SELECT 
        cr.*,
        e.id as estimate_id,
        e.status as estimate_status,
        e.total as estimate_total
      FROM client_requests cr
      LEFT JOIN estimates e ON cr.estimate_id = e.id
      WHERE cr.id = ?
    `;

    const [results] = await connection.execute(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client request not found',
        error: 'CLIENT_REQUEST_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const clientRequest = results[0];

    // Parse JSON fields
    if (clientRequest.material_types) {
      try {
        clientRequest.material_types = JSON.parse(clientRequest.material_types);
      } catch (e) {
        clientRequest.material_types = [];
      }
    }

    if (clientRequest.attachments) {
      try {
        clientRequest.attachments = JSON.parse(clientRequest.attachments);
      } catch (e) {
        clientRequest.attachments = [];
      }
    }

    const response = {
      success: true,
      message: 'Client request retrieved successfully',
      data: {
        client_request: {
          id: clientRequest.id,
          customer_name: clientRequest.customer_name,
          customer_email: clientRequest.email,
          customer_phone: clientRequest.phone,
          client_address: `${clientRequest.service_address}, ${clientRequest.city}, ${clientRequest.state} ${clientRequest.zip_code}`,
          service_type: clientRequest.type,
          status: clientRequest.status,
          priority: clientRequest.priority,
          location: {
            street: clientRequest.service_address,
            city: clientRequest.city,
            state: clientRequest.state,
            zip_code: clientRequest.zip_code
          },
          project_details: {
            description: clientRequest.description,
            approximate_volume: clientRequest.approximate_volume,
            approximate_item_count: clientRequest.approximate_item_count,
            location_on_property: clientRequest.location_on_property,
            access_considerations: clientRequest.access_considerations,
            material_types: clientRequest.material_types || [],
            hazardous_material: clientRequest.hazardous_material,
            hazardous_description: clientRequest.hazardous_description,
            has_mold: clientRequest.has_mold,
            has_pests: clientRequest.has_pests,
            has_sharp_objects: clientRequest.has_sharp_objects,
            heavy_lifting_required: clientRequest.heavy_lifting_required,
            disassembly_required: clientRequest.disassembly_required,
            disassembly_description: clientRequest.disassembly_description,
            filled_with_water: clientRequest.filled_with_water,
            filled_with_oil: clientRequest.filled_with_oil,
            items_in_bags: clientRequest.items_in_bags,
            bag_contents: clientRequest.bag_contents,
            oversized_items: clientRequest.oversized_items,
            oversized_description: clientRequest.oversized_description,
            request_donation_pickup: clientRequest.request_donation_pickup,
            request_demolition: clientRequest.request_demolition,
            demolition_description: clientRequest.demolition_description
          },
          timeline: {
            requested_date: clientRequest.requested_date,
            preferred_date: clientRequest.preferred_date,
            preferred_time: clientRequest.preferred_time,
            urgency: clientRequest.priority
          },
          budget: {
            estimated_value: null, // Would need to be calculated
            budget_range: null, // Would need to be added to schema
            payment_method: null // Would need to be added to schema
          },
          photos: clientRequest.attachments || [],
          notes: clientRequest.notes || clientRequest.additional_notes,
          assigned_to: null, // Would need to be added if assignment tracking is implemented
          assigned_to_name: null,
          created: clientRequest.created_at,
          updated: clientRequest.updated_at
        }
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting client request by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve client request',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Create new client request
 */
async function createClientRequest(req, res) {
  try {
    const connection = await getConnection();
    const requestId = uuidv4();
    
    const {
      customer_name,
      customer_email,
      customer_phone,
      service_address,
      city,
      state,
      zip_code,
      country = 'USA',
      type = 'service',
      priority = 'medium',
      subject,
      description,
      requested_date,
      preferred_date,
      preferred_time,
      location_on_property,
      approximate_volume,
      approximate_item_count,
      gate_code,
      apartment_number,
      access_considerations,
      material_types,
      hazardous_material = false,
      hazardous_description,
      has_mold = false,
      has_pests = false,
      has_sharp_objects = false,
      heavy_lifting_required = false,
      disassembly_required = false,
      disassembly_description,
      filled_with_water = false,
      filled_with_oil = false,
      items_in_bags = false,
      bag_contents,
      oversized_items = false,
      oversized_description,
      request_donation_pickup = false,
      request_demolition = false,
      demolition_description,
      text_opt_in = false,
      how_did_you_hear,
      additional_notes,
      attachments
    } = req.body;

    const query = `
      INSERT INTO client_requests (
        id, customer_name, email, phone, service_address, city, state, zip_code, country,
        type, priority, subject, description, requested_date, preferred_date, preferred_time,
        location_on_property, approximate_volume, approximate_item_count, gate_code,
        apartment_number, access_considerations, material_types, hazardous_material,
        hazardous_description, has_mold, has_pests, has_sharp_objects, heavy_lifting_required,
        disassembly_required, disassembly_description, filled_with_water, filled_with_oil,
        items_in_bags, bag_contents, oversized_items, oversized_description,
        request_donation_pickup, request_demolition, demolition_description, text_opt_in,
        how_did_you_hear, additional_notes, attachments
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      requestId, customer_name, customer_email, customer_phone, service_address,
      city, state, zip_code, country, type, priority, subject, description,
      requested_date, preferred_date, preferred_time, location_on_property,
      approximate_volume, approximate_item_count, gate_code, apartment_number,
      access_considerations, JSON.stringify(material_types || []), hazardous_material,
      hazardous_description, has_mold, has_pests, has_sharp_objects, heavy_lifting_required,
      disassembly_required, disassembly_description, filled_with_water, filled_with_oil,
      items_in_bags, bag_contents, oversized_items, oversized_description,
      request_donation_pickup, request_demolition, demolition_description, text_opt_in,
      how_did_you_hear, additional_notes, JSON.stringify(attachments || [])
    ];

    await connection.execute(query, params);

    const response = {
      success: true,
      message: 'Client request created successfully',
      data: {
        request_id: requestId,
        client_request: {
          id: requestId,
          customer_name,
          service_type: type,
          status: 'pending',
          created: new Date().toISOString()
        }
      },
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Error creating client request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create client request',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update client request
 */
async function updateClientRequest(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const connection = await getConnection();

    // Check if client request exists
    const checkQuery = 'SELECT id FROM client_requests WHERE id = ?';
    const [checkResult] = await connection.execute(checkQuery, [id]);

    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client request not found',
        error: 'CLIENT_REQUEST_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Build dynamic UPDATE query
    const updateFields = [];
    const params = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null) {
        if (key === 'material_types' || key === 'attachments') {
          updateFields.push(`${key} = ?`);
          params.push(JSON.stringify(updateData[key]));
        } else {
          updateFields.push(`${key} = ?`);
          params.push(updateData[key]);
        }
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

    const query = `UPDATE client_requests SET ${updateFields.join(', ')} WHERE id = ?`;
    await connection.execute(query, params);

    const response = {
      success: true,
      message: 'Client request updated successfully',
      data: {
        request_id: id,
        updated_fields: Object.keys(updateData).filter(key => updateData[key] !== undefined && updateData[key] !== null)
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error updating client request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update client request',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Delete client request (soft delete - sets status to 'cancelled')
 */
async function deleteClientRequest(req, res) {
  try {
    const { id } = req.params;
    const connection = await getConnection();

    // Check if client request exists
    const checkQuery = 'SELECT id FROM client_requests WHERE id = ?';
    const [checkResult] = await connection.execute(checkQuery, [id]);

    if (checkResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Client request not found',
        error: 'CLIENT_REQUEST_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Soft delete by setting status to 'cancelled'
    const query = 'UPDATE client_requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await connection.execute(query, ['cancelled', id]);

    const response = {
      success: true,
      message: 'Client request deleted successfully',
      data: {
        request_id: id,
        status: 'cancelled'
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error deleting client request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete client request',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getAllClientRequests,
  getClientRequestById,
  createClientRequest,
  updateClientRequest,
  deleteClientRequest
};
