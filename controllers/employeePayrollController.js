const mysql = require('mysql2/promise');
const config = require('../config/database');

/**
 * Get employee payroll information for a specific period
 */
async function getEmployeePayroll(req, res) {
  try {
    const { id } = req.params;
    const { pay_period, date_from, date_to } = req.query;

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

    // Get current pay rate
    const payRateQuery = `
      SELECT 
        pay_type, base_rate, overtime_rate, overtime_multiplier,
        holiday_rate, holiday_multiplier, weekend_rate, weekend_multiplier,
        effective_date
      FROM employee_pay_rates 
      WHERE employee_id = ? AND is_current = TRUE
      ORDER BY effective_date DESC
      LIMIT 1
    `;

    const [payRates] = await connection.execute(payRateQuery, [id]);

    if (payRates.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'No pay rate found for employee',
        error: 'NO_PAY_RATE_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const currentPayRate = payRates[0];

    // Determine pay period dates
    let periodStart, periodEnd;
    const today = new Date();
    
    if (pay_period === 'weekly') {
      // Current week (Monday to Sunday)
      const dayOfWeek = today.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      periodStart = new Date(today);
      periodStart.setDate(today.getDate() - daysFromMonday);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
    } else if (pay_period === 'biweekly') {
      // Current bi-weekly period
      const weekNumber = Math.floor(today.getTime() / (7 * 24 * 60 * 60 * 1000));
      const biweekNumber = Math.floor(weekNumber / 2);
      periodStart = new Date(today);
      periodStart.setDate(today.getDate() - (biweekNumber * 14));
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 13);
    } else {
      // Monthly (current month)
      periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
      periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    // Override with provided dates if specified
    if (date_from) periodStart = new Date(date_from);
    if (date_to) periodEnd = new Date(date_to);

    // Get time logs for the period
    const timeLogsQuery = `
      SELECT 
        log_date,
        total_hours,
        regular_hours,
        overtime_hours,
        holiday_hours,
        weekend_hours,
        status
      FROM employee_time_logs 
      WHERE employee_id = ? 
        AND log_date BETWEEN ? AND ?
        AND status = 'present'
      ORDER BY log_date
    `;

    const [timeLogs] = await connection.execute(timeLogsQuery, [
      id, 
      periodStart.toISOString().split('T')[0], 
      periodEnd.toISOString().split('T')[0]
    ]);

    // Calculate payroll
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;
    let totalHolidayHours = 0;
    let totalWeekendHours = 0;

    timeLogs.forEach(log => {
      totalRegularHours += log.regular_hours || 0;
      totalOvertimeHours += log.overtime_hours || 0;
      totalHolidayHours += log.holiday_hours || 0;
      totalWeekendHours += log.weekend_hours || 0;
    });

    // Calculate pay amounts
    const regularPay = totalRegularHours * currentPayRate.base_rate;
    const overtimePay = totalOvertimeHours * (currentPayRate.overtime_rate || currentPayRate.base_rate * currentPayRate.overtime_multiplier);
    const holidayPay = totalHolidayHours * (currentPayRate.holiday_rate || currentPayRate.base_rate * currentPayRate.holiday_multiplier);
    const weekendPay = totalWeekendHours * (currentPayRate.weekend_rate || currentPayRate.base_rate * currentPayRate.weekend_multiplier);

    const grossPay = regularPay + overtimePay + holidayPay + weekendPay;

    // Calculate deductions (placeholder - would be based on benefits and tax tables)
    const deductions = calculateDeductions(grossPay, employee.id);
    const netPay = grossPay - deductions;

    // Get payroll history
    const payrollHistoryQuery = `
      SELECT 
        DATE_FORMAT(?, '%Y-%m-%d') as period_start,
        DATE_FORMAT(?, '%Y-%m-%d') as period_end,
        ? as gross_pay,
        ? as net_pay,
        ? as deductions,
        CURDATE() as pay_date
    `;

    const [payrollHistory] = await connection.execute(payrollHistoryQuery, [
      periodStart,
      periodEnd,
      grossPay,
      netPay,
      deductions
    ]);

    // Get YTD totals
    const ytdQuery = `
      SELECT 
        SUM(total_hours) as total_hours,
        SUM(regular_hours) as regular_hours,
        SUM(overtime_hours) as overtime_hours
      FROM employee_time_logs 
      WHERE employee_id = ? 
        AND YEAR(log_date) = YEAR(CURDATE())
        AND status = 'present'
    `;

    const [ytdData] = await connection.execute(ytdQuery, [id]);

    const ytdRegularPay = (ytdData[0]?.regular_hours || 0) * currentPayRate.base_rate;
    const ytdOvertimePay = (ytdData[0]?.overtime_hours || 0) * (currentPayRate.overtime_rate || currentPayRate.base_rate * currentPayRate.overtime_multiplier);
    const ytdGrossPay = ytdRegularPay + ytdOvertimePay;

    await connection.end();

    res.json({
      success: true,
      message: 'Employee payroll retrieved successfully',
      data: {
        employee_id: id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        pay_period: pay_period || 'biweekly',
        current_pay_period: {
          start_date: periodStart.toISOString().split('T')[0],
          end_date: periodEnd.toISOString().split('T')[0],
          regular_hours: totalRegularHours,
          overtime_hours: totalOvertimeHours,
          holiday_hours: totalHolidayHours,
          weekend_hours: totalWeekendHours,
          regular_pay: regularPay,
          overtime_pay: overtimePay,
          holiday_pay: holidayPay,
          weekend_pay: weekendPay,
          gross_pay: grossPay,
          deductions: deductions,
          net_pay: netPay
        },
        payroll_history: [payrollHistory[0]],
        summary: {
          total_gross_pay: grossPay,
          total_net_pay: netPay,
          total_deductions: deductions,
          ytd_gross_pay: ytdGrossPay
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting employee payroll:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee payroll',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Calculate payroll deductions (placeholder implementation)
 */
function calculateDeductions(grossPay, employeeId) {
  // This would typically involve:
  // - Tax calculations based on tax tables
  // - Benefit deductions from employee_benefits table
  // - Retirement contributions
  // - Other deductions
  
  // For now, use a simple percentage-based calculation
  const taxRate = 0.20; // 20% tax rate
  const benefitsRate = 0.05; // 5% benefits
  const retirementRate = 0.03; // 3% retirement
  
  const totalDeductionRate = taxRate + benefitsRate + retirementRate;
  return grossPay * totalDeductionRate;
}

/**
 * Get payroll summary for all employees
 */
async function getPayrollSummary(req, res) {
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

    // Get all active employees
    const employeesQuery = `
      SELECT 
        e.id, e.first_name, e.last_name, e.department, e.position,
        pr.base_rate, pr.overtime_rate, pr.overtime_multiplier
      FROM employees e
      LEFT JOIN employee_pay_rates pr ON e.id = pr.employee_id AND pr.is_current = TRUE
      WHERE e.is_active = TRUE AND e.status = 'active'
      ${deptFilter}
      ORDER BY e.department, e.last_name
    `;

    const [employees] = await connection.execute(employeesQuery, deptParams);

    if (employees.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'No employees found',
        error: 'NO_EMPLOYEES_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    const employeeIds = employees.map(emp => emp.id);
    const placeholders = employeeIds.map(() => '?').join(',');

    // Get time logs for all employees in the period
    const timeLogsQuery = `
      SELECT 
        employee_id,
        SUM(total_hours) as total_hours,
        SUM(regular_hours) as regular_hours,
        SUM(overtime_hours) as overtime_hours,
        SUM(holiday_hours) as holiday_hours,
        SUM(weekend_hours) as weekend_hours
      FROM employee_time_logs 
      WHERE employee_id IN (${placeholders})
        AND log_date BETWEEN ? AND ?
        AND status = 'present'
      GROUP BY employee_id
    `;

    const [timeLogs] = await connection.execute(timeLogsQuery, [
      ...employeeIds,
      date_from,
      date_to
    ]);

    // Calculate payroll for each employee
    const payrollData = employees.map(emp => {
      const timeLog = timeLogs.find(tl => tl.employee_id === emp.id);
      const baseRate = emp.base_rate || 0;
      const overtimeRate = emp.overtime_rate || (baseRate * (emp.overtime_multiplier || 1.5));

      if (!timeLog) {
        return {
          employee_id: emp.id,
          employee_name: `${emp.first_name} ${emp.last_name}`,
          department: emp.department,
          position: emp.position,
          hours_worked: 0,
          gross_pay: 0,
          deductions: 0,
          net_pay: 0
        };
      }

      const regularPay = (timeLog.regular_hours || 0) * baseRate;
      const overtimePay = (timeLog.overtime_hours || 0) * overtimeRate;
      const holidayPay = (timeLog.holiday_hours || 0) * baseRate * 1.5;
      const weekendPay = (timeLog.weekend_hours || 0) * baseRate * 1.25;

      const grossPay = regularPay + overtimePay + holidayPay + weekendPay;
      const deductions = calculateDeductions(grossPay, emp.id);
      const netPay = grossPay - deductions;

      return {
        employee_id: emp.id,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        department: emp.department,
        position: emp.position,
        hours_worked: timeLog.total_hours || 0,
        regular_hours: timeLog.regular_hours || 0,
        overtime_hours: timeLog.overtime_hours || 0,
        holiday_hours: timeLog.holiday_hours || 0,
        weekend_hours: timeLog.weekend_hours || 0,
        gross_pay: grossPay,
        deductions: deductions,
        net_pay: netPay
      };
    });

    // Calculate summary statistics
    const totalGrossPay = payrollData.reduce((sum, emp) => sum + emp.gross_pay, 0);
    const totalNetPay = payrollData.reduce((sum, emp) => sum + emp.net_pay, 0);
    const totalDeductions = payrollData.reduce((sum, emp) => sum + emp.deductions, 0);
    const totalHours = payrollData.reduce((sum, emp) => sum + emp.hours_worked, 0);

    // Group by department
    const departmentBreakdown = {};
    payrollData.forEach(emp => {
      if (!departmentBreakdown[emp.department]) {
        departmentBreakdown[emp.department] = {
          count: 0,
          total_gross_pay: 0,
          total_net_pay: 0,
          total_deductions: 0,
          total_hours: 0,
          avg_gross_pay: 0
        };
      }
      
      departmentBreakdown[emp.department].count++;
      departmentBreakdown[emp.department].total_gross_pay += emp.gross_pay;
      departmentBreakdown[emp.department].total_net_pay += emp.net_pay;
      departmentBreakdown[emp.department].total_deductions += emp.deductions;
      departmentBreakdown[emp.department].total_hours += emp.hours_worked;
    });

    // Calculate averages
    Object.keys(departmentBreakdown).forEach(dept => {
      const deptData = departmentBreakdown[dept];
      deptData.avg_gross_pay = deptData.count > 0 ? deptData.total_gross_pay / deptData.count : 0;
    });

    await connection.end();

    res.json({
      success: true,
      message: 'Payroll summary retrieved successfully',
      data: {
        date_range: {
          from: date_from,
          to: date_to
        },
        department_filter: department || 'all',
        employee_payroll: payrollData,
        department_breakdown: departmentBreakdown,
        summary: {
          total_employees: payrollData.length,
          total_gross_pay: totalGrossPay,
          total_net_pay: totalNetPay,
          total_deductions: totalDeductions,
          total_hours: totalHours,
          avg_gross_pay_per_employee: payrollData.length > 0 ? totalGrossPay / payrollData.length : 0
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting payroll summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payroll summary',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get payroll reports and analytics
 */
async function getPayrollReports(req, res) {
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
    const deptFilter = department ? 'AND e.department = ?' : '';
    const deptParams = department ? [department] : [];

    let reportData = {};

    if (report_type === 'overtime_analysis') {
      // Overtime analysis report
      const overtimeQuery = `
        SELECT 
          e.first_name, e.last_name, e.department, e.position,
          SUM(tl.overtime_hours) as total_overtime_hours,
          AVG(tl.overtime_hours) as avg_overtime_hours_per_day,
          COUNT(DISTINCT tl.log_date) as days_with_overtime,
          pr.base_rate,
          SUM(tl.overtime_hours) * (pr.overtime_rate OR pr.base_rate * pr.overtime_multiplier) as overtime_pay
        FROM employees e
        LEFT JOIN employee_pay_rates pr ON e.id = pr.employee_id AND pr.is_current = TRUE
        LEFT JOIN employee_time_logs tl ON e.id = tl.employee_id
        WHERE e.is_active = TRUE AND e.status = 'active'
          AND tl.log_date BETWEEN ? AND ?
          AND tl.overtime_hours > 0
          ${deptFilter}
        GROUP BY e.id, e.first_name, e.last_name, e.department, e.position, pr.base_rate, pr.overtime_rate, pr.overtime_multiplier
        ORDER BY total_overtime_hours DESC
      `;

      const [overtimeData] = await connection.execute(overtimeQuery, [date_from, date_to, ...deptParams]);

      reportData = {
        report_type: 'overtime_analysis',
        overtime_data: overtimeData,
        summary: {
          total_employees_with_overtime: overtimeData.length,
          total_overtime_hours: overtimeData.reduce((sum, emp) => sum + (emp.total_overtime_hours || 0), 0),
          total_overtime_pay: overtimeData.reduce((sum, emp) => sum + (emp.overtime_pay || 0), 0),
          avg_overtime_hours_per_employee: overtimeData.length > 0 ? 
            overtimeData.reduce((sum, emp) => sum + (emp.total_overtime_hours || 0), 0) / overtimeData.length : 0
        }
      };

    } else if (report_type === 'cost_analysis') {
      // Cost analysis report
      const costQuery = `
        SELECT 
          e.department,
          COUNT(DISTINCT e.id) as employee_count,
          SUM(tl.total_hours) as total_hours,
          SUM(tl.regular_hours) as regular_hours,
          SUM(tl.overtime_hours) as overtime_hours,
          AVG(pr.base_rate) as avg_base_rate,
          SUM(tl.regular_hours * pr.base_rate) as regular_pay,
          SUM(tl.overtime_hours * (pr.overtime_rate OR pr.base_rate * pr.overtime_multiplier)) as overtime_pay
        FROM employees e
        LEFT JOIN employee_pay_rates pr ON e.id = pr.employee_id AND pr.is_current = TRUE
        LEFT JOIN employee_time_logs tl ON e.id = tl.employee_id
        WHERE e.is_active = TRUE AND e.status = 'active'
          AND tl.log_date BETWEEN ? AND ?
          ${deptFilter}
        GROUP BY e.department
        ORDER BY (regular_pay + overtime_pay) DESC
      `;

      const [costData] = await connection.execute(costQuery, [date_from, date_to, ...deptParams]);

      reportData = {
        report_type: 'cost_analysis',
        cost_data: costData,
        summary: {
          total_departments: costData.length,
          total_employees: costData.reduce((sum, dept) => sum + (dept.employee_count || 0), 0),
          total_labor_cost: costData.reduce((sum, dept) => sum + (dept.regular_pay || 0) + (dept.overtime_pay || 0), 0),
          total_hours: costData.reduce((sum, dept) => sum + (dept.total_hours || 0), 0)
        }
      };

    } else {
      // Default: comprehensive payroll report
      const comprehensiveQuery = `
        SELECT 
          e.first_name, e.last_name, e.department, e.position,
          pr.base_rate,
          pr.overtime_rate,
          pr.overtime_multiplier,
          SUM(tl.total_hours) as total_hours,
          SUM(tl.regular_hours) as regular_hours,
          SUM(tl.overtime_hours) as overtime_hours,
          SUM(tl.regular_hours * pr.base_rate) as regular_pay,
          SUM(tl.overtime_hours * (pr.overtime_rate OR pr.base_rate * pr.overtime_multiplier)) as overtime_pay,
          SUM(tl.regular_hours * pr.base_rate) + SUM(tl.overtime_hours * (pr.overtime_rate OR pr.base_rate * pr.overtime_multiplier)) as gross_pay
        FROM employees e
        LEFT JOIN employee_pay_rates pr ON e.id = pr.employee_id AND pr.is_current = TRUE
        LEFT JOIN employee_time_logs tl ON e.id = tl.employee_id
        WHERE e.is_active = TRUE AND e.status = 'active'
          AND tl.log_date BETWEEN ? AND ?
          ${deptFilter}
        GROUP BY e.id, e.first_name, e.last_name, e.department, e.position, pr.base_rate, pr.overtime_rate, pr.overtime_multiplier
        ORDER BY gross_pay DESC
      `;

      const [comprehensiveData] = await connection.execute(comprehensiveQuery, [date_from, date_to, ...deptParams]);

      reportData = {
        report_type: 'comprehensive',
        comprehensive_data: comprehensiveData,
        summary: {
          total_employees: comprehensiveData.length,
          total_gross_pay: comprehensiveData.reduce((sum, emp) => sum + (emp.gross_pay || 0), 0),
          total_hours: comprehensiveData.reduce((sum, emp) => sum + (emp.total_hours || 0), 0),
          avg_gross_pay_per_employee: comprehensiveData.length > 0 ? 
            comprehensiveData.reduce((sum, emp) => sum + (emp.gross_pay || 0), 0) / comprehensiveData.length : 0
        }
      };
    }

    await connection.end();

    res.json({
      success: true,
      message: 'Payroll report generated successfully',
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
    console.error('Error getting payroll reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payroll report',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getEmployeePayroll,
  getPayrollSummary,
  getPayrollReports
};
