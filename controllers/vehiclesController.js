const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

/**
 * Vehicles Controller
 * Handles all vehicle-related operations for the Fleet Management API
 */

// Helper function to build dynamic WHERE clause for vehicle queries
function buildVehicleWhereClause(filters) {
  const conditions = [];
  const params = [];

  if (filters.search) {
    conditions.push('(v.name LIKE ? OR v.make LIKE ? OR v.model LIKE ? OR v.license_plate LIKE ?)');
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (filters.status) {
    conditions.push('v.status = ?');
    params.push(filters.status);
  }

  if (filters.vehicle_type) {
    conditions.push('v.vehicle_type = ?');
    params.push(filters.vehicle_type);
  }

  if (filters.assigned_crew_id) {
    conditions.push('v.assigned_crew_id = ?');
    params.push(filters.assigned_crew_id);
  }

  if (filters.assigned_job_id) {
    conditions.push('v.assigned_job_id = ?');
    params.push(filters.assigned_job_id);
  }

  if (filters.date_from) {
    conditions.push('v.created_at >= ?');
    params.push(filters.date_from);
  }

  if (filters.date_to) {
    conditions.push('v.created_at <= ?');
    params.push(filters.date_to);
  }

  conditions.push('v.is_active = TRUE');

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

// Helper function to build ORDER BY clause
function buildVehicleOrderClause(sortBy, sortOrder) {
  const validSortFields = {
    'created_at': 'v.created_at',
    'name': 'v.name',
    'make': 'v.make',
    'model': 'v.model',
    'year': 'v.year',
    'status': 'v.status',
    'mileage': 'v.mileage'
  };

  const field = validSortFields[sortBy] || 'v.created_at';
  const order = sortOrder === 'asc' ? 'ASC' : 'DESC';

  return `ORDER BY ${field} ${order}`;
}

/**
 * Get all vehicles with filtering, sorting, and pagination
 */
async function getAllVehicles(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      vehicle_type,
      assigned_crew_id,
      assigned_job_id,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const filters = { search, status, vehicle_type, assigned_crew_id, assigned_job_id, date_from, date_to };
    
    const { whereClause, params } = buildVehicleWhereClause(filters);
    const orderClause = buildVehicleOrderClause(sort_by, sort_order);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM vehicles v
      ${whereClause}
    `;
    
    const [countResult] = await db.execute(countQuery, params);
    const total = countResult[0].total;

    // Get vehicles with pagination
    const vehiclesQuery = `
      SELECT 
        v.id,
        v.name,
        v.license_plate,
        v.vin,
        v.make,
        v.model,
        v.year,
        v.vehicle_type,
        v.status,
        v.capacity_weight,
        v.capacity_volume,
        v.capacity_units,
        v.volume_units,
        v.fuel_type,
        v.fuel_capacity,
        v.fuel_capacity_units,
        v.current_fuel_level,
        v.mileage,
        v.mileage_units,
        v.last_service_date,
        v.next_service_date,
        v.last_service_mileage,
        v.next_service_mileage,
        v.assigned_crew_id,
        v.assigned_job_id,
        v.current_location_lat,
        v.current_location_lng,
        v.current_location_address,
        v.notes,
        v.created_at,
        v.updated_at
      FROM vehicles v
      ${whereClause}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const [vehicles] = await db.execute(vehiclesQuery, [...params, parseInt(limit), offset]);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as active_vehicles,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_vehicles,
        SUM(CASE WHEN status = 'retired' THEN 1 ELSE 0 END) as retired_vehicles,
        SUM(CASE WHEN status = 'out-of-service' THEN 1 ELSE 0 END) as out_of_service_vehicles
      FROM vehicles
      WHERE is_active = TRUE
    `;

    const [summaryResult] = await db.execute(summaryQuery);
    const summary = summaryResult[0];

    // Calculate total pages
    const pages = Math.ceil(total / limit);

    res.json({
      success: true,
      message: 'Vehicles retrieved successfully',
      data: {
        vehicles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages
        },
        summary
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicles',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get vehicle by ID with all related information
 */
async function getVehicleById(req, res) {
  try {
    const { id } = req.params;

    // Get vehicle details
    const vehicleQuery = `
      SELECT 
        v.*,
        vi.policy_number,
        vi.insurance_company,
        vi.coverage_amount,
        vi.expiry_date as insurance_expiry,
        vr.registration_number,
        vr.expiry_date as registration_expiry
      FROM vehicles v
      LEFT JOIN vehicle_insurance vi ON v.id = vi.vehicle_id AND vi.is_active = TRUE
      LEFT JOIN vehicle_registration vr ON v.id = vr.vehicle_id AND vr.is_active = TRUE
      WHERE v.id = ? AND v.is_active = TRUE
    `;

    const [vehicles] = await db.execute(vehicleQuery, [id]);

    if (vehicles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found',
        error: 'VEHICLE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const vehicle = vehicles[0];

    // Get recent maintenance records
    const maintenanceQuery = `
      SELECT 
        id,
        maintenance_type,
        title,
        description,
        scheduled_date,
        completed_date,
        scheduled_mileage,
        completed_mileage,
        estimated_cost,
        actual_cost,
        status,
        priority,
        performed_by_name,
        created_at
      FROM vehicle_maintenance
      WHERE vehicle_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `;

    const [maintenanceRecords] = await db.execute(maintenanceQuery, [id]);

    // Get recent fuel logs
    const fuelQuery = `
      SELECT 
        id,
        fuel_date,
        fuel_type,
        fuel_quantity,
        fuel_quantity_units,
        fuel_cost_per_unit,
        total_fuel_cost,
        odometer_reading,
        fuel_station,
        driver_name,
        created_at
      FROM vehicle_fuel_logs
      WHERE vehicle_id = ?
      ORDER BY fuel_date DESC
      LIMIT 5
    `;

    const [fuelLogs] = await db.execute(fuelQuery, [id]);

    // Get recent inspections
    const inspectionQuery = `
      SELECT 
        id,
        inspection_type,
        inspection_date,
        overall_condition,
        passed_inspection,
        odometer_reading,
        inspector_name,
        created_at
      FROM vehicle_inspections
      WHERE vehicle_id = ?
      ORDER BY inspection_date DESC
      LIMIT 5
    `;

    const [inspections] = await db.execute(inspectionQuery, [id]);

    // Get current assignment
    const assignmentQuery = `
      SELECT 
        va.crew_id,
        va.job_id,
        va.assignment_type,
        va.start_date,
        va.status
      FROM vehicle_assignments va
      WHERE va.vehicle_id = ? AND va.status = 'active'
      ORDER BY va.start_date DESC
      LIMIT 1
    `;

    const [assignments] = await db.execute(assignmentQuery, [id]);

    // Format response
    const response = {
      id: vehicle.id,
      name: vehicle.name,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      license_plate: vehicle.license_plate,
      vin: vehicle.vin,
      vehicle_type: vehicle.vehicle_type,
      status: vehicle.status,
      specifications: {
        capacity_weight: vehicle.capacity_weight,
        capacity_volume: vehicle.capacity_volume,
        capacity_units: vehicle.capacity_units,
        volume_units: vehicle.volume_units,
        fuel_type: vehicle.fuel_type,
        fuel_capacity: vehicle.fuel_capacity,
        fuel_capacity_units: vehicle.fuel_capacity_units
      },
      location: {
        current_location: vehicle.current_location_address,
        coordinates: vehicle.current_location_lat && vehicle.current_location_lng ? {
          latitude: vehicle.current_location_lat,
          longitude: vehicle.current_location_lng
        } : null,
        last_updated: vehicle.updated_at
      },
      operational_data: {
        fuel_level: vehicle.current_fuel_level,
        mileage: vehicle.mileage,
        mileage_units: vehicle.mileage_units,
        last_service: vehicle.last_service_date,
        next_service: vehicle.next_service_date
      },
      maintenance: {
        maintenance_schedule: vehicle.next_service_mileage ? `every_${vehicle.next_service_mileage}_miles` : null,
        last_maintenance_mileage: vehicle.last_service_mileage,
        next_maintenance_mileage: vehicle.next_service_mileage,
        maintenance_history: maintenanceRecords
      },
      insurance: {
        policy_number: vehicle.policy_number,
        provider: vehicle.insurance_company,
        coverage_amount: vehicle.coverage_amount,
        expiration_date: vehicle.insurance_expiry,
        is_active: !!vehicle.policy_number
      },
      registration: {
        registration_number: vehicle.registration_number,
        expiration_date: vehicle.registration_expiry,
        is_active: !!vehicle.registration_number
      },
      current_assignment: assignments.length > 0 ? assignments[0] : null,
      recent_activity: {
        fuel_logs: fuelLogs,
        inspections: inspections
      },
      created: vehicle.created_at,
      updated: vehicle.updated_at
    };

    res.json({
      success: true,
      message: 'Vehicle retrieved successfully',
      data: { vehicle: response },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicle',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Create a new vehicle
 */
async function createVehicle(req, res) {
  try {
    const vehicleData = req.body;
    const vehicleId = uuidv4();

    // Insert vehicle
    const insertQuery = `
      INSERT INTO vehicles (
        id, name, license_plate, vin, make, model, year, vehicle_type,
        capacity_weight, capacity_volume, capacity_units, volume_units,
        fuel_type, fuel_capacity, fuel_capacity_units, current_fuel_level,
        mileage, mileage_units, last_service_date, next_service_date,
        last_service_mileage, next_service_mileage, assigned_crew_id,
        assigned_job_id, current_location_lat, current_location_lng,
        current_location_address, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      vehicleId,
      vehicleData.name,
      vehicleData.license_plate,
      vehicleData.vin || null,
      vehicleData.make,
      vehicleData.model,
      vehicleData.year,
      vehicleData.vehicle_type || 'truck',
      vehicleData.capacity_weight || null,
      vehicleData.capacity_volume || null,
      vehicleData.capacity_units || 'lbs',
      vehicleData.volume_units || 'yds³',
      vehicleData.fuel_type || 'gasoline',
      vehicleData.fuel_capacity || null,
      vehicleData.fuel_capacity_units || 'gallons',
      vehicleData.current_fuel_level || null,
      vehicleData.mileage || 0,
      vehicleData.mileage_units || 'miles',
      vehicleData.last_service_date || null,
      vehicleData.next_service_date || null,
      vehicleData.last_service_mileage || null,
      vehicleData.next_service_mileage || null,
      vehicleData.assigned_crew_id || null,
      vehicleData.assigned_job_id || null,
      vehicleData.current_location_lat || null,
      vehicleData.current_location_lng || null,
      vehicleData.current_location_address || null,
      vehicleData.notes || null
    ];

    await db.execute(insertQuery, insertParams);

    // Get created vehicle
    const [vehicles] = await db.execute(
      'SELECT id, name, make, model, status, created_at FROM vehicles WHERE id = ?',
      [vehicleId]
    );

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: {
        vehicle_id: vehicleId,
        vehicle: vehicles[0]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating vehicle:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Vehicle with this license plate or VIN already exists',
        error: 'DUPLICATE_VEHICLE',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create vehicle',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update an existing vehicle
 */
async function updateVehicle(req, res) {
  try {
    const { id } = req.params;
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

    // Build dynamic UPDATE query
    const updateFields = [];
    const updateParams = [];

    const allowedFields = [
      'name', 'license_plate', 'vin', 'make', 'model', 'year', 'vehicle_type',
      'status', 'capacity_weight', 'capacity_volume', 'capacity_units', 'volume_units',
      'fuel_type', 'fuel_capacity', 'fuel_capacity_units', 'current_fuel_level',
      'mileage', 'mileage_units', 'last_service_date', 'next_service_date',
      'last_service_mileage', 'next_service_mileage', 'assigned_crew_id',
      'assigned_job_id', 'current_location_lat', 'current_location_lng',
      'current_location_address', 'notes'
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
    updateParams.push(id);

    const updateQuery = `UPDATE vehicles SET ${updateFields.join(', ')} WHERE id = ?`;
    await db.execute(updateQuery, updateParams);

    // Get updated vehicle
    const [vehicles] = await db.execute(
      'SELECT id, name, make, model, status, updated_at FROM vehicles WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: {
        vehicle_id: id,
        updated_fields: Object.keys(updateData),
        vehicle: vehicles[0]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating vehicle:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Vehicle with this license plate or VIN already exists',
        error: 'DUPLICATE_VEHICLE',
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Delete a vehicle (soft delete - sets status to 'retired')
 */
async function deleteVehicle(req, res) {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const [existingVehicles] = await db.execute(
      'SELECT id, status FROM vehicles WHERE id = ? AND is_active = TRUE',
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

    // Check if vehicle is currently assigned
    const [assignments] = await db.execute(
      'SELECT id FROM vehicle_assignments WHERE vehicle_id = ? AND status = "active"',
      [id]
    );

    if (assignments.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete vehicle that is currently assigned',
        error: 'VEHICLE_ASSIGNED',
        timestamp: new Date().toISOString()
      });
    }

    // Soft delete by setting status to retired
    await db.execute(
      'UPDATE vehicles SET status = "retired", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Vehicle deleted successfully',
      data: {
        vehicle_id: id,
        status: 'retired'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
