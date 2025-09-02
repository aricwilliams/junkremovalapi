const mysql = require('mysql2/promise');
const config = require('../config/database');

/**
 * Get employee summary report
 */
async function getEmployeeSummaryReport(req, res) {
  try {
    const { date_from, date_to, department, format } = req.query;

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

    // Get employee summary data
    const summaryQuery = `
      SELECT 
        e.department,
        e.position,
        COUNT(DISTINCT e.id) as total_employees,
        SUM(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END) as active_employees,
        SUM(CASE WHEN e.status = 'inactive' THEN 1 ELSE 0 END) as inactive_employees,
        SUM(CASE WHEN e.status = 'on-leave' THEN 1 ELSE 0 END) as on_leave_employees,
        SUM(CASE WHEN e.status = 'terminated' THEN 1 ELSE 0 END) as terminated_employees,
        SUM(CASE WHEN e.status = 'suspended' THEN 1 ELSE 0 END) as suspended_employees,
        SUM(CASE WHEN e.status = 'probation' THEN 1 ELSE 0 END) as probation_employees,
        AVG(DATEDIFF(CURDATE(), e.hire_date)) as avg_tenure_days,
        MIN(e.hire_date) as earliest_hire_date,
        MAX(e.hire_date) as latest_hire_date
      FROM employees e
      WHERE e.is_active = TRUE
        ${employeeFilter}
      GROUP BY e.department, e.position
      ORDER BY e.department, e.position
    `;

    const [summaryData] = await connection.execute(summaryQuery, params);

    // Get hiring trends
    const hiringTrendsQuery = `
      SELECT 
        YEAR(hire_date) as hire_year,
        MONTH(hire_date) as hire_month,
        COUNT(*) as new_hires
      FROM employees
      WHERE hire_date BETWEEN ? AND ?
        ${employeeFilter}
      GROUP BY YEAR(hire_date), MONTH(hire_date)
      ORDER BY hire_year DESC, hire_month DESC
      LIMIT 24
    `;

    const [hiringTrends] = await connection.execute(hiringTrendsQuery, [date_from, date_to, ...params]);

    // Get termination trends
    const terminationTrendsQuery = `
      SELECT 
        YEAR(termination_date) as termination_year,
        MONTH(termination_date) as termination_month,
        COUNT(*) as terminations
      FROM employees
      WHERE termination_date BETWEEN ? AND ?
        AND status = 'terminated'
        ${employeeFilter}
      GROUP BY YEAR(termination_date), MONTH(termination_date)
      ORDER BY termination_year DESC, termination_month DESC
      LIMIT 24
    `;

    const [terminationTrends] = await connection.execute(terminationTrendsQuery, [date_from, date_to, ...params]);

    // Get salary distribution
    const salaryQuery = `
      SELECT 
        e.department,
        e.position,
        COUNT(DISTINCT e.id) as employee_count,
        AVG(pr.base_rate) as avg_base_rate,
        MIN(pr.base_rate) as min_base_rate,
        MAX(pr.base_rate) as max_base_rate,
        SUM(pr.base_rate) as total_salary_cost
      FROM employees e
      LEFT JOIN employee_pay_rates pr ON e.id = pr.employee_id AND pr.is_current = TRUE
      WHERE e.is_active = TRUE AND e.status = 'active'
        AND pr.base_rate IS NOT NULL
        ${employeeFilter}
      GROUP BY e.department, e.position
      ORDER BY avg_base_rate DESC
    `;

    const [salaryData] = await connection.execute(salaryQuery, params);

    // Get performance summary
    const performanceQuery = `
      SELECT 
        e.department,
        e.position,
        COUNT(DISTINCT e.id) as employee_count,
        AVG(p.overall_rating) as avg_performance_rating,
        COUNT(CASE WHEN p.overall_rating >= 4.0 THEN 1 END) as high_performers,
        COUNT(CASE WHEN p.overall_rating < 3.0 THEN 1 END) as low_performers,
        AVG(DATEDIFF(p.next_review_date, CURDATE())) as avg_days_to_next_review
      FROM employees e
      LEFT JOIN employee_performance p ON e.id = p.employee_id 
        AND p.status = 'completed'
        AND p.review_date BETWEEN ? AND ?
      WHERE e.is_active = TRUE AND e.status = 'active'
        ${employeeFilter}
      GROUP BY e.department, e.position
      ORDER BY avg_performance_rating DESC
    `;

    const [performanceData] = await connection.execute(performanceQuery, [date_from, date_to, ...params]);

    await connection.end();

    // Calculate overall summary
    const totalEmployees = summaryData.reduce((sum, item) => sum + (item.total_employees || 0), 0);
    const activeEmployees = summaryData.reduce((sum, item) => sum + (item.active_employees || 0), 0);
    const avgTenure = summaryData.reduce((sum, item) => sum + (item.avg_tenure_days || 0), 0) / summaryData.length;

    // Calculate salary metrics
    const totalSalaryCost = salaryData.reduce((sum, item) => sum + (item.total_salary_cost || 0), 0);
    const avgSalary = salaryData.reduce((sum, item) => sum + (item.avg_base_rate || 0), 0) / salaryData.length;

    // Calculate performance metrics
    const avgPerformance = performanceData.reduce((sum, item) => sum + (item.avg_performance_rating || 0), 0) / performanceData.length;
    const highPerformers = performanceData.reduce((sum, item) => sum + (item.high_performers || 0), 0);

    const reportData = {
      report_type: 'employee_summary',
      date_range: {
        from: date_from,
        to: date_to
      },
      department_filter: department || 'all',
      employee_summary: summaryData,
      hiring_trends: hiringTrends,
      termination_trends: terminationTrends,
      salary_analysis: salaryData,
      performance_summary: performanceData,
      overall_summary: {
        total_employees: totalEmployees,
        active_employees: activeEmployees,
        inactive_employees: totalEmployees - activeEmployees,
        avg_tenure_days: Math.round(avgTenure),
        total_salary_cost: totalSalaryCost,
        avg_salary: Math.round(avgSalary * 100) / 100,
        avg_performance_rating: Math.round(avgPerformance * 10) / 10,
        high_performers: highPerformers,
        high_performer_percentage: totalEmployees > 0 ? Math.round((highPerformers / totalEmployees) * 100) : 0
      }
    };

    // Handle PDF format (placeholder)
    if (format === 'pdf') {
      // This would generate a PDF report
      // For now, return JSON with PDF generation note
      reportData.pdf_note = 'PDF generation would be implemented here';
    }

    res.json({
      success: true,
      message: 'Employee summary report generated successfully',
      data: reportData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating employee summary report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate employee summary report',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get employee performance report
 */
async function getEmployeePerformanceReport(req, res) {
  try {
    const { date_from, date_to, department, performance_threshold, format } = req.query;

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

    // Get performance data
    const performanceQuery = `
      SELECT 
        e.id,
        e.first_name,
        e.last_name,
        e.department,
        e.position,
        e.hire_date,
        p.review_type,
        p.review_date,
        p.overall_rating,
        p.next_review_date,
        p.status as review_status,
        p.comments,
        p.goals,
        p.achievements,
        p.areas_for_improvement,
        p.training_recommendations,
        p.promotion_eligibility,
        p.salary_recommendation,
        DATEDIFF(p.next_review_date, CURDATE()) as days_to_next_review
      FROM employees e
      LEFT JOIN employee_performance p ON e.id = p.employee_id 
        AND p.review_date BETWEEN ? AND ?
      WHERE e.is_active = TRUE AND e.status = 'active'
        ${employeeFilter}
      ORDER BY e.department, e.last_name, p.review_date DESC
    `;

    const [performanceData] = await connection.execute(performanceQuery, [date_from, date_to, ...params]);

    // Get performance metrics
    const metricsQuery = `
      SELECT 
        p.performance_id,
        pm.metric_name,
        pm.metric_category,
        pm.rating,
        pm.max_rating,
        pm.weight,
        pm.comments
      FROM employee_performance_metrics pm
      JOIN employee_performance p ON pm.performance_id = p.id
      JOIN employees e ON p.employee_id = e.id
      WHERE p.review_date BETWEEN ? AND ?
        AND e.is_active = TRUE AND e.status = 'active'
        ${employeeFilter}
      ORDER BY p.employee_id, pm.metric_category, pm.metric_name
    `;

    const [metricsData] = await connection.execute(metricsQuery, [date_from, date_to, ...params]);

    // Get training completion data
    const trainingQuery = `
      SELECT 
        e.id,
        e.department,
        e.position,
        COUNT(t.id) as total_training,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_training,
        SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_training,
        SUM(t.duration_hours) as total_training_hours,
        AVG(t.score) as avg_training_score
      FROM employees e
      LEFT JOIN employee_training t ON e.id = t.employee_id 
        AND t.start_date BETWEEN ? AND ?
      WHERE e.is_active = TRUE AND e.status = 'active'
        ${employeeFilter}
      GROUP BY e.id, e.department, e.position
      ORDER BY e.department, e.last_name
    `;

    const [trainingData] = await connection.execute(trainingQuery, [date_from, date_to, ...params]);

    // Get attendance data
    const attendanceQuery = `
      SELECT 
        e.id,
        e.department,
        e.position,
        COUNT(tl.log_date) as total_days,
        SUM(CASE WHEN tl.status = 'clocked_out' THEN 1 ELSE 0 END) as present_days,
        SUM(CASE WHEN tl.status = 'absent' THEN 1 ELSE 0 END) as absent_days,
        SUM(tl.total_hours) as total_hours,
        AVG(tl.total_hours) as avg_hours_per_day
      FROM employees e
      LEFT JOIN employee_time_logs tl ON e.id = tl.employee_id 
        AND tl.log_date BETWEEN ? AND ?
      WHERE e.is_active = TRUE AND e.status = 'active'
        ${employeeFilter}
      GROUP BY e.id, e.department, e.position
      ORDER BY e.department, e.last_name
    `;

    const [attendanceData] = await connection.execute(attendanceQuery, [date_from, date_to, ...params]);

    await connection.end();

    // Merge all data
    const enrichedPerformanceData = performanceData.map(emp => {
      const metrics = metricsData.filter(m => m.performance_id === emp.id);
      const training = trainingData.find(t => t.id === emp.id);
      const attendance = attendanceData.find(a => a.id === emp.id);

      // Calculate attendance rate
      const attendanceRate = attendance && attendance.total_days > 0 ? 
        ((attendance.present_days / attendance.total_days) * 100).toFixed(1) : 0;

      // Calculate training completion rate
      const trainingCompletionRate = training && training.total_training > 0 ? 
        ((training.completed_training / training.total_training) * 100).toFixed(1) : 0;

      // Determine performance status
      let performanceStatus = 'good';
      if (emp.overall_rating < (performance_threshold || 3.0)) {
        performanceStatus = 'needs_improvement';
      } else if (emp.overall_rating >= 4.5) {
        performanceStatus = 'excellent';
      } else if (emp.overall_rating >= 4.0) {
        performanceStatus = 'above_average';
      }

      return {
        ...emp,
        metrics: metrics,
        training_summary: training || {
          total_training: 0,
          completed_training: 0,
          failed_training: 0,
          total_training_hours: 0,
          avg_training_score: 0
        },
        attendance_summary: attendance || {
          total_days: 0,
          present_days: 0,
          absent_days: 0,
          total_hours: 0,
          avg_hours_per_day: 0
        },
        calculated_metrics: {
          attendance_rate: attendanceRate,
          training_completion_rate: trainingCompletionRate,
          performance_status: performanceStatus,
          days_to_next_review: emp.days_to_next_review || 0
        }
      };
    });

    // Calculate summary statistics
    const totalEmployees = enrichedPerformanceData.length;
    const employeesWithReviews = enrichedPerformanceData.filter(emp => emp.overall_rating).length;
    const avgRating = employeesWithReviews > 0 ? 
      enrichedPerformanceData.reduce((sum, emp) => sum + (emp.overall_rating || 0), 0) / employeesWithReviews : 0;

    const performanceBreakdown = {
      excellent: enrichedPerformanceData.filter(emp => emp.calculated_metrics.performance_status === 'excellent').length,
      above_average: enrichedPerformanceData.filter(emp => emp.calculated_metrics.performance_status === 'above_average').length,
      good: enrichedPerformanceData.filter(emp => emp.calculated_metrics.performance_status === 'good').length,
      needs_improvement: enrichedPerformanceData.filter(emp => emp.calculated_metrics.performance_status === 'needs_improvement').length
    };

    const avgAttendanceRate = totalEmployees > 0 ? 
      enrichedPerformanceData.reduce((sum, emp) => sum + parseFloat(emp.calculated_metrics.attendance_rate), 0) / totalEmployees : 0;

    const avgTrainingCompletionRate = totalEmployees > 0 ? 
      enrichedPerformanceData.reduce((sum, emp) => sum + parseFloat(emp.calculated_metrics.training_completion_rate), 0) / totalEmployees : 0;

    const reportData = {
      report_type: 'employee_performance',
      date_range: {
        from: date_from,
        to: date_to
      },
      filters: {
        department: department || 'all',
        performance_threshold: performance_threshold || 3.0
      },
      employee_performance: enrichedPerformanceData,
      summary: {
        total_employees: totalEmployees,
        employees_with_reviews: employeesWithReviews,
        avg_performance_rating: Math.round(avgRating * 10) / 10,
        performance_breakdown: performanceBreakdown,
        avg_attendance_rate: Math.round(avgAttendanceRate * 10) / 10,
        avg_training_completion_rate: Math.round(avgTrainingCompletionRate * 10) / 10,
        employees_needing_reviews: enrichedPerformanceData.filter(emp => emp.days_to_next_review <= 30).length
      }
    };

    // Handle PDF format (placeholder)
    if (format === 'pdf') {
      reportData.pdf_note = 'PDF generation would be implemented here';
    }

    res.json({
      success: true,
      message: 'Employee performance report generated successfully',
      data: reportData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating employee performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate employee performance report',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get employee turnover analysis
 */
async function getEmployeeTurnoverAnalysis(req, res) {
  try {
    const { date_from, date_to, department, format } = req.query;

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

    // Get hiring data
    const hiringQuery = `
      SELECT 
        e.department,
        e.position,
        COUNT(*) as new_hires,
        AVG(DATEDIFF(CURDATE(), e.hire_date)) as avg_tenure_days
      FROM employees e
      WHERE e.hire_date BETWEEN ? AND ?
        AND e.is_active = TRUE
        ${employeeFilter}
      GROUP BY e.department, e.position
      ORDER BY new_hires DESC
    `;

    const [hiringData] = await connection.execute(hiringQuery, [date_from, date_to, ...params]);

    // Get termination data
    const terminationQuery = `
      SELECT 
        e.department,
        e.position,
        COUNT(*) as terminations,
        AVG(DATEDIFF(e.termination_date, e.hire_date)) as avg_tenure_before_termination,
        e.termination_reason
      FROM employees e
      WHERE e.termination_date BETWEEN ? AND ?
        AND e.status = 'terminated'
        ${employeeFilter}
      GROUP BY e.department, e.position, e.termination_reason
      ORDER BY terminations DESC
    `;

    const [terminationData] = await connection.execute(terminationQuery, [date_from, date_to, ...params]);

    // Get current employee count
    const currentCountQuery = `
      SELECT 
        e.department,
        e.position,
        COUNT(*) as current_employees
      FROM employees e
      WHERE e.is_active = TRUE AND e.status = 'active'
        ${employeeFilter}
      GROUP BY e.department, e.position
      ORDER BY current_employees DESC
    `;

    const [currentCountData] = await connection.execute(currentCountQuery, params);

    // Get voluntary vs involuntary terminations
    const voluntaryTerminationQuery = `
      SELECT 
        e.department,
        COUNT(*) as voluntary_terminations,
        COUNT(CASE WHEN e.termination_reason LIKE '%resigned%' OR e.termination_reason LIKE '%quit%' THEN 1 END) as resignations,
        COUNT(CASE WHEN e.termination_reason LIKE '%retired%' THEN 1 END) as retirements
      FROM employees e
      WHERE e.termination_date BETWEEN ? AND ?
        AND e.status = 'terminated'
        ${employeeFilter}
      GROUP BY e.department
      ORDER BY voluntary_terminations DESC
    `;

    const [voluntaryTerminationData] = await connection.execute(voluntaryTerminationQuery, [date_from, date_to, ...params]);

    await connection.end();

    // Calculate turnover rates
    const turnoverAnalysis = currentCountData.map(current => {
      const hiring = hiringData.find(h => h.department === current.department && h.position === current.position);
      const termination = terminationData.find(t => t.department === current.department && t.position === current.position);

      const newHires = hiring ? hiring.new_hires : 0;
      const terminations = termination ? termination.terminations : 0;
      const currentEmployees = current.current_employees;

      // Calculate turnover rate (terminations / average headcount)
      const avgHeadcount = (currentEmployees + (currentEmployees - terminations + newHires)) / 2;
      const turnoverRate = avgHeadcount > 0 ? (terminations / avgHeadcount * 100).toFixed(2) : 0;

      return {
        department: current.department,
        position: current.position,
        current_employees: currentEmployees,
        new_hires: newHires,
        terminations: terminations,
        turnover_rate: turnoverRate,
        retention_rate: avgHeadcount > 0 ? (100 - parseFloat(turnoverRate)).toFixed(2) : 100
      };
    });

    // Calculate overall metrics
    const totalNewHires = hiringData.reduce((sum, item) => sum + item.new_hires, 0);
    const totalTerminations = terminationData.reduce((sum, item) => sum + item.terminations, 0);
    const totalCurrentEmployees = currentCountData.reduce((sum, item) => sum + item.current_employees, 0);

    const overallTurnoverRate = totalCurrentEmployees > 0 ? 
      (totalTerminations / totalCurrentEmployees * 100).toFixed(2) : 0;

    const reportData = {
      report_type: 'employee_turnover_analysis',
      date_range: {
        from: date_from,
        to: date_to
      },
      department_filter: department || 'all',
      hiring_analysis: hiringData,
      termination_analysis: terminationData,
      turnover_analysis: turnoverAnalysis,
      voluntary_terminations: voluntaryTerminationData,
      summary: {
        total_new_hires: totalNewHires,
        total_terminations: totalTerminations,
        total_current_employees: totalCurrentEmployees,
        overall_turnover_rate: overallTurnoverRate,
        overall_retention_rate: (100 - parseFloat(overallTurnoverRate)).toFixed(2),
        net_employee_change: totalNewHires - totalTerminations
      }
    };

    // Handle PDF format (placeholder)
    if (format === 'pdf') {
      reportData.pdf_note = 'PDF generation would be implemented here';
    }

    res.json({
      success: true,
      message: 'Employee turnover analysis generated successfully',
      data: reportData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating employee turnover analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate employee turnover analysis',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getEmployeeSummaryReport,
  getEmployeePerformanceReport,
  getEmployeeTurnoverAnalysis
};
