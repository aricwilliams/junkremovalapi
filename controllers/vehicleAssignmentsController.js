const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');

/**
 * Vehicle Assignments Controller
 * Handles all vehicle assignment-related operations for the Fleet Management API
 */

/**
 * Get all driver assignments for a specific vehicle
 */
async function getVehicleAssignments(req, res) {
  try {
    const { id } = req.params;

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

    // Get all assignments for the vehicle
    const assignmentsQuery = `
      SELECT 
        va.id,
        va.crew_id,
        va.job_id,
        va.assignment_type,
        va.start_date,
        va.start_time,
        va.end_date,
        va.end_time,
        va.start_mileage,
        va.end_mileage,
        va.assigned_by,
        va.assigned_by_name,
        va.status,
        va.notes,
        va.created_at,
        va.updated_at
      FROM vehicle_assignments va
      WHERE va.vehicle_id = ?
      ORDER BY va.start_date DESC, va.start_time DESC
    `;

    const [assignments] = await db.execute(assignmentsQuery, [id]);

    // Get current active assignment
    const currentAssignment = assignments.find(assignment => assignment.status === 'active');

    // Get assignment summary
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_assignments,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_assignments,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_assignments,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_assignments,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_assignments,
        MAX(CASE WHEN status = 'completed' THEN end_date END) as last_assignment_date
      FROM vehicle_assignments
      WHERE vehicle_id = ?
    `;

    const [summaryResult] = await db.execute(summaryQuery, [id]);
    const summary = summaryResult[0];

    res.json({
      success: true,
      message: 'Vehicle assignments retrieved successfully',
      data: {
        vehicle_id: id,
        vehicle_name: existingVehicles[0].name,
        current_assignment: currentAssignment || null,
        assignment_history: assignments,
        summary
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting vehicle assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve vehicle assignments',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Assign a vehicle to a driver/crew
 */
async function assignVehicle(req, res) {
  try {
    const { id } = req.params;
    const assignmentData = req.body;
    const assignmentId = uuidv4();

    // Check if vehicle exists
    const [existingVehicles] = await db.execute(
      'SELECT id, name, status FROM vehicles WHERE id = ? AND is_active = TRUE',
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

    // Check if vehicle is available for assignment
    if (vehicle.status !== 'available' && vehicle.status !== 'reserved') {
      return res.status(409).json({
        success: false,
        message: 'Vehicle is not available for assignment',
        error: 'VEHICLE_NOT_AVAILABLE',
        timestamp: new Date().toISOString()
      });
    }

    // Check if vehicle already has an active assignment
    const [activeAssignments] = await db.execute(
      'SELECT id FROM vehicle_assignments WHERE vehicle_id = ? AND status = "active"',
      [id]
    );

    if (activeAssignments.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Vehicle already has an active assignment',
        error: 'VEHICLE_ALREADY_ASSIGNED',
        timestamp: new Date().toISOString()
      });
    }

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Create assignment record
      const insertQuery = `
        INSERT INTO vehicle_assignments (
          id, vehicle_id, crew_id, job_id, assignment_type, start_date, start_time,
          end_date, end_time, start_mileage, end_mileage, assigned_by,
          assigned_by_name, status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const insertParams = [
        assignmentId,
        id,
        assignmentData.crew_id || null,
        assignmentData.job_id || null,
        assignmentData.assignment_type || 'crew',
        assignmentData.start_date,
        assignmentData.start_time || null,
        assignmentData.end_date || null,
        assignmentData.end_time || null,
        assignmentData.start_mileage || null,
        assignmentData.end_mileage || null,
        assignmentData.assigned_by || null,
        assignmentData.assigned_by_name || null,
        'active',
        assignmentData.notes || null
      ];

      await connection.execute(insertQuery, insertParams);

      // Update vehicle status and assignment info
      const updateVehicleQuery = `
        UPDATE vehicles 
        SET 
          status = 'in-use',
          assigned_crew_id = ?,
          assigned_job_id = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      await connection.execute(updateVehicleQuery, [
        assignmentData.crew_id || null,
        assignmentData.job_id || null,
        id
      ]);

      await connection.commit();

      // Get created assignment
      const [assignments] = await db.execute(
        'SELECT id, assignment_type, start_date, status, created_at FROM vehicle_assignments WHERE id = ?',
        [assignmentId]
      );

      res.status(201).json({
        success: true,
        message: 'Vehicle assigned successfully',
        data: {
          assignment_id: assignmentId,
          vehicle_id: id,
          assignment_type: assignmentData.assignment_type || 'crew',
          status: 'active',
          start_date: assignmentData.start_date
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
    console.error('Error assigning vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign vehicle',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update an existing vehicle assignment
 */
async function updateVehicleAssignment(req, res) {
  try {
    const { id, assignmentId } = req.params;
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

    // Check if assignment exists
    const [existingAssignments] = await db.execute(
      'SELECT id, status FROM vehicle_assignments WHERE id = ? AND vehicle_id = ?',
      [assignmentId, id]
    );

    if (existingAssignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
        error: 'ASSIGNMENT_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const existingAssignment = existingAssignments[0];

    // Build dynamic UPDATE query
    const updateFields = [];
    const updateParams = [];

    const allowedFields = [
      'crew_id', 'job_id', 'assignment_type', 'start_date', 'start_time',
      'end_date', 'end_time', 'start_mileage', 'end_mileage', 'assigned_by',
      'assigned_by_name', 'status', 'notes'
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
    updateParams.push(assignmentId);

    const updateQuery = `UPDATE vehicle_assignments SET ${updateFields.join(', ')} WHERE id = ?`;
    await db.execute(updateQuery, updateParams);

    // Update vehicle status based on assignment status
    if (updateData.status) {
      let vehicleStatus = 'available';
      
      if (updateData.status === 'active') {
        vehicleStatus = 'in-use';
      } else if (updateData.status === 'completed' || updateData.status === 'cancelled') {
        // Check if there are other active assignments
        const [otherAssignments] = await db.execute(
          'SELECT COUNT(*) as count FROM vehicle_assignments WHERE vehicle_id = ? AND status = "active"',
          [id]
        );
        
        if (otherAssignments[0].count === 0) {
          vehicleStatus = 'available';
        } else {
          vehicleStatus = 'in-use';
        }
      }

      // Update vehicle assignment info if crew_id or job_id changed
      let crewId = null;
      let jobId = null;
      
      if (updateData.crew_id !== undefined) {
        crewId = updateData.crew_id;
      } else if (existingAssignment.status === 'active') {
        // Get current crew_id from active assignment
        const [currentAssignment] = await db.execute(
          'SELECT crew_id, job_id FROM vehicle_assignments WHERE vehicle_id = ? AND status = "active"',
          [id]
        );
        if (currentAssignment.length > 0) {
          crewId = currentAssignment[0].crew_id;
          jobId = currentAssignment[0].job_id;
        }
      }

      if (updateData.job_id !== undefined) {
        jobId = updateData.job_id;
      } else if (existingAssignment.status === 'active') {
        // Get current job_id from active assignment
        const [currentAssignment] = await db.execute(
          'SELECT crew_id, job_id FROM vehicle_assignments WHERE vehicle_id = ? AND status = "active"',
          [id]
        );
        if (currentAssignment.length > 0) {
          crewId = currentAssignment[0].crew_id;
          jobId = currentAssignment[0].job_id;
        }
      }

      await db.execute(
        'UPDATE vehicles SET status = ?, assigned_crew_id = ?, assigned_job_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [vehicleStatus, crewId, jobId, id]
      );
    }

    // Get updated assignment
    const [assignments] = await db.execute(
      'SELECT id, assignment_type, status, start_date, updated_at FROM vehicle_assignments WHERE id = ?',
      [assignmentId]
    );

    res.json({
      success: true,
      message: 'Vehicle assignment updated successfully',
      data: {
        assignment_id: assignmentId,
        status: updateData.status || existingAssignment.status,
        updated_fields: Object.keys(updateData)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating vehicle assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle assignment',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Delete a vehicle assignment
 */
async function deleteVehicleAssignment(req, res) {
  try {
    const { id, assignmentId } = req.params;

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

    // Check if assignment exists
    const [existingAssignments] = await db.execute(
      'SELECT id, status FROM vehicle_assignments WHERE id = ? AND vehicle_id = ?',
      [assignmentId, id]
    );

    if (existingAssignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
        error: 'ASSIGNMENT_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Check if assignment is active
    if (existingAssignments[0].status === 'active') {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete active assignment',
        error: 'ASSIGNMENT_ACTIVE',
        timestamp: new Date().toISOString()
      });
    }

    // Delete assignment
    await db.execute('DELETE FROM vehicle_assignments WHERE id = ?', [assignmentId]);

    // Check if vehicle status should be updated
    const [otherAssignments] = await db.execute(
      'SELECT COUNT(*) as count FROM vehicle_assignments WHERE vehicle_id = ? AND status = "active"',
      [id]
    );

    if (otherAssignments[0].count === 0) {
      await db.execute(
        'UPDATE vehicles SET status = "available", assigned_crew_id = NULL, assigned_job_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    }

    res.json({
      success: true,
      message: 'Vehicle assignment deleted successfully',
      data: {
        assignment_id: assignmentId,
        vehicle_id: id
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting vehicle assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle assignment',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get assignment by ID
 */
async function getAssignmentById(req, res) {
  try {
    const { id, assignmentId } = req.params;

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

    // Get assignment details
    const assignmentQuery = `
      SELECT 
        va.*,
        v.name as vehicle_name,
        v.make,
        v.model,
        v.license_plate
      FROM vehicle_assignments va
      JOIN vehicles v ON va.vehicle_id = v.id
      WHERE va.id = ? AND va.vehicle_id = ?
    `;

    const [assignments] = await db.execute(assignmentQuery, [assignmentId, id]);

    if (assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
        error: 'ASSIGNMENT_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const assignment = assignments[0];

    res.json({
      success: true,
      message: 'Assignment retrieved successfully',
      data: { assignment },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting assignment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assignment',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getVehicleAssignments,
  assignVehicle,
  updateVehicleAssignment,
  deleteVehicleAssignment,
  getAssignmentById
};
