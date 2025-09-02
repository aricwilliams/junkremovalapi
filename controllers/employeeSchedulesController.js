const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/database');

/**
 * Get employee schedule for a specific period
 */
async function getEmployeeSchedule(req, res) {
  try {
    const { id } = req.params;
    const { date_from, date_to } = req.query;

    // Default to current week if no dates specified
    const fromDate = date_from || new Date().toISOString().split('T')[0];
    const toDate = date_to || new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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

    // Get current schedule for the week
    const scheduleQuery = `
      SELECT 
        day_of_week,
        start_time,
        end_time,
        break_start,
        break_end,
        is_available,
        is_required,
        notes
      FROM employee_schedules 
      WHERE employee_id = ? 
        AND effective_date <= ?
        AND (end_date IS NULL OR end_date >= ?)
        AND is_available = TRUE
      ORDER BY 
        CASE day_of_week
          WHEN 'monday' THEN 1
          WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4
          WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6
          WHEN 'sunday' THEN 7
        END
    `;

    const [schedules] = await connection.execute(scheduleQuery, [id, fromDate, toDate]);

    // Get time logs for the period to calculate actual hours worked
    const timeLogsQuery = `
      SELECT 
        log_date,
        clock_in,
        clock_out,
        break_start,
        break_end,
        total_hours,
        regular_hours,
        overtime_hours,
        status
      FROM employee_time_logs 
      WHERE employee_id = ? 
        AND log_date BETWEEN ? AND ?
      ORDER BY log_date
    `;

    const [timeLogs] = await connection.execute(timeLogsQuery, [id, fromDate, toDate]);

    await connection.end();

    // Build weekly schedule with calculated hours
    const weeklySchedule = {};
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    daysOfWeek.forEach(day => {
      const schedule = schedules.find(s => s.day_of_week === day);
      const timeLog = timeLogs.find(t => {
        const logDate = new Date(t.log_date);
        const dayName = daysOfWeek[logDate.getDay() === 0 ? 6 : logDate.getDay() - 1];
        return dayName === day;
      });

      if (schedule) {
        weeklySchedule[day] = {
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          break_start: schedule.break_start,
          break_end: schedule.break_end,
          total_hours: timeLog ? timeLog.total_hours : 8.0,
          overtime_hours: timeLog ? timeLog.overtime_hours : 0,
          is_available: schedule.is_available,
          is_required: schedule.is_required,
          notes: schedule.notes
        };
      } else {
        weeklySchedule[day] = {
          start_time: null,
          end_time: null,
          break_start: null,
          break_end: null,
          total_hours: 0,
          overtime_hours: 0,
          is_available: false,
          is_required: false,
          notes: 'No schedule set'
        };
      }
    });

    // Calculate summary statistics
    const totalHours = timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
    const overtimeHours = timeLogs.reduce((sum, log) => sum + (log.overtime_hours || 0), 0);
    const regularHours = totalHours - overtimeHours;
    const breakHours = timeLogs.reduce((sum, log) => {
      if (log.break_start && log.break_end) {
        const breakStart = new Date(`2000-01-01T${log.break_start}`);
        const breakEnd = new Date(`2000-01-01T${log.break_end}`);
        return sum + ((breakEnd - breakStart) / (1000 * 60 * 60));
      }
      return sum;
    }, 0);

    res.json({
      success: true,
      message: 'Employee schedule retrieved successfully',
      data: {
        employee_id: id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        schedule_period: {
          from: fromDate,
          to: toDate
        },
        weekly_schedule: weeklySchedule,
        summary: {
          total_hours: totalHours,
          overtime_hours: overtimeHours,
          regular_hours: regularHours,
          break_hours: breakHours
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting employee schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee schedule',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update employee schedule
 */
async function updateEmployeeSchedule(req, res) {
  try {
    const { id } = req.params;
    const { schedule_changes, effective_date, reason } = req.body;

    const connection = await mysql.createConnection(config);

    // Check if employee exists
    const employeeQuery = 'SELECT id FROM employees WHERE id = ? AND is_active = TRUE';
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

    // End current schedules for the days being changed
    const daysToUpdate = Object.keys(schedule_changes);
    const endCurrentSchedulesQuery = `
      UPDATE employee_schedules 
      SET end_date = DATE_SUB(?, INTERVAL 1 DAY)
      WHERE employee_id = ? 
        AND day_of_week IN (${daysToUpdate.map(() => '?').join(',')})
        AND (end_date IS NULL OR end_date >= ?)
    `;

    await connection.execute(endCurrentSchedulesQuery, [
      effective_date,
      id,
      ...daysToUpdate,
      effective_date
    ]);

    // Insert new schedules
    const updatedDays = [];
    for (const [day, schedule] of Object.entries(schedule_changes)) {
      if (schedule.start_time || schedule.end_time) {
        const scheduleId = uuidv4();
        const insertQuery = `
          INSERT INTO employee_schedules (
            id, employee_id, schedule_type, day_of_week, start_time, 
            end_time, break_start, break_end, effective_date, 
            is_available, is_required, notes
          ) VALUES (?, ?, 'regular', ?, ?, ?, ?, ?, ?, TRUE, TRUE, ?)
        `;

        await connection.execute(insertQuery, [
          scheduleId,
          id,
          day,
          schedule.start_time || '08:00:00',
          schedule.end_time || '17:00:00',
          schedule.break_start || '12:00:00',
          schedule.break_end || '13:00:00',
          effective_date,
          reason || 'Schedule updated via API'
        ]);

        updatedDays.push(day);
      }
    }

    await connection.end();

    res.json({
      success: true,
      message: 'Employee schedule updated successfully',
      data: {
        employee_id: id,
        effective_date,
        updated_days: updatedDays
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating employee schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update employee schedule',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get employee availability for a specific date range
 */
async function getEmployeeAvailability(req, res) {
  try {
    const { id } = req.params;
    const { date_from, date_to } = req.query;

    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        message: 'Both date_from and date_to are required',
        error: 'MISSING_DATES',
        timestamp: new Date().toISOString()
      });
    }

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

    // Get schedule conflicts and availability
    const availabilityQuery = `
      SELECT 
        DATE(?) + INTERVAL (a.a + b.a * 10 + c.a * 100) DAY as date,
        s.day_of_week,
        s.start_time,
        s.end_time,
        s.is_available,
        s.is_required,
        tl.status as time_log_status,
        tl.total_hours
      FROM (
        SELECT 0 as a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
      ) a
      CROSS JOIN (
        SELECT 0 as a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
      ) b
      CROSS JOIN (
        SELECT 0 as a UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
      ) c
      LEFT JOIN employee_schedules s ON s.employee_id = ? 
        AND s.effective_date <= DATE(?) + INTERVAL (a.a + b.a * 10 + c.a * 100) DAY
        AND (s.end_date IS NULL OR s.end_date >= DATE(?) + INTERVAL (a.a + b.a * 10 + c.a * 100) DAY)
        AND s.day_of_week = DAYNAME(DATE(?) + INTERVAL (a.a + b.a * 10 + c.a * 100) DAY)
      LEFT JOIN employee_time_logs tl ON tl.employee_id = ? 
        AND tl.log_date = DATE(?) + INTERVAL (a.a + b.a * 10 + c.a * 100) DAY
      WHERE DATE(?) + INTERVAL (a.a + b.a * 10 + c.a * 100) DAY BETWEEN ? AND ?
      ORDER BY date
    `;

    const [availability] = await connection.execute(availabilityQuery, [
      date_from, id, date_from, date_from, date_from, id, date_from, date_from, date_to
    ]);

    await connection.end();

    // Process availability data
    const availabilityData = availability.map(day => ({
      date: day.date.toISOString().split('T')[0],
      day_of_week: day.day_of_week,
      scheduled: {
        start_time: day.start_time,
        end_time: day.end_time,
        is_available: day.is_available,
        is_required: day.is_required
      },
      actual: {
        status: day.time_log_status || 'no_log',
        hours_worked: day.total_hours || 0
      },
      conflicts: []
    }));

    // Identify conflicts
    availabilityData.forEach(day => {
      if (day.scheduled.is_required && !day.scheduled.is_available) {
        day.conflicts.push('Required day marked as unavailable');
      }
      if (day.scheduled.is_available && day.actual.status === 'absent') {
        day.conflicts.push('Scheduled but absent');
      }
      if (day.scheduled.is_available && day.actual.hours_worked < 8) {
        day.conflicts.push('Worked fewer hours than scheduled');
      }
    });

    res.json({
      success: true,
      message: 'Employee availability retrieved successfully',
      data: {
        employee_id: id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        date_range: {
          from: date_from,
          to: date_to
        },
        availability: availabilityData,
        summary: {
          total_days: availabilityData.length,
          scheduled_days: availabilityData.filter(d => d.scheduled.is_available).length,
          required_days: availabilityData.filter(d => d.scheduled.is_required).length,
          conflicts_found: availabilityData.filter(d => d.conflicts.length > 0).length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting employee availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee availability',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get team schedule for a specific date range
 */
async function getTeamSchedule(req, res) {
  try {
    const { date_from, date_to, department } = req.query;

    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        message: 'Both date_from and date_to are required',
        error: 'MISSING_DATES',
        timestamp: new Date().toISOString()
      });
    }

    const connection = await mysql.createConnection(config);

    // Build department filter
    const deptFilter = department ? 'AND e.department = ?' : '';
    const deptParams = department ? [department] : [];

    // Get all employees in the department/team
    const employeesQuery = `
      SELECT 
        e.id, e.first_name, e.last_name, e.department, e.position,
        e.assigned_crew_id, c.name as crew_name
      FROM employees e
      LEFT JOIN crews c ON e.assigned_crew_id = c.id
      WHERE e.is_active = TRUE AND e.status = 'active'
      ${deptFilter}
      ORDER BY e.department, e.last_name
    `;

    const [employees] = await connection.execute(employeesQuery, deptParams);

    // Get schedules for all employees
    const schedulesQuery = `
      SELECT 
        s.employee_id,
        s.day_of_week,
        s.start_time,
        s.end_time,
        s.break_start,
        s.break_end,
        s.is_available
      FROM employee_schedules s
      WHERE s.employee_id IN (${employees.map(() => '?').join(',')})
        AND s.effective_date <= ?
        AND (s.end_date IS NULL OR s.end_date >= ?)
        AND s.is_available = TRUE
      ORDER BY s.employee_id, 
        CASE s.day_of_week
          WHEN 'monday' THEN 1
          WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4
          WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6
          WHEN 'sunday' THEN 7
        END
    `;

    const [schedules] = await connection.execute(schedulesQuery, [
      ...employees.map(e => e.id),
      date_from,
      date_to
    ]);

    await connection.end();

    // Group schedules by employee
    const teamSchedule = employees.map(employee => {
      const employeeSchedules = schedules.filter(s => s.employee_id === employee.id);
      const weeklySchedule = {};

      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
        const schedule = employeeSchedules.find(s => s.day_of_week === day);
        weeklySchedule[day] = schedule ? {
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          break_start: schedule.break_start,
          break_end: schedule.break_end,
          is_available: schedule.is_available
        } : {
          start_time: null,
          end_time: null,
          break_start: null,
          break_end: null,
          is_available: false
        };
      });

      return {
        employee_id: employee.id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        department: employee.department,
        position: employee.position,
        crew: employee.crew_name,
        weekly_schedule: weeklySchedule
      };
    });

    res.json({
      success: true,
      message: 'Team schedule retrieved successfully',
      data: {
        date_range: {
          from: date_from,
          to: date_to
        },
        department_filter: department || 'all',
        team_schedule: teamSchedule,
        summary: {
          total_employees: teamSchedule.length,
          departments: [...new Set(teamSchedule.map(e => e.department))],
          crews: [...new Set(teamSchedule.map(e => e.crew).filter(Boolean))]
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting team schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve team schedule',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getEmployeeSchedule,
  updateEmployeeSchedule,
  getEmployeeAvailability,
  getTeamSchedule
};
