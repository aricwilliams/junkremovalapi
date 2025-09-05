const db = require('../config/database');

// Get all estimates for the authenticated business
const getEstimates = async (req, res, next) => {
  try {
    const businessId = req.user.id;
    const { 
      status, 
      request_priority, 
      is_new_client,
      page = 1, 
      limit = 20, 
      sort_by = 'created_at', 
      sort_order = 'desc' 
    } = req.query;

    // Build WHERE clause
    let whereClause = 'WHERE 1=1'; // No business_id in estimates table, so we'll filter by existing_client_id
    const params = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (request_priority) {
      whereClause += ' AND request_priority = ?';
      params.push(request_priority);
    }

    if (is_new_client !== undefined) {
      whereClause += ' AND is_new_client = ?';
      params.push(is_new_client === 'true');
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM estimates ${whereClause}`;
    const [countResult] = await db.query(countQuery, params);
    const totalItems = countResult[0].total;

    // Get estimates with customer info (if existing client)
    const estimatesQuery = `
      SELECT 
        e.*,
        c.name as existing_customer_name,
        c.email as existing_customer_email,
        c.phone as existing_customer_phone
      FROM estimates e
      LEFT JOIN customers c ON e.existing_client_id = c.id
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
    const estimateId = req.params.id;

    const estimate = await db.query(
      `SELECT 
        e.*,
        c.name as existing_customer_name,
        c.email as existing_customer_email,
        c.phone as existing_customer_phone,
        c.address as existing_customer_address,
        c.city as existing_customer_city,
        c.state as existing_customer_state,
        c.zip_code as existing_customer_zip_code
      FROM estimates e
      LEFT JOIN customers c ON e.existing_client_id = c.id
      WHERE e.id = ?`,
      [estimateId]
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
    const {
      // Client Information
      is_new_client = true,
      existing_client_id = null,
      
      // Basic Contact Information
      full_name,
      phone_number,
      email_address,
      ok_to_text = false,
      
      // Service Address
      service_address,
      gate_code = null,
      apartment_unit = null,
      
      // Project Details
      preferred_date = null,
      preferred_time = null,
      location_on_property,
      approximate_volume,
      access_considerations = null,
      
      // Photos & Media
      photos = null,
      videos = null,
      
      // Item Type & Condition
      material_types,
      approximate_item_count = null,
      items_filled_water = false,
      items_filled_oil_fuel = false,
      hazardous_materials = false,
      items_tied_bags = false,
      oversized_items = false,
      
      // Safety & Hazards
      mold_present = false,
      pests_present = false,
      sharp_objects = false,
      heavy_lifting_required = false,
      disassembly_required = false,
      
      // Additional Information & Services
      additional_notes = null,
      request_donation_pickup = false,
      request_demolition_addon = false,
      
      // Follow-up & Priority
      how_did_you_hear = null,
      request_priority = 'standard',
      
      // System Fields
      status = 'pending',
      quote_amount = null,
      quote_notes = null
    } = req.body;

    // If existing client, verify they exist
    if (existing_client_id) {
      const customer = await db.query(
        'SELECT id FROM customers WHERE id = ?',
        [existing_client_id]
      );

      if (customer.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Existing client not found',
          error: 'CUSTOMER_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }
    }

    const result = await db.query(
      `INSERT INTO estimates (
        is_new_client, existing_client_id, full_name, phone_number, email_address, ok_to_text,
        service_address, gate_code, apartment_unit, preferred_date, preferred_time, 
        location_on_property, approximate_volume, access_considerations, photos, videos,
        material_types, approximate_item_count, items_filled_water, items_filled_oil_fuel,
        hazardous_materials, items_tied_bags, oversized_items, mold_present, pests_present,
        sharp_objects, heavy_lifting_required, disassembly_required, additional_notes,
        request_donation_pickup, request_demolition_addon, how_did_you_hear, request_priority,
        status, quote_amount, quote_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        is_new_client, existing_client_id, full_name, phone_number, email_address, ok_to_text,
        service_address, gate_code, apartment_unit, preferred_date, preferred_time,
        location_on_property, approximate_volume, access_considerations, 
        photos ? JSON.stringify(photos) : null, videos ? JSON.stringify(videos) : null,
        JSON.stringify(material_types), approximate_item_count, items_filled_water, items_filled_oil_fuel,
        hazardous_materials, items_tied_bags, oversized_items, mold_present, pests_present,
        sharp_objects, heavy_lifting_required, disassembly_required, additional_notes,
        request_donation_pickup, request_demolition_addon, how_did_you_hear, request_priority,
        status, quote_amount, quote_notes
      ]
    );

    const newEstimate = await db.query(
      `SELECT 
        e.*,
        c.name as existing_customer_name,
        c.email as existing_customer_email,
        c.phone as existing_customer_phone
      FROM estimates e
      LEFT JOIN customers c ON e.existing_client_id = c.id
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
    const estimateId = req.params.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.created_at;

    // Check if estimate exists
    const existingEstimate = await db.query(
      'SELECT id FROM estimates WHERE id = ?',
      [estimateId]
    );

    if (existingEstimate.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Estimate not found',
        error: 'ESTIMATE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // If existing_client_id is being updated, verify it exists
    if (updateData.existing_client_id) {
      const customer = await db.query(
        'SELECT id FROM customers WHERE id = ?',
        [updateData.existing_client_id]
      );

      if (customer.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Existing client not found',
          error: 'CUSTOMER_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Build dynamic update query
    const allowedFields = [
      'is_new_client', 'existing_client_id', 'full_name', 'phone_number', 'email_address', 'ok_to_text',
      'service_address', 'gate_code', 'apartment_unit', 'preferred_date', 'preferred_time',
      'location_on_property', 'approximate_volume', 'access_considerations', 'photos', 'videos',
      'material_types', 'approximate_item_count', 'items_filled_water', 'items_filled_oil_fuel',
      'hazardous_materials', 'items_tied_bags', 'oversized_items', 'mold_present', 'pests_present',
      'sharp_objects', 'heavy_lifting_required', 'disassembly_required', 'additional_notes',
      'request_donation_pickup', 'request_demolition_addon', 'how_did_you_hear', 'request_priority',
      'status', 'quote_amount', 'quote_notes'
    ];

    const updateFields = [];
    const updateValues = [];

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        
        // Handle JSON fields
        if (key === 'photos' || key === 'videos' || key === 'material_types') {
          updateValues.push(value ? JSON.stringify(value) : null);
        } else {
          updateValues.push(value);
        }
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
        c.name as existing_customer_name,
        c.email as existing_customer_email,
        c.phone as existing_customer_phone
      FROM estimates e
      LEFT JOIN customers c ON e.existing_client_id = c.id
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
    const estimateId = req.params.id;

    // Check if estimate exists
    const existingEstimate = await db.query(
      'SELECT id FROM estimates WHERE id = ?',
      [estimateId]
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