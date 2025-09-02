const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

/**
 * Vehicle Tracking Controller
 * Handles all vehicle tracking and location-related operations for the Fleet Management API
 */

/**
 * Get current location and tracking information for a vehicle
 */
async function getVehicleLocation(req, res) {
  try {
    const { id } = req.params;

    // Check if vehicle exists
    const [existingVehicles] = await db.execute(
      'SELECT id, name, make, model, license_plate FROM vehicles WHERE id = ? AND is_active = TRUE',
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

    const vehicle = existingVehicles[0];

    // Get current location from vehicles table
    const currentLocationQuery = `
      SELECT 
        current_location_lat,
        current_location_lng,
        current_location_address,
        updated_at
      FROM vehicles
      WHERE id = ?
    `;

    const [locationResult] = await db.execute(currentLocationQuery, [id]);
    const currentLocation = locationResult[0];

    // Get latest tracking data
    const trackingQuery = `
      SELECT 
        tracking_date,
        tracking_time,
        latitude,
        longitude,
        altitude,
        speed,
        speed_units,
        heading,
        fuel_level,
        engine_status,
        ignition_status,
        door_status,
        battery_voltage,
        temperature,
        temperature_units,
        location_address,
        accuracy,
        created_at
      FROM vehicle_tracking
      WHERE vehicle_id = ?
      ORDER BY tracking_date DESC, tracking_time DESC
      LIMIT 1
    `;

    const [trackingData] = await db.execute(trackingQuery, [id]);

    // Get route history (last 10 tracking points)
    const routeHistoryQuery = `
      SELECT 
        tracking_date,
        tracking_time,
        latitude,
        longitude,
        speed,
        heading,
        fuel_level,
        engine_status,
        created_at
      FROM vehicle_tracking
      WHERE vehicle_id = ?
      ORDER BY tracking_date DESC, tracking_time DESC
      LIMIT 10
    `;

    const [routeHistory] = await db.execute(routeHistoryQuery, [id]);

    // Get current assignment info
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
      vehicle_id: id,
      vehicle_name: vehicle.name,
      current_location: {
        address: currentLocation.current_location_address,
        coordinates: currentLocation.current_location_lat && currentLocation.current_location_lng ? {
          latitude: currentLocation.current_location_lat,
          longitude: currentLocation.current_location_lng
        } : null,
        last_updated: currentLocation.updated_at
      },
      tracking_data: trackingData.length > 0 ? {
        speed: trackingData[0].speed,
        heading: trackingData[0].heading,
        fuel_level: trackingData[0].fuel_level,
        engine_status: trackingData[0].engine_status,
        ignition_status: trackingData[0].ignition_status,
        door_status: trackingData[0].door_status,
        battery_voltage: trackingData[0].battery_voltage,
        temperature: trackingData[0].temperature,
        temperature_units: trackingData[0].temperature_units,
        altitude: trackingData[0].altitude,
        accuracy: trackingData[0].accuracy
      } : null,
      current_assignment: assignments.length > 0 ? assignments[0] : null,
      route_history: routeHistory.map(point => ({
        timestamp: `${point.tracking_date}T${point.tracking_time}`,
        location: point.location_address,
        coordinates: {
          latitude: point.latitude,
          longitude: point.longitude
        },
        speed: point.speed,
        heading: point.heading,
        fuel_level: point.fuel_level,
        engine_status: point.engine_status
      }))
    };

    res.json({
      success: true,
      message: 'Vehicle location retrieved successfully',
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting vehicle location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicle location',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update the current location of a vehicle
 */
async function updateVehicleLocation(req, res) {
  try {
    const { id } = req.params;
    const { address, coordinates, tracking_data } = req.body;

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

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Update vehicle current location
      const updateVehicleQuery = `
        UPDATE vehicles 
        SET 
          current_location_lat = ?,
          current_location_lng = ?,
          current_location_address = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await connection.execute(updateVehicleQuery, [
        coordinates.latitude,
        coordinates.longitude,
        address,
        id
      ]);

      // Insert tracking record
      const trackingId = uuidv4();
      const insertTrackingQuery = `
        INSERT INTO vehicle_tracking (
          id, vehicle_id, tracking_date, tracking_time, latitude, longitude,
          altitude, speed, speed_units, heading, fuel_level, engine_status,
          ignition_status, door_status, battery_voltage, temperature,
          temperature_units, location_address, accuracy
        ) VALUES (?, ?, CURDATE(), CURTIME(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const trackingParams = [
        trackingId,
        id,
        coordinates.latitude,
        coordinates.longitude,
        tracking_data?.altitude || null,
        tracking_data?.speed || null,
        tracking_data?.speed_units || 'mph',
        tracking_data?.heading || null,
        tracking_data?.fuel_level || null,
        tracking_data?.engine_status || 'unknown',
        tracking_data?.ignition_status || 'unknown',
        tracking_data?.door_status || 'unknown',
        tracking_data?.battery_voltage || null,
        tracking_data?.temperature || null,
        tracking_data?.temperature_units || 'fahrenheit',
        address,
        tracking_data?.accuracy || null
      ];

      await connection.execute(insertTrackingQuery, trackingParams);

      // Update vehicle fuel level if provided
      if (tracking_data?.fuel_level !== undefined) {
        await connection.execute(
          'UPDATE vehicles SET current_fuel_level = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [tracking_data.fuel_level, id]
        );
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Vehicle location updated successfully',
        data: {
          vehicle_id: id,
          location_updated: new Date().toISOString(),
          tracking_id: trackingId
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error updating vehicle location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle location',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get vehicle tracking history
 */
async function getVehicleTrackingHistory(req, res) {
  try {
    const { id } = req.params;
    const {
      date_from,
      date_to,
      limit = 100
    } = req.query;

    // Check if vehicle exists
    const [existingVehicles] = await db.execute(
      'SELECT id, name FROM vehicles WHERE id = ? AND is_active = TRUE',
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

    // Build WHERE clause for date filtering
    let whereClause = 'WHERE vehicle_id = ?';
    const params = [id];

    if (date_from) {
      whereClause += ' AND tracking_date >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND tracking_date <= ?';
      params.push(date_to);
    }

    // Get tracking history
    const trackingQuery = `
      SELECT 
        tracking_date,
        tracking_time,
        latitude,
        longitude,
        altitude,
        speed,
        speed_units,
        heading,
        fuel_level,
        engine_status,
        ignition_status,
        door_status,
        battery_voltage,
        temperature,
        temperature_units,
        location_address,
        accuracy,
        created_at
      FROM vehicle_tracking
      ${whereClause}
      ORDER BY tracking_date DESC, tracking_time DESC
      LIMIT ?
    `;

    params.push(parseInt(limit));

    const [trackingHistory] = await db.execute(trackingQuery, params);

    // Calculate summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_points,
        MIN(tracking_date) as first_date,
        MAX(tracking_date) as last_date,
        AVG(speed) as avg_speed,
        MAX(speed) as max_speed,
        AVG(fuel_level) as avg_fuel_level
      FROM vehicle_tracking
      ${whereClause}
    `;

    const [summaryResult] = await db.execute(summaryQuery, params.slice(0, -1)); // Remove limit param
    const summary = summaryResult[0];

    // Format response
    const response = {
      vehicle_id: id,
      vehicle_name: existingVehicles[0].name,
      tracking_history: trackingHistory.map(point => ({
        timestamp: `${point.tracking_date}T${point.tracking_time}`,
        location: {
          address: point.location_address,
          coordinates: {
            latitude: point.latitude,
            longitude: point.longitude
          },
          altitude: point.altitude,
          accuracy: point.accuracy
        },
        vehicle_data: {
          speed: point.speed,
          speed_units: point.speed_units,
          heading: point.heading,
          fuel_level: point.fuel_level,
          engine_status: point.engine_status,
          ignition_status: point.ignition_status,
          door_status: point.door_status,
          battery_voltage: point.battery_voltage,
          temperature: point.temperature,
          temperature_units: point.temperature_units
        }
      })),
      summary: {
        total_tracking_points: summary.total_points,
        date_range: {
          from: summary.first_date,
          to: summary.last_date
        },
        speed_statistics: {
          average: summary.avg_speed ? parseFloat(summary.avg_speed).toFixed(2) : null,
          maximum: summary.max_speed ? parseFloat(summary.max_speed).toFixed(2) : null,
          units: 'mph'
        },
        average_fuel_level: summary.avg_fuel_level ? parseFloat(summary.avg_fuel_level).toFixed(1) : null
      }
    };

    res.json({
      success: true,
      message: 'Vehicle tracking history retrieved successfully',
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting vehicle tracking history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicle tracking history',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get real-time fleet location (all vehicles)
 */
async function getFleetLocation(req, res) {
  try {
    const { active_only = 'true' } = req.query;

    // Get all active vehicles with their current location
    let whereClause = 'WHERE v.is_active = TRUE';
    const params = [];

    if (active_only === 'true') {
      whereClause += ' AND v.status IN ("available", "in-use")';
    }

    const fleetQuery = `
      SELECT 
        v.id,
        v.name,
        v.make,
        v.model,
        v.license_plate,
        v.vehicle_type,
        v.status,
        v.current_location_lat,
        v.current_location_lng,
        v.current_location_address,
        v.current_fuel_level,
        v.mileage,
        v.updated_at,
        va.crew_id,
        va.job_id,
        va.assignment_type
      FROM vehicles v
      LEFT JOIN vehicle_assignments va ON v.id = va.vehicle_id AND va.status = 'active'
      ${whereClause}
      ORDER BY v.name
    `;

    const [fleetData] = await db.execute(fleetQuery, params);

    // Format response
    const response = {
      total_vehicles: fleetData.length,
      vehicles: fleetData.map(vehicle => ({
        id: vehicle.id,
        name: vehicle.name,
        make: vehicle.make,
        model: vehicle.model,
        license_plate: vehicle.license_plate,
        vehicle_type: vehicle.vehicle_type,
        status: vehicle.status,
        location: {
          address: vehicle.current_location_address,
          coordinates: vehicle.current_location_lat && vehicle.current_location_lng ? {
            latitude: vehicle.current_location_lat,
            longitude: vehicle.current_location_lng
          } : null,
          last_updated: vehicle.updated_at
        },
        operational_data: {
          fuel_level: vehicle.current_fuel_level,
          mileage: vehicle.mileage
        },
        current_assignment: vehicle.crew_id ? {
          crew_id: vehicle.crew_id,
          job_id: vehicle.job_id,
          assignment_type: vehicle.assignment_type
        } : null
      }))
    };

    res.json({
      success: true,
      message: 'Fleet location retrieved successfully',
      data: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting fleet location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve fleet location',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getVehicleLocation,
  updateVehicleLocation,
  getVehicleTrackingHistory,
  getFleetLocation
};
