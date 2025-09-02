const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

/**
 * Vehicle Maintenance Controller
 * Handles all vehicle maintenance-related operations for the Fleet Management API
 */

// Helper function to build dynamic WHERE clause for maintenance queries
function buildMaintenanceWhereClause(filters) {
  const conditions = [];
  const params = [];

  if (filters.maintenance_type) {
    conditions.push('vm.maintenance_type = ?');
    params.push(filters.maintenance_type);
  }

  if (filters.status) {
    conditions.push('vm.status = ?');
    params.push(filters.status);
  }

  if (filters.priority) {
    conditions.push('vm.priority = ?');
    params.push(filters.priority);
  }

  if (filters.date_from) {
    conditions.push('vm.scheduled_date >= ?');
    params.push(filters.date_from);
  }

  if (filters.date_to) {
    conditions.push('vm.scheduled_date <= ?');
    params.push(filters.date_to);
  }

  if (filters.performed_by) {
    conditions.push('vm.performed_by = ?');
    params.push(filters.performed_by);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

/**
 * Get all maintenance records for a specific vehicle
 */
async function getVehicleMaintenance(req, res) {
  try {
    const { id } = req.params;
    const {
      maintenance_type,
      status,
      priority,
      date_from,
      date_to,
      performed_by
    } = req.query;

    // Check if vehicle exists
    const [existingVehicles] = await db.execute(
      'SELECT id FROM vehicles WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingVehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        error: 'VEHICLE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const filters = { maintenance_type, status, priority, date_from, date_to, performed_by };
    const { whereClause, params } = buildMaintenanceWhereClause(filters);

    // Get maintenance records
    const maintenanceQuery = `
      SELECT 
        vm.id,
        vm.maintenance_type,
        vm.priority,
        vm.status,
        vm.title,
        vm.description,
        vm.scheduled_date,
        vm.completed_date,
        vm.scheduled_mileage,
        vm.completed_mileage,
        vm.estimated_cost,
        vm.actual_cost,
        vm.labor_hours,
        vm.labor_rate,
        vm.parts_cost,
        vm.performed_by,
        vm.performed_by_name,
        vm.service_location,
        vm.next_service_date,
        vm.next_service_mileage,
        vm.warranty_expiry,
        vm.notes,
        vm.created_at,
        vm.updated_at
      FROM vehicle_maintenance vm
      WHERE vm.vehicle_id = ? ${whereClause ? 'AND ' + whereClause.replace('WHERE ', '') : ''}
      ORDER BY vm.scheduled_date DESC, vm.created_at DESC
    `;

    const [maintenanceRecords] = await db.execute(maintenanceQuery, [id, ...params]);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN status = 'completed' THEN actual_cost ELSE 0 END) as total_cost,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_count,
        SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_count,
        MAX(CASE WHEN status = 'completed' THEN completed_date END) as last_maintenance,
        MIN(CASE WHEN status = 'scheduled' THEN scheduled_date END) as next_scheduled
      FROM vehicle_maintenance
      WHERE vehicle_id = ?
    `;

    const [summaryResult] = await db.execute(summaryQuery, [id]);
    const summary = summaryResult[0];

    res.json({
      success: true,
      message: 'Vehicle maintenance records retrieved successfully',
      data: {
        vehicle_id: id,
        maintenance_records: maintenanceRecords,
        summary
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting vehicle maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicle maintenance records',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Create a new maintenance record for a vehicle
 */
async function createMaintenanceRecord(req, res) {
  try {
    const { id } = req.params;
    const maintenanceData = req.body;
    const maintenanceId = uuidv4();

    // Check if vehicle exists
    const [existingVehicles] = await db.execute(
      'SELECT id FROM vehicles WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingVehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        error: 'VEHICLE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Insert maintenance record
    const insertQuery = `
      INSERT INTO vehicle_maintenance (
        id, vehicle_id, maintenance_type, priority, status, title, description,
        scheduled_date, completed_date, scheduled_mileage, completed_mileage,
        estimated_cost, actual_cost, labor_hours, labor_rate, parts_cost,
        performed_by, performed_by_name, service_location, next_service_date,
        next_service_mileage, warranty_expiry, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      maintenanceId,
      id,
      maintenanceData.maintenance_type,
      maintenanceData.priority || 'medium',
      maintenanceData.status || 'scheduled',
      maintenanceData.title,
      maintenanceData.description,
      maintenanceData.scheduled_date || null,
      maintenanceData.completed_date || null,
      maintenanceData.scheduled_mileage || null,
      maintenanceData.completed_mileage || null,
      maintenanceData.estimated_cost || null,
      maintenanceData.actual_cost || null,
      maintenanceData.labor_hours || null,
      maintenanceData.labor_rate || null,
      maintenanceData.parts_cost || null,
      maintenanceData.performed_by || null,
      maintenanceData.performed_by_name || null,
      maintenanceData.service_location || null,
      maintenanceData.next_service_date || null,
      maintenanceData.next_service_mileage || null,
      maintenanceData.warranty_expiry || null,
      maintenanceData.notes || null
    ];

    await db.execute(insertQuery, insertParams);

    // Update vehicle status if maintenance is in-progress or completed
    if (maintenanceData.status === 'in-progress' || maintenanceData.status === 'completed') {
      await db.execute(
        'UPDATE vehicles SET status = "maintenance", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    }

    // Get created maintenance record
    const [maintenanceRecords] = await db.execute(
      'SELECT id, maintenance_type, status, title, created_at FROM vehicle_maintenance WHERE id = ?',
      [maintenanceId]
    );

    res.status(201).json({
      success: true,
      message: 'Maintenance record created successfully',
      data: {
        maintenance_id: maintenanceId,
        vehicle_id: id,
        maintenance_type: maintenanceData.maintenance_type,
        status: maintenanceData.status || 'scheduled'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating maintenance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create maintenance record',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update an existing maintenance record
 */
async function updateMaintenanceRecord(req, res) {
  try {
    const { id, maintenanceId } = req.params;
    const updateData = req.body;

    // Check if vehicle exists
    const [existingVehicles] = await db.execute(
      'SELECT id FROM vehicles WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingVehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        error: 'VEHICLE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Check if maintenance record exists
    const [existingMaintenance] = await db.execute(
      'SELECT id, status FROM vehicle_maintenance WHERE id = ? AND vehicle_id = ?',
      [maintenanceId, id]
    );

    if (existingMaintenance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found',
        error: 'MAINTENANCE_RECORD_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Build dynamic UPDATE query
    const updateFields = [];
    const updateParams = [];

    const allowedFields = [
      'maintenance_type', 'priority', 'status', 'title', 'description',
      'scheduled_date', 'completed_date', 'scheduled_mileage', 'completed_mileage',
      'estimated_cost', 'actual_cost', 'labor_hours', 'labor_rate', 'parts_cost',
      'performed_by', 'performed_by_name', 'service_location', 'next_service_date',
      'next_service_mileage', 'warranty_expiry', 'notes'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateParams.push(updateData[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        error: 'NO_UPDATE_FIELDS',
        timestamp: new Date().toISOString()
      });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateParams.push(maintenanceId);

    const updateQuery = `UPDATE vehicle_maintenance SET ${updateFields.join(', ')} WHERE id = ?`;
    await db.execute(updateQuery, updateParams);

    // Update vehicle status based on maintenance status
    if (updateData.status) {
      let vehicleStatus = 'available';
      
      if (updateData.status === 'in-progress') {
        vehicleStatus = 'maintenance';
      } else if (updateData.status === 'scheduled') {
        // Check if there are other in-progress maintenance records
        const [otherMaintenance] = await db.execute(
          'SELECT COUNT(*) as count FROM vehicle_maintenance WHERE vehicle_id = ? AND status = "in-progress"',
          [id]
        );
        
        if (otherMaintenance[0].count === 0) {
          vehicleStatus = 'available';
        } else {
          vehicleStatus = 'maintenance';
        }
      }

      await db.execute(
        'UPDATE vehicles SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [vehicleStatus, id]
      );
    }

    // Get updated maintenance record
    const [maintenanceRecords] = await db.execute(
      'SELECT id, maintenance_type, status, title, updated_at FROM vehicle_maintenance WHERE id = ?',
      [maintenanceId]
    );

    res.json({
      success: true,
      message: 'Maintenance record updated successfully',
      data: {
        maintenance_id: maintenanceId,
        status: updateData.status || existingMaintenance[0].status,
        updated_fields: Object.keys(updateData)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating maintenance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update maintenance record',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Delete a maintenance record
 */
async function deleteMaintenanceRecord(req, res) {
  try {
    const { id, maintenanceId } = req.params;

    // Check if vehicle exists
    const [existingVehicles] = await db.execute(
      'SELECT id FROM vehicles WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingVehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        error: 'VEHICLE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Check if maintenance record exists
    const [existingMaintenance] = await db.execute(
      'SELECT id, status FROM vehicle_maintenance WHERE id = ? AND vehicle_id = ?',
      [maintenanceId, id]
    );

    if (existingMaintenance.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found',
        error: 'MAINTENANCE_RECORD_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Check if maintenance record is in progress
    if (existingMaintenance[0].status === 'in-progress') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete maintenance record that is in progress',
        error: 'MAINTENANCE_IN_PROGRESS',
        timestamp: new Date().toISOString()
      });
    }

    // Delete maintenance record
    await db.execute('DELETE FROM vehicle_maintenance WHERE id = ?', [maintenanceId]);

    // Check if vehicle status should be updated
    const [otherMaintenance] = await db.execute(
      'SELECT COUNT(*) as count FROM vehicle_maintenance WHERE vehicle_id = ? AND status = "in-progress"',
      [id]
    );

    if (otherMaintenance[0].count === 0) {
      await db.execute(
        'UPDATE vehicles SET status = "available", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    }

    res.json({
      success: true,
      message: 'Maintenance record deleted successfully',
      data: {
        maintenance_id: maintenanceId,
        vehicle_id: id
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete maintenance record',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get maintenance record by ID
 */
async function getMaintenanceRecordById(req, res) {
  try {
    const { id, maintenanceId } = req.params;

    // Check if vehicle exists
    const [existingVehicles] = await db.execute(
      'SELECT id FROM vehicles WHERE id = ? AND is_active = TRUE',
      [id]
    );

    if (existingVehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        error: 'VEHICLE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Get maintenance record with items and attachments
    const maintenanceQuery = `
      SELECT 
        vm.*,
        v.name as vehicle_name,
        v.make,
        v.model,
        v.license_plate
      FROM vehicle_maintenance vm
      JOIN vehicles v ON vm.vehicle_id = v.id
      WHERE vm.id = ? AND vm.vehicle_id = ?
    `;

    const [maintenanceRecords] = await db.execute(maintenanceQuery, [maintenanceId, id]);

    if (maintenanceRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance record not found',
        error: 'MAINTENANCE_RECORD_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const maintenance = maintenanceRecords[0];

    // Get maintenance items
    const itemsQuery = `
      SELECT 
        id, item_name, item_type, part_number, manufacturer,
        quantity, unit_cost, total_cost, warranty_months, notes
      FROM vehicle_maintenance_items
      WHERE maintenance_id = ?
      ORDER BY created_at
    `;

    const [maintenanceItems] = await db.execute(itemsQuery, [maintenanceId]);

    // Get maintenance attachments
    const attachmentsQuery = `
      SELECT 
        id, file_name, file_path, file_size, file_type, description, uploaded_by
      FROM vehicle_maintenance_attachments
      WHERE maintenance_id = ?
      ORDER BY created_at
    `;

    const [maintenanceAttachments] = await db.execute(attachmentsQuery, [maintenanceId]);

    // Format response
    const response = {
      ...maintenance,
      items: maintenanceItems,
      attachments: maintenanceAttachments
    };

    res.json({
      success: true,
      message: 'Maintenance record retrieved successfully',
      data: { maintenance: response },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting maintenance record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve maintenance record',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getVehicleMaintenance,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  getMaintenanceRecordById
};
