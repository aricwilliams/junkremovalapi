const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/database');

/**
 * Get employee training records
 */
async function getEmployeeTraining(req, res) {
  try {
    const { id } = req.params;
    const { status, type, date_from, date_to } = req.query;

    const connection = await mysql.createConnection(config);

    // Check if employee exists
    const employeeQuery = 'SELECT id, first_name, last_name FROM employees WHERE id = ? AND is_active = TRUE';
    const [employees] = await connection.execute(employeeQuery, [id]);

    if (employees.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
        error: 'EMPLOYEE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const employee = employees[0];

    // Build WHERE clause for training records
    let whereClause = 'WHERE employee_id = ?';
    const values = [id];

    if (status) {
      whereClause += ' AND status = ?';
      values.push(status);
    }

    if (type) {
      whereClause += ' AND training_type = ?';
      values.push(type);
    }

    if (date_from) {
      whereClause += ' AND start_date >= ?';
      values.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND start_date <= ?';
      values.push(date_to);
    }

    // Get training records
    const trainingQuery = `
      SELECT 
        t.*,
        CASE 
          WHEN t.expiry_date IS NOT NULL AND t.expiry_date < CURDATE() THEN 'expired'
          WHEN t.expiry_date IS NOT NULL AND t.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
          ELSE t.status
        END as calculated_status
      FROM employee_training t
      ${whereClause}
      ORDER BY start_date DESC
    `;

    const [trainingRecords] = await connection.execute(trainingQuery, values);

    // Get certifications
    const certQuery = `
      SELECT 
        c.*,
        CASE 
          WHEN c.expiry_date IS NOT NULL AND c.expiry_date < CURDATE() THEN 'expired'
          WHEN c.expiry_date IS NOT NULL AND c.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 'expiring_soon'
          ELSE c.status
        END as calculated_status
      FROM employee_certifications c
      WHERE employee_id = ?
      ORDER BY issue_date DESC
    `;

    const [certifications] = await connection.execute(certQuery, [id]);

    // Calculate training statistics
    const totalTrainingHours = trainingRecords.reduce((sum, record) => sum + (record.duration_hours || 0), 0);
    const completedTraining = trainingRecords.filter(record => record.status === 'completed').length;
    const pendingTraining = trainingRecords.filter(record => record.status === 'scheduled').length;
    const expiredCertifications = certifications.filter(cert => cert.calculated_status === 'expired').length;
    const expiringSoon = certifications.filter(cert => cert.calculated_status === 'expiring_soon').length;

    // Get required training (placeholder - would be based on position/department requirements)
    const requiredTraining = getRequiredTraining(employee.position, employee.department);

    await connection.end();

    res.json({
      success: true,
      message: 'Employee training records retrieved successfully',
      data: {
        employee_id: id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        training_records: trainingRecords,
        certifications: certifications,
        training_summary: {
          total_training_hours: totalTrainingHours,
          completed_training_count: completedTraining,
          pending_training_count: pendingTraining,
          total_certifications: certifications.length,
          expired_certifications: expiredCertifications,
          expiring_soon: expiringSoon
        },
        required_training: requiredTraining
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting employee training:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee training records',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Add training record for an employee
 */
async function addTrainingRecord(req, res) {
  try {
    const { id } = req.params;
    const trainingData = req.body;

    const connection = await mysql.createConnection(config);

    // Check if employee exists
    const employeeQuery = 'SELECT id, first_name, last_name FROM employees WHERE id = ? AND is_active = TRUE';
    const [employees] = await connection.execute(employeeQuery, [id]);

    if (employees.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
        error: 'EMPLOYEE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const employee = employees[0];

    // Insert training record
    const trainingId = uuidv4();
    const insertQuery = `
      INSERT INTO employee_training (
        id, employee_id, training_name, training_type, provider, instructor,
        start_date, end_date, duration_hours, status, score, passing_score,
        certificate_number, expiry_date, renewal_required, renewal_frequency,
        cost, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(insertQuery, [
      trainingId,
      id,
      trainingData.course_name,
      trainingData.type,
      trainingData.provider || null,
      trainingData.instructor || null,
      trainingData.completion_date,
      trainingData.completion_date, // Using completion_date as both start and end for completed training
      trainingData.duration_hours || null,
      'completed',
      trainingData.score || null,
      trainingData.passing_score || null,
      trainingData.certificate_number || null,
      trainingData.expiration_date || null,
      trainingData.renewal_required || false,
      trainingData.renewal_frequency || null,
      trainingData.cost || null,
      trainingData.notes || null
    ]);

    // If this is a certification type training, also create a certification record
    if (trainingData.type === 'certification' && trainingData.certificate_number) {
      const certId = uuidv4();
      const certQuery = `
        INSERT INTO employee_certifications (
          id, employee_id, name, issuing_authority, certificate_number,
          issue_date, expiry_date, status, renewal_required, renewal_frequency,
          continuing_education_hours, ce_hours_required, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(certQuery, [
        certId,
        id,
        trainingData.course_name,
        trainingData.provider || 'Unknown',
        trainingData.certificate_number,
        trainingData.completion_date,
        trainingData.expiration_date || null,
        'active',
        trainingData.renewal_required || false,
        trainingData.renewal_frequency || null,
        trainingData.duration_hours || null,
        null, // CE hours required would be based on certification type
        trainingData.notes || null
      ]);
    }

    await connection.end();

    res.status(201).json({
      success: true,
      message: 'Training record added successfully',
      data: {
        training_id: trainingId,
        employee_id: id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        training_name: trainingData.course_name,
        type: trainingData.type,
        status: 'completed',
        completion_date: trainingData.completion_date,
        created: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error adding training record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add training record',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update training record
 */
async function updateTrainingRecord(req, res) {
  try {
    const { id, training_id } = req.params;
    const updateData = req.body;

    const connection = await mysql.createConnection(config);

    // Check if employee exists
    const employeeQuery = 'SELECT id, first_name, last_name FROM employees WHERE id = ? AND is_active = TRUE';
    const [employees] = await connection.execute(employeeQuery, [id]);

    if (employees.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
        error: 'EMPLOYEE_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const employee = employees[0];

    // Check if training record exists
    const trainingQuery = 'SELECT * FROM employee_training WHERE id = ? AND employee_id = ?';
    const [trainingRecords] = await connection.execute(trainingQuery, [training_id, id]);

    if (trainingRecords.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Training record not found',
        error: 'TRAINING_RECORD_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const trainingRecord = trainingRecords[0];

    // Build update query dynamically
    const updatedFields = [];
    const updateValues = [];

    if (updateData.training_name) {
      updatedFields.push('training_name = ?');
      updateValues.push(updateData.training_name);
    }

    if (updateData.training_type) {
      updatedFields.push('training_type = ?');
      updateValues.push(updateData.training_type);
    }

    if (updateData.provider !== undefined) {
      updatedFields.push('provider = ?');
      updateValues.push(updateData.provider);
    }

    if (updateData.instructor !== undefined) {
      updatedFields.push('instructor = ?');
      updateValues.push(updateData.instructor);
    }

    if (updateData.start_date) {
      updatedFields.push('start_date = ?');
      updateValues.push(updateData.start_date);
    }

    if (updateData.end_date) {
      updatedFields.push('end_date = ?');
      updateValues.push(updateData.end_date);
    }

    if (updateData.duration_hours !== undefined) {
      updatedFields.push('duration_hours = ?');
      updateValues.push(updateData.duration_hours);
    }

    if (updateData.status) {
      updatedFields.push('status = ?');
      updateValues.push(updateData.status);
    }

    if (updateData.score !== undefined) {
      updatedFields.push('score = ?');
      updateValues.push(updateData.score);
    }

    if (updateData.passing_score !== undefined) {
      updatedFields.push('passing_score = ?');
      updateValues.push(updateData.passing_score);
    }

    if (updateData.certificate_number !== undefined) {
      updatedFields.push('certificate_number = ?');
      updateValues.push(updateData.certificate_number);
    }

    if (updateData.expiry_date !== undefined) {
      updatedFields.push('expiry_date = ?');
      updateValues.push(updateData.expiry_date);
    }

    if (updateData.renewal_required !== undefined) {
      updatedFields.push('renewal_required = ?');
      updateValues.push(updateData.renewal_required);
    }

    if (updateData.renewal_frequency !== undefined) {
      updatedFields.push('renewal_frequency = ?');
      updateValues.push(updateData.renewal_frequency);
    }

    if (updateData.cost !== undefined) {
      updatedFields.push('cost = ?');
      updateValues.push(updateData.cost);
    }

    if (updateData.notes !== undefined) {
      updatedFields.push('notes = ?');
      updateValues.push(updateData.notes);
    }

    if (updatedFields.length === 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update',
        error: 'NO_UPDATE_FIELDS',
        timestamp: new Date().toISOString()
      });
    }

    // Update training record
    updatedFields.push('updated_at = CURRENT_TIMESTAMP');
    const updateQuery = `UPDATE employee_training SET ${updatedFields.join(', ')} WHERE id = ? AND employee_id = ?`;
    updateValues.push(training_id, id);

    await connection.execute(updateQuery, updateValues);

    await connection.end();

    res.json({
      success: true,
      message: 'Training record updated successfully',
      data: {
        training_id: training_id,
        employee_id: id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        updated_fields: updatedFields.filter(field => field !== 'updated_at')
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating training record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update training record',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get training requirements for a position/department
 */
function getRequiredTraining(position, department) {
  // This would typically be stored in a database table
  // For now, return placeholder data based on position and department
  
  const baseTraining = [
    {
      name: 'Safety Orientation',
      type: 'safety',
      frequency: 'once',
      duration_hours: 2,
      is_required: true
    },
    {
      name: 'Company Policies',
      type: 'compliance',
      frequency: 'annual',
      duration_hours: 1,
      is_required: true
    }
  ];

  const positionTraining = {
    'driver': [
      {
        name: 'CDL Training',
        type: 'certification',
        frequency: 'biennial',
        duration_hours: 40,
        is_required: true
      },
      {
        name: 'Defensive Driving',
        type: 'safety',
        frequency: 'annual',
        duration_hours: 4,
        is_required: true
      }
    ],
    'helper': [
      {
        name: 'Equipment Safety',
        type: 'safety',
        frequency: 'annual',
        duration_hours: 2,
        is_required: true
      }
    ],
    'supervisor': [
      {
        name: 'Leadership Training',
        type: 'leadership',
        frequency: 'annual',
        duration_hours: 8,
        is_required: true
      },
      {
        name: 'Safety Management',
        type: 'safety',
        frequency: 'annual',
        duration_hours: 4,
        is_required: true
      }
    ]
  };

  const departmentTraining = {
    'operations': [
      {
        name: 'Operations Procedures',
        type: 'skills',
        frequency: 'annual',
        duration_hours: 3,
        is_required: true
      }
    ],
    'maintenance': [
      {
        name: 'Equipment Maintenance',
        type: 'skills',
        frequency: 'annual',
        duration_hours: 6,
        is_required: true
      }
    ]
  };

  return [
    ...baseTraining,
    ...(positionTraining[position] || []),
    ...(departmentTraining[department] || [])
  ];
}

/**
 * Get training analytics and reports
 */
async function getTrainingAnalytics(req, res) {
  try {
    const { date_from, date_to, department, type } = req.query;

    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        message: 'Both date_from and date_to are required',
        error: 'MISSING_DATES',
        timestamp: new Date().toISOString()
      });
    }

    const connection = await mysql.createConnection(config);

    // Build filters
    let employeeFilter = '';
    let trainingFilter = '';
    const params = [];

    if (department) {
      employeeFilter = 'AND e.department = ?';
      params.push(department);
    }

    if (type) {
      trainingFilter = 'AND t.training_type = ?';
      params.push(type);
    }

    // Get training completion statistics
    const completionQuery = `
      SELECT 
        e.department,
        t.training_type,
        COUNT(*) as total_training,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_training,
        SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_training,
        SUM(CASE WHEN t.status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_training,
        AVG(t.score) as avg_score,
        SUM(t.duration_hours) as total_hours,
        SUM(t.cost) as total_cost
      FROM employee_training t
      JOIN employees e ON t.employee_id = e.id
      WHERE e.is_active = TRUE 
        AND t.start_date BETWEEN ? AND ?
        ${employeeFilter}
        ${trainingFilter}
      GROUP BY e.department, t.training_type
      ORDER BY e.department, t.training_type
    `;

    const [completionData] = await connection.execute(completionQuery, [date_from, date_to, ...params]);

    // Get certification status
    const certQuery = `
      SELECT 
        e.department,
        c.status,
        COUNT(*) as count,
        AVG(DATEDIFF(c.expiry_date, CURDATE())) as avg_days_until_expiry
      FROM employee_certifications c
      JOIN employees e ON c.employee_id = e.id
      WHERE e.is_active = TRUE
        ${employeeFilter}
      GROUP BY e.department, c.status
      ORDER BY e.department, c.status
    `;

    const [certData] = await connection.execute(certQuery, params);

    // Get training cost analysis
    const costQuery = `
      SELECT 
        e.department,
        t.training_type,
        COUNT(*) as training_count,
        SUM(t.cost) as total_cost,
        AVG(t.cost) as avg_cost_per_training,
        SUM(t.duration_hours) as total_hours
      FROM employee_training t
      JOIN employees e ON t.employee_id = e.id
      WHERE e.is_active = TRUE 
        AND t.start_date BETWEEN ? AND ?
        AND t.cost IS NOT NULL
        ${employeeFilter}
        ${trainingFilter}
      GROUP BY e.department, t.training_type
      ORDER BY total_cost DESC
    `;

    const [costData] = await connection.execute(costQuery, [date_from, date_to, ...params]);

    await connection.end();

    // Calculate summary statistics
    const totalTraining = completionData.reduce((sum, item) => sum + (item.total_training || 0), 0);
    const totalCompleted = completionData.reduce((sum, item) => sum + (item.completed_training || 0), 0);
    const totalFailed = completionData.reduce((sum, item) => sum + (item.failed_training || 0), 0);
    const totalHours = completionData.reduce((sum, item) => sum + (item.total_hours || 0), 0);
    const totalCost = completionData.reduce((sum, item) => sum + (item.total_cost || 0), 0);

    const completionRate = totalTraining > 0 ? ((totalCompleted / totalTraining) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      message: 'Training analytics retrieved successfully',
      data: {
        date_range: {
          from: date_from,
          to: date_to
        },
        filters: {
          department: department || 'all',
          type: type || 'all'
        },
        completion_statistics: completionData,
        certification_status: certData,
        cost_analysis: costData,
        summary: {
          total_training: totalTraining,
          completed_training: totalCompleted,
          failed_training: totalFailed,
          completion_rate: completionRate,
          total_hours: totalHours,
          total_cost: totalCost,
          avg_cost_per_training: totalTraining > 0 ? (totalCost / totalTraining).toFixed(2) : 0
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting training analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve training analytics',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getEmployeeTraining,
  addTrainingRecord,
  updateTrainingRecord,
  getTrainingAnalytics
};
