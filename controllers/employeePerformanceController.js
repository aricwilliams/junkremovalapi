const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/database');

/**
 * Get employee performance metrics and reviews
 */
async function getEmployeePerformance(req, res) {
  try {
    const { id } = req.params;
    const { review_year, metric_type } = req.query;

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

    // Build year filter
    const yearFilter = review_year ? 'AND YEAR(review_date) = ?' : '';
    const yearParams = review_year ? [review_year] : [];

    // Get performance reviews
    const reviewsQuery = `
      SELECT 
        p.*,
        CONCAT(r.first_name, ' ', r.last_name) as reviewer_name
      FROM employee_performance p
      LEFT JOIN employees r ON p.reviewer_id = r.id
      WHERE p.employee_id = ?
      ${yearFilter}
      ORDER BY p.review_date DESC
    `;

    const [reviews] = await connection.execute(reviewsQuery, [id, ...yearParams]);

    // Get performance metrics for the latest review
    let currentMetrics = null;
    if (reviews.length > 0) {
      const latestReview = reviews[0];
      const metricsQuery = `
        SELECT 
          metric_name,
          metric_category,
          rating,
          max_rating,
          weight,
          comments
        FROM employee_performance_metrics
        WHERE performance_id = ?
        ${metric_type ? 'AND metric_category = ?' : ''}
        ORDER BY metric_category, metric_name
      `;

      const metricsParams = metric_type ? [latestReview.id, metric_type] : [latestReview.id];
      const [metrics] = await connection.execute(metricsQuery, metricsParams);

      // Calculate weighted average
      const totalWeightedRating = metrics.reduce((sum, metric) => {
        return sum + (metric.rating * metric.weight);
      }, 0);
      const totalWeight = metrics.reduce((sum, metric) => sum + metric.weight, 0);
      const weightedAverage = totalWeight > 0 ? (totalWeightedRating / totalWeight).toFixed(1) : 0;

      currentMetrics = {
        overall_rating: parseFloat(weightedAverage),
        metrics: metrics,
        total_metrics: metrics.length
      };
    }

    // Get time logs for attendance calculation
    const timeLogsQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_hours) as total_hours
      FROM employee_time_logs
      WHERE employee_id = ? 
        AND log_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
      GROUP BY status
    `;

    const [timeLogs] = await connection.execute(timeLogsQuery, [id]);

    // Calculate attendance rate
    let attendanceRate = null;
    if (timeLogs.length > 0) {
      const presentCount = timeLogs.find(log => log.status === 'present')?.count || 0;
      const totalDays = timeLogs.reduce((sum, log) => sum + log.count, 0);
      attendanceRate = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(1) : null;
    }

    // Get safety score (placeholder - would be calculated from incidents)
    const safetyScore = 95.0; // This would be calculated from incident data

    // Get quality and productivity scores (placeholder - would be calculated from job data)
    const qualityScore = 4.1; // This would be calculated from job quality metrics
    const productivityScore = 4.3; // This would be calculated from job completion rates

    // Get metrics history for the last 4 reviews
    const metricsHistoryQuery = `
      SELECT 
        p.review_date,
        p.overall_rating,
        AVG(pm.rating) as avg_metric_rating
      FROM employee_performance p
      LEFT JOIN employee_performance_metrics pm ON p.id = pm.performance_id
      WHERE p.employee_id = ? AND p.status = 'completed'
      GROUP BY p.id, p.review_date, p.overall_rating
      ORDER BY p.review_date DESC
      LIMIT 4
    `;

    const [metricsHistory] = await connection.execute(metricsHistoryQuery, [id]);

    // Extract historical data
    const attendanceHistory = metricsHistory.map(review => attendanceRate || 95.0);
    const safetyHistory = metricsHistory.map(review => safetyScore);
    const qualityHistory = metricsHistory.map(review => qualityScore);
    const productivityHistory = metricsHistory.map(review => productivityScore);

    await connection.end();

    res.json({
      success: true,
      message: 'Employee performance retrieved successfully',
      data: {
        employee_id: id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        current_performance: {
          overall_rating: currentMetrics?.overall_rating || null,
          attendance_rate: attendanceRate,
          safety_score: safetyScore,
          quality_score: qualityScore,
          productivity_score: productivityScore
        },
        performance_reviews: reviews.map(review => ({
          id: review.id,
          review_date: review.review_date,
          reviewer: review.reviewer_id,
          reviewer_name: review.reviewer_name,
          overall_rating: review.overall_rating,
          strengths: review.achievements ? review.achievements.split(',').map(s => s.trim()) : [],
          areas_for_improvement: review.areas_for_improvement ? review.areas_for_improvement.split(',').map(s => s.trim()) : [],
          goals: review.goals ? review.goals.split(',').map(s => s.trim()) : [],
          next_review_date: review.next_review_date
        })),
        metrics_history: {
          attendance: attendanceHistory,
          safety: safetyHistory,
          quality: qualityHistory,
          productivity: productivityHistory
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting employee performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve employee performance',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Create a new performance review for an employee
 */
async function createPerformanceReview(req, res) {
  try {
    const { id } = req.params;
    const {
      review_date,
      reviewer,
      overall_rating,
      strengths,
      areas_for_improvement,
      goals,
      next_review_date,
      comments
    } = req.body;

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

    // Check if reviewer exists
    if (reviewer) {
      const reviewerQuery = 'SELECT id FROM employees WHERE id = ? AND is_active = TRUE';
      const [reviewers] = await connection.execute(reviewerQuery, [reviewer]);

      if (reviewers.length === 0) {
        await connection.end();
        return res.status(400).json({
          success: false,
          message: 'Reviewer not found',
          error: 'REVIEWER_NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Create performance review
    const reviewId = uuidv4();
    const insertQuery = `
      INSERT INTO employee_performance (
        id, employee_id, review_type, review_date, reviewer_id,
        overall_rating, next_review_date, status, comments,
        achievements, areas_for_improvement, goals
      ) VALUES (?, ?, 'annual', ?, ?, ?, ?, 'completed', ?, ?, ?, ?)
    `;

    await connection.execute(insertQuery, [
      reviewId,
      id,
      review_date,
      reviewer,
      overall_rating,
      next_review_date,
      comments || '',
      strengths ? strengths.join(', ') : '',
      areas_for_improvement ? areas_for_improvement.join(', ') : '',
      goals ? goals.join(', ') : ''
    ]);

    // Insert default performance metrics
    const defaultMetrics = [
      { name: 'Attendance & Punctuality', category: 'attendance', rating: overall_rating, weight: 0.20 },
      { name: 'Safety Compliance', category: 'safety', rating: overall_rating, weight: 0.25 },
      { name: 'Job Quality', category: 'quality', rating: overall_rating, weight: 0.25 },
      { name: 'Productivity', category: 'productivity', rating: overall_rating, weight: 0.20 },
      { name: 'Teamwork', category: 'teamwork', rating: overall_rating, weight: 0.10 }
    ];

    for (const metric of defaultMetrics) {
      const metricId = uuidv4();
      const metricQuery = `
        INSERT INTO employee_performance_metrics (
          id, performance_id, metric_name, metric_category, 
          rating, max_rating, weight
        ) VALUES (?, ?, ?, ?, ?, 5.0, ?)
      `;

      await connection.execute(metricQuery, [
        metricId,
        reviewId,
        metric.name,
        metric.category,
        metric.rating,
        metric.weight
      ]);
    }

    await connection.end();

    res.status(201).json({
      success: true,
      message: 'Performance review created successfully',
      data: {
        review_id: reviewId,
        employee_id: id,
        review_date,
        overall_rating
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating performance review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create performance review',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Update an existing performance review
 */
async function updatePerformanceReview(req, res) {
  try {
    const { id, review_id } = req.params;
    const updateData = req.body;

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

    // Check if review exists
    const reviewQuery = 'SELECT id FROM employee_performance WHERE id = ? AND employee_id = ?';
    const [reviews] = await connection.execute(reviewQuery, [review_id, id]);

    if (reviews.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Performance review not found',
        error: 'PERFORMANCE_REVIEW_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // Build update query dynamically
    const updatedFields = [];
    const updateValues = [];

    if (updateData.overall_rating) {
      updatedFields.push('overall_rating = ?');
      updateValues.push(updateData.overall_rating);
    }

    if (updateData.comments) {
      updatedFields.push('comments = ?');
      updateValues.push(updateData.comments);
    }

    if (updateData.goals) {
      updatedFields.push('goals = ?');
      updateValues.push(updateData.goals.join(', '));
    }

    if (updateData.achievements) {
      updatedFields.push('achievements = ?');
      updateValues.push(updateData.achievements.join(', '));
    }

    if (updateData.areas_for_improvement) {
      updatedFields.push('areas_for_improvement = ?');
      updateValues.push(updateData.areas_for_improvement.join(', '));
    }

    if (updateData.next_review_date) {
      updatedFields.push('next_review_date = ?');
      updateValues.push(updateData.next_review_date);
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

    // Update performance review
    updatedFields.push('updated_at = CURRENT_TIMESTAMP');
    const updateQuery = `UPDATE employee_performance SET ${updatedFields.join(', ')} WHERE id = ?`;
    updateValues.push(review_id);

    await connection.execute(updateQuery, updateValues);

    // Update metrics if overall rating changed
    if (updateData.overall_rating) {
      const updateMetricsQuery = `
        UPDATE employee_performance_metrics 
        SET rating = ? 
        WHERE performance_id = ?
      `;
      await connection.execute(updateMetricsQuery, [updateData.overall_rating, review_id]);
    }

    await connection.end();

    res.json({
      success: true,
      message: 'Performance review updated successfully',
      data: {
        review_id,
        employee_id: id,
        updated_fields: updatedFields.filter(field => field !== 'updated_at')
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating performance review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update performance review',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get performance metrics for an employee
 */
async function getPerformanceMetrics(req, res) {
  try {
    const { id } = req.params;
    const { review_id } = req.query;

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

    // Get performance metrics
    let metricsQuery;
    let queryParams;

    if (review_id) {
      // Get metrics for specific review
      metricsQuery = `
        SELECT 
          pm.*,
          p.review_date,
          p.review_type
        FROM employee_performance_metrics pm
        JOIN employee_performance p ON pm.performance_id = p.id
        WHERE p.employee_id = ? AND p.id = ?
        ORDER BY pm.metric_category, pm.metric_name
      `;
      queryParams = [id, review_id];
    } else {
      // Get metrics for latest review
      metricsQuery = `
        SELECT 
          pm.*,
          p.review_date,
          p.review_type
        FROM employee_performance_metrics pm
        JOIN employee_performance p ON pm.performance_id = p.id
        WHERE p.employee_id = ? AND p.status = 'completed'
        ORDER BY p.review_date DESC, pm.metric_category, pm.metric_name
        LIMIT 20
      `;
      queryParams = [id];
    }

    const [metrics] = await connection.execute(metricsQuery, queryParams);

    // Group metrics by category
    const metricsByCategory = {};
    metrics.forEach(metric => {
      if (!metricsByCategory[metric.metric_category]) {
        metricsByCategory[metric.metric_category] = [];
      }
      metricsByCategory[metric.metric_category].push({
        id: metric.id,
        metric_name: metric.metric_name,
        rating: metric.rating,
        max_rating: metric.max_rating,
        weight: metric.weight,
        comments: metric.comments,
        review_date: metric.review_date,
        review_type: metric.review_type
      });
    });

    // Calculate category averages
    const categoryAverages = {};
    Object.keys(metricsByCategory).forEach(category => {
      const categoryMetrics = metricsByCategory[category];
      const totalRating = categoryMetrics.reduce((sum, metric) => sum + metric.rating, 0);
      const avgRating = totalRating / categoryMetrics.length;
      categoryAverages[category] = parseFloat(avgRating.toFixed(1));
    });

    await connection.end();

    res.json({
      success: true,
      message: 'Performance metrics retrieved successfully',
      data: {
        employee_id: id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        metrics_by_category: metricsByCategory,
        category_averages: categoryAverages,
        summary: {
          total_metrics: metrics.length,
          categories: Object.keys(metricsByCategory),
          overall_average: Object.values(categoryAverages).length > 0 
            ? parseFloat((Object.values(categoryAverages).reduce((sum, avg) => sum + avg, 0) / Object.values(categoryAverages).length).toFixed(1))
            : null
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance metrics',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get performance comparison across team/department
 */
async function getTeamPerformanceComparison(req, res) {
  try {
    const { department, review_year } = req.query;

    const connection = await mysql.createConnection(config);

    // Build filters
    const filters = ['e.is_active = TRUE AND e.status = "active"'];
    const filterParams = [];

    if (department) {
      filters.push('e.department = ?');
      filterParams.push(department);
    }

    if (review_year) {
      filters.push('YEAR(p.review_date) = ?');
      filterParams.push(review_year);
    }

    const whereClause = filters.join(' AND ');

    // Get team performance data
    const teamQuery = `
      SELECT 
        e.id,
        e.first_name,
        e.last_name,
        e.department,
        e.position,
        p.overall_rating,
        p.review_date,
        p.review_type
      FROM employees e
      LEFT JOIN employee_performance p ON e.id = p.employee_id 
        AND p.status = 'completed'
        ${review_year ? 'AND YEAR(p.review_date) = ?' : ''}
      WHERE ${whereClause}
      ORDER BY e.department, e.last_name
    `;

    const [teamData] = await connection.execute(teamQuery, filterParams);

    // Calculate department averages
    const deptAverages = {};
    const deptCounts = {};
    
    teamData.forEach(employee => {
      if (employee.overall_rating) {
        if (!deptAverages[employee.department]) {
          deptAverages[employee.department] = 0;
          deptCounts[employee.department] = 0;
        }
        deptAverages[employee.department] += employee.overall_rating;
        deptCounts[employee.department]++;
      }
    });

    Object.keys(deptAverages).forEach(dept => {
      deptAverages[dept] = parseFloat((deptAverages[dept] / deptCounts[dept]).toFixed(1));
    });

    // Calculate overall team average
    const totalRating = teamData.reduce((sum, emp) => sum + (emp.overall_rating || 0), 0);
    const totalWithRating = teamData.filter(emp => emp.overall_rating).length;
    const overallAverage = totalWithRating > 0 ? parseFloat((totalRating / totalWithRating).toFixed(1)) : null;

    // Get top performers
    const topPerformers = teamData
      .filter(emp => emp.overall_rating)
      .sort((a, b) => b.overall_rating - a.overall_rating)
      .slice(0, 5)
      .map(emp => ({
        employee_id: emp.id,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        department: emp.department,
        position: emp.position,
        performance_rating: emp.overall_rating
      }));

    await connection.end();

    res.json({
      success: true,
      message: 'Team performance comparison retrieved successfully',
      data: {
        department_filter: department || 'all',
        review_year: review_year || 'all',
        team_performance: teamData.map(emp => ({
          employee_id: emp.id,
          employee_name: `${emp.first_name} ${emp.last_name}`,
          department: emp.department,
          position: emp.position,
          performance_rating: emp.overall_rating,
          review_date: emp.review_date,
          review_type: emp.review_type
        })),
        department_averages: deptAverages,
        summary: {
          total_employees: teamData.length,
          employees_with_reviews: totalWithRating,
          overall_average: overallAverage,
          top_performers: topPerformers
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting team performance comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve team performance comparison',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getEmployeePerformance,
  createPerformanceReview,
  updatePerformanceReview,
  getPerformanceMetrics,
  getTeamPerformanceComparison
};
