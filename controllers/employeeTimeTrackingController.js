const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/database');

/**
 * Clock in/out for an employee
 */
async function clockInOut(req, res) {
  try {
    const { id } = req.params;
    const { action, timestamp, location, notes } = req.body;

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
    const clockTime = timestamp ? new Date(timestamp) : new Date();
    const clockDate = clockTime.toISOString().split('T')[0];
    const clockTimeStr = clockTime.toTimeString().split(' ')[0];

    // Check if there's already a time log for today
    const existingLogQuery = `
      SELECT * FROM employee_time_logs 
      WHERE employee_id = ? AND log_date = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const [existingLogs] = await connection.execute(existingLogQuery, [id, clockDate]);

    let timeLogId;
    let currentStatus;

    if (existingLogs.length === 0) {
      // Create new time log for today
      timeLogId = uuidv4();
      const insertQuery = `
        INSERT INTO employee_time_logs (
          id, employee_id, log_date, status, notes
        ) VALUES (?, ?, ?, ?, ?)
      `;

      await connection.execute(insertQuery, [
        timeLogId,
        id,
        clockDate,
        action === 'clock_in' ? 'clocked_in' : 'absent',
        notes || null
      ]);

      currentStatus = action === 'clock_in' ? 'clocked_in' : 'absent';
    } else {
      // Update existing log
      const existingLog = existingLogs[0];
      timeLogId = existingLog.id;
      currentStatus = existingLog.status;

      // Handle different actions
      if (action === 'clock_in') {
        if (currentStatus === 'clocked_in') {
          await connection.end();
          return res.status(400).json({
            success: false,
            message: 'Employee is already clocked in',
            error: 'ALREADY_CLOCKED_IN',
            timestamp: new Date().toISOString()
          });
        }

        // Update status and clock in time
        await connection.execute(`
          UPDATE employee_time_logs 
          SET clock_in = ?, status = 'clocked_in', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [clockTimeStr, timeLogId]);

        currentStatus = 'clocked_in';

      } else if (action === 'clock_out') {
        if (currentStatus !== 'clocked_in') {
          await connection.end();
          return res.status(400).json({
            success: false,
            message: 'Employee must be clocked in to clock out',
            error: 'NOT_CLOCKED_IN',
            timestamp: new Date().toISOString()
          });
        }

        // Update status and clock out time, calculate hours
        await connection.execute(`
          UPDATE employee_time_logs 
          SET clock_out = ?, status = 'clocked_out', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [clockTimeStr, timeLogId]);

        // Calculate total hours
        const startTime = new Date(`${clockDate}T${existingLog.clock_in}`);
        const endTime = new Date(`${clockDate}T${clockTimeStr}`);
        const totalHours = ((endTime - startTime) / (1000 * 60 * 60)).toFixed(2);

        // Update total hours
        await connection.execute(`
          UPDATE employee_time_logs 
          SET total_hours = ?, regular_hours = ?
          WHERE id = ?
        `, [totalHours, totalHours, timeLogId]);

        currentStatus = 'clocked_out';

      } else if (action === 'break_start') {
        if (currentStatus !== 'clocked_in') {
          await connection.end();
          return res.status(400).json({
            success: false,
            message: 'Employee must be clocked in to start break',
            error: 'NOT_CLOCKED_IN',
            timestamp: new Date().toISOString()
          });
        }

        // Update break start time
        await connection.execute(`
          UPDATE employee_time_logs 
          SET break_start = ?, status = 'on_break', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [clockTimeStr, timeLogId]);

        currentStatus = 'on_break';

      } else if (action === 'break_end') {
        if (currentStatus !== 'on_break') {
          await connection.end();
          return res.status(400).json({
            success: false,
            message: 'Employee must be on break to end break',
            error: 'NOT_ON_BREAK',
            timestamp: new Date().toISOString()
          });
        }

        // Update break end time and return to clocked in status
        await connection.execute(`
          UPDATE employee_time_logs 
          SET break_end = ?, status = 'clocked_in', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [clockTimeStr, timeLogId]);

        currentStatus = 'clocked_in';
      }
    }

    // Get updated time log
    const updatedLogQuery = 'SELECT * FROM employee_time_logs WHERE id = ?';
    const [updatedLogs] = await connection.execute(updatedLogQuery, [timeLogId]);
    const updatedLog = updatedLogs[0];

    await connection.end();

    res.json({
      success: true,
      message: `Employee ${action.replace('_', ' ')} successful`,
      data: {
        employee_id: id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        action: action,
        timestamp: clockTime.toISOString(),
        date: clockDate,
        time: clockTimeStr,
        status: currentStatus,
        time_log: {
          id: timeLogId,
          clock_in: updatedLog.clock_in,
          clock_out: updatedLog.clock_out,
          break_start: updatedLog.break_start,
          break_end: updatedLog.break_end,
          total_hours: updatedLog.total_hours,
          status: updatedLog.status
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error with clock in/out:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process clock in/out',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get employee time logs
 */
async function getEmployeeTimeLogs(req, res) {
  try {
    const { id } = req.params;
    const { date_from, date_to, status } = req.query;

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

    // Build WHERE clause
    let whereClause = 'WHERE employee_id = ?';
    const values = [id];

    if (date_from) {
      whereClause += ' AND log_date >= ?';
      values.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND log_date <= ?';
      values.push(date_to);
    }

    if (status) {
      whereClause += ' AND status = ?';
      values.push(status);
    }

    // Get time logs
    const timeLogsQuery = `
      SELECT 
        *,
        CASE 
          WHEN status = 'clocked_in' THEN 'Currently Working'
          WHEN status = 'on_break' THEN 'On Break'
          WHEN status = 'clocked_out' THEN 'Completed'
          WHEN status = 'absent' THEN 'Absent'
          ELSE status
        END as status_display
      FROM employee_time_logs 
      ${whereClause}
      ORDER BY log_date DESC, created_at DESC
    `;

    const [timeLogs] = await connection.execute(timeLogsQuery, values);

    // Calculate summary statistics
    const totalDays = timeLogs.length;
    const presentDays = timeLogs.filter(log => log.status === 'clocked_out').length;
    const absentDays = timeLogs.filter(log => log.status === 'absent').length;
    const totalHours = timeLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
    const avgHoursPerDay = presentDays > 0 ? (totalHours / presentDays).toFixed(2) : 0;

    // Get current week summary
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const weekLogs = timeLogs.filter(log => {
      const logDate = new Date(log.log_date);
      return logDate >= startOfWeek && logDate <= endOfWeek;
    });

    const weekHours = weekLogs.reduce((sum, log) => sum + (log.total_hours || 0), 0);
    const weekDays = weekLogs.length;

    await connection.end();

    res.json({
      success: true,
      message: 'Employee time logs retrieved successfully',
      data: {
        employee_id: id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        time_logs: timeLogs,
        summary: {
          total_days: totalDays,
          present_days: presentDays,
          absent_days: absentDays,
          total_hours: totalHours,
          avg_hours_per_day: avgHoursPerDay,
          current_week: {
            days: weekDays,
            hours: weekHours,
            avg_hours_per_day: weekDays > 0 ? (weekHours / weekDays).toFixed(2) : 0
          }
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting employee time logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee time logs',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get team time tracking summary
 */
async function getTeamTimeTracking(req, res) {
  try {
    const { date_from, date_to, department, crew_id } = req.query;

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
    const params = [];

    if (department) {
      employeeFilter = 'AND e.department = ?';
      params.push(department);
    }

    if (crew_id) {
      employeeFilter += ' AND e.assigned_crew_id = ?';
      params.push(crew_id);
    }

    // Get team time tracking data
    const teamQuery = `
      SELECT 
        e.id,
        e.first_name,
        e.last_name,
        e.department,
        e.position,
        e.assigned_crew_id,
        COUNT(tl.log_date) as days_logged,
        SUM(CASE WHEN tl.status = 'clocked_out' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN tl.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(tl.total_hours) as total_hours,
        AVG(tl.total_hours) as avg_hours_per_day,
        MAX(tl.log_date) as last_log_date,
        CASE 
          WHEN MAX(tl.log_date) = CURDATE() THEN 'active_today'
          WHEN MAX(tl.log_date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN 'active_yesterday'
          ELSE 'inactive'
        END as activity_status
      FROM employees e
      LEFT JOIN employee_time_logs tl ON e.id = tl.employee_id 
        AND tl.log_date BETWEEN ? AND ?
      WHERE e.is_active = TRUE AND e.status = 'active'
        ${employeeFilter}
      GROUP BY e.id, e.first_name, e.last_name, e.department, e.position, e.assigned_crew_id
      ORDER BY e.department, e.last_name
    `;

    const [teamData] = await connection.execute(teamQuery, [date_from, date_to, ...params]);

    // Get current status for all employees
    const currentStatusQuery = `
      SELECT 
        e.id,
        tl.status as current_status,
        tl.clock_in,
        tl.break_start
      FROM employees e
      LEFT JOIN employee_time_logs tl ON e.id = tl.employee_id 
        AND tl.log_date = CURDATE()
      WHERE e.is_active = TRUE AND e.status = 'active'
        ${employeeFilter}
    `;

    const [currentStatus] = await connection.execute(currentStatusQuery, params);

    // Merge current status with team data
    const enrichedTeamData = teamData.map(employee => {
      const status = currentStatus.find(s => s.id === employee.id);
      return {
        ...employee,
        current_status: status?.current_status || 'not_logged_today',
        clock_in_time: status?.clock_in || null,
        break_start_time: status?.break_start || null
      };
    });

    // Calculate team summary
    const totalEmployees = enrichedTeamData.length;
    const activeToday = enrichedTeamData.filter(emp => emp.activity_status === 'active_today').length;
    const totalTeamHours = enrichedTeamData.reduce((sum, emp) => sum + (emp.total_hours || 0), 0);
    const avgTeamHours = totalEmployees > 0 ? (totalTeamHours / totalEmployees).toFixed(2) : 0;

    // Group by department
    const departmentBreakdown = {};
    enrichedTeamData.forEach(emp => {
      if (!departmentBreakdown[emp.department]) {
        departmentBreakdown[emp.department] = {
          count: 0,
          total_hours: 0,
          present_days: 0,
          absent_days: 0
        };
      }
      
      departmentBreakdown[emp.department].count++;
      departmentBreakdown[emp.department].total_hours += emp.total_hours || 0;
      departmentBreakdown[emp.department].present_days += emp.present_days || 0;
      departmentBreakdown[emp.department].absent_days += emp.absent_days || 0;
    });

    // Calculate averages per department
    Object.keys(departmentBreakdown).forEach(dept => {
      const deptData = departmentBreakdown[dept];
      deptData.avg_hours_per_employee = deptData.count > 0 ? (deptData.total_hours / deptData.count).toFixed(2) : 0;
      deptData.attendance_rate = deptData.count > 0 ? ((deptData.present_days / (deptData.present_days + deptData.absent_days)) * 100).toFixed(1) : 0;
    });

    await connection.end();

    res.json({
      success: true,
      message: 'Team time tracking summary retrieved successfully',
      data: {
        date_range: {
          from: date_from,
          to: date_to
        },
        filters: {
          department: department || 'all',
          crew_id: crew_id || 'all'
        },
        team_members: enrichedTeamData,
        department_breakdown: departmentBreakdown,
        summary: {
          total_employees: totalEmployees,
          active_today: activeToday,
          total_team_hours: totalTeamHours,
          avg_team_hours_per_employee: avgTeamHours,
          overall_attendance_rate: totalEmployees > 0 ? 
            ((enrichedTeamData.reduce((sum, emp) => sum + (emp.present_days || 0), 0) / 
              enrichedTeamData.reduce((sum, emp) => sum + (emp.present_days || 0) + (emp.absent_days || 0), 0)) * 100).toFixed(1) : 0
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting team time tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve team time tracking',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get time tracking analytics and reports
 */
async function getTimeTrackingAnalytics(req, res) {
  try {
    const { report_type, date_from, date_to, department } = req.query;

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
    let employeeFilter = '';
    const params = [];

    if (department) {
      employeeFilter = 'AND e.department = ?';
      params.push(department);
    }

    let reportData = {};

    if (report_type === 'attendance_analysis') {
      // Attendance analysis report
      const attendanceQuery = `
        SELECT 
          e.department,
          e.position,
          COUNT(DISTINCT e.id) as employee_count,
          COUNT(DISTINCT tl.employee_id) as employees_with_logs,
          SUM(CASE WHEN tl.status = 'clocked_out' THEN 1 ELSE 0 END) as present_days,
          SUM(CASE WHEN tl.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
          SUM(tl.total_hours) as total_hours,
          AVG(tl.total_hours) as avg_hours_per_day
        FROM employees e
        LEFT JOIN employee_time_logs tl ON e.id = tl.employee_id 
          AND tl.log_date BETWEEN ? AND ?
        WHERE e.is_active = TRUE AND e.status = 'active'
          ${employeeFilter}
        GROUP BY e.department, e.position
        ORDER BY e.department, e.position
      `;

      const [attendanceData] = await connection.execute(attendanceQuery, [date_from, date_to, ...params]);

      reportData = {
        report_type: 'attendance_analysis',
        attendance_data: attendanceData,
        summary: {
          total_departments: [...new Set(attendanceData.map(item => item.department))].length,
          total_positions: [...new Set(attendanceData.map(item => item.position))].length,
          total_employees: attendanceData.reduce((sum, item) => sum + (item.employee_count || 0), 0),
          total_present_days: attendanceData.reduce((sum, item) => sum + (item.present_days || 0), 0),
          total_absent_days: attendanceData.reduce((sum, item) => sum + (item.absent_days || 0), 0),
          total_hours: attendanceData.reduce((sum, item) => sum + (item.total_hours || 0), 0)
        }
      };

    } else if (report_type === 'overtime_analysis') {
      // Overtime analysis report
      const overtimeQuery = `
        SELECT 
          e.department,
          e.position,
          COUNT(DISTINCT e.id) as employee_count,
          SUM(CASE WHEN tl.total_hours > 8 THEN 1 ELSE 0 END) as days_with_overtime,
          SUM(CASE WHEN tl.total_hours > 8 THEN tl.total_hours - 8 ELSE 0 END) as total_overtime_hours,
          AVG(CASE WHEN tl.total_hours > 8 THEN tl.total_hours - 8 ELSE 0 END) as avg_overtime_per_day,
          MAX(CASE WHEN tl.total_hours > 8 THEN tl.total_hours - 8 ELSE 0 END) as max_overtime_hours
        FROM employees e
        LEFT JOIN employee_time_logs tl ON e.id = tl.employee_id 
          AND tl.log_date BETWEEN ? AND ?
          AND tl.status = 'clocked_out'
        WHERE e.is_active = TRUE AND e.status = 'active'
          ${employeeFilter}
        GROUP BY e.department, e.position
        ORDER BY total_overtime_hours DESC
      `;

      const [overtimeData] = await connection.execute(overtimeQuery, [date_from, date_to, ...params]);

      reportData = {
        report_type: 'overtime_analysis',
        overtime_data: overtimeData,
        summary: {
          total_employees: overtimeData.reduce((sum, item) => sum + (item.employee_count || 0), 0),
          total_overtime_days: overtimeData.reduce((sum, item) => sum + (item.days_with_overtime || 0), 0),
          total_overtime_hours: overtimeData.reduce((sum, item) => sum + (item.total_overtime_hours || 0), 0),
          avg_overtime_per_employee: overtimeData.reduce((sum, item) => sum + (item.employee_count || 0), 0) > 0 ? 
            (overtimeData.reduce((sum, item) => sum + (item.total_overtime_hours || 0), 0) / 
             overtimeData.reduce((sum, item) => sum + (item.employee_count || 0), 0)).toFixed(2) : 0
        }
      };

    } else {
      // Default: comprehensive time tracking report
      const comprehensiveQuery = `
        SELECT 
          e.department,
          COUNT(DISTINCT e.id) as employee_count,
          COUNT(DISTINCT tl.employee_id) as employees_with_logs,
          SUM(tl.total_hours) as total_hours,
          AVG(tl.total_hours) as avg_hours_per_day,
          SUM(CASE WHEN tl.status = 'clocked_out' THEN 1 ELSE 0 END) as present_days,
          SUM(CASE WHEN tl.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
          SUM(CASE WHEN tl.total_hours > 8 THEN tl.total_hours - 8 ELSE 0 END) as total_overtime_hours
        FROM employees e
        LEFT JOIN employee_time_logs tl ON e.id = tl.employee_id 
          AND tl.log_date BETWEEN ? AND ?
        WHERE e.is_active = TRUE AND e.status = 'active'
          ${employeeFilter}
        GROUP BY e.department
        ORDER BY total_hours DESC
      `;

      const [comprehensiveData] = await connection.execute(comprehensiveQuery, [date_from, date_to, ...params]);

      reportData = {
        report_type: 'comprehensive',
        comprehensive_data: comprehensiveData,
        summary: {
          total_departments: comprehensiveData.length,
          total_employees: comprehensiveData.reduce((sum, item) => sum + (item.employee_count || 0), 0),
          total_hours: comprehensiveData.reduce((sum, item) => sum + (item.total_hours || 0), 0),
          total_present_days: comprehensiveData.reduce((sum, item) => sum + (item.present_days || 0), 0),
          total_overtime_hours: comprehensiveData.reduce((sum, item) => sum + (item.total_overtime_hours || 0), 0)
        }
      };
    }

    await connection.end();

    res.json({
      success: true,
      message: 'Time tracking analytics retrieved successfully',
      data: {
        report_type: report_type || 'comprehensive',
        date_range: {
          from: date_from,
          to: date_to
        },
        department_filter: department || 'all',
        ...reportData
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting time tracking analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve time tracking analytics',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  clockInOut,
  getEmployeeTimeLogs,
  getTeamTimeTracking,
  getTimeTrackingAnalytics
};
