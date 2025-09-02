const mysql = require('mysql2/promise');

// Get service summary report for the authenticated user
async function getServiceSummaryReport(req, res) {
  try {
    const { date_from, date_to, format = 'json' } = req.query;
    const customerId = req.user.customerId;

    // Validate date parameters
    if (!date_from || !date_to) {
      return res.status(400).json({
        success: false,
        message: 'Date range is required (date_from and date_to)',
        error: 'MISSING_DATE_RANGE',
        timestamp: new Date().toISOString()
      });
    }

    // Get service overview
    const serviceOverviewQuery = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN j.id IS NOT NULL THEN 1 ELSE 0 END) as total_jobs,
        SUM(CASE WHEN j.status = 'completed' THEN 1 ELSE 0 END) as completed_jobs,
        SUM(CASE WHEN j.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_jobs,
        SUM(COALESCE(j.total_cost, 0)) as total_spent
      FROM portal_requests pr
      LEFT JOIN jobs j ON pr.id = j.request_id
      WHERE pr.customer_id = ? 
        AND pr.created_at >= ? 
        AND pr.created_at <= ?
    `;

    const [serviceOverview] = await mysql.execute(serviceOverviewQuery, [
      customerId, 
      date_from, 
      date_to
    ]);

    // Get service types breakdown
    const serviceTypesQuery = `
      SELECT 
        pr.type as service_type,
        COUNT(*) as count,
        SUM(COALESCE(j.total_cost, 0)) as total_spent,
        AVG(COALESCE(j.total_cost, 0)) as average_cost
      FROM portal_requests pr
      LEFT JOIN jobs j ON pr.id = j.request_id
      WHERE pr.customer_id = ? 
        AND pr.created_at >= ? 
        AND pr.created_at <= ?
      GROUP BY pr.type
      ORDER BY count DESC
    `;

    const [serviceTypes] = await mysql.execute(serviceTypesQuery, [
      customerId, 
      date_from, 
      date_to
    ]);

    // Get monthly trends
    const monthlyTrendsQuery = `
      SELECT 
        DATE_FORMAT(pr.created_at, '%Y-%m') as month,
        COUNT(*) as jobs,
        SUM(COALESCE(j.total_cost, 0)) as spent
      FROM portal_requests pr
      LEFT JOIN jobs j ON pr.id = j.request_id
      WHERE pr.customer_id = ? 
        AND pr.created_at >= ? 
        AND pr.created_at <= ?
      GROUP BY DATE_FORMAT(pr.created_at, '%Y-%m')
      ORDER BY month ASC
    `;

    const [monthlyTrends] = await mysql.execute(monthlyTrendsQuery, [
      customerId, 
      date_from, 
      date_to
    ]);

    // Get ratings and reviews
    const ratingsQuery = `
      SELECT 
        AVG(COALESCE(j.customer_rating, 0)) as average_rating,
        COUNT(CASE WHEN j.customer_rating IS NOT NULL THEN 1 END) as total_reviews,
        SUM(CASE WHEN j.customer_rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN j.customer_rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN j.customer_rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN j.customer_rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN j.customer_rating = 1 THEN 1 ELSE 0 END) as one_star
      FROM jobs j
      WHERE j.customer_id = ? 
        AND j.completed_date >= ? 
        AND j.completed_date <= ?
        AND j.customer_rating IS NOT NULL
    `;

    const [ratings] = await mysql.execute(ratingsQuery, [
      customerId, 
      date_from, 
      date_to
    ]);

    // Get priority distribution
    const priorityDistributionQuery = `
      SELECT 
        priority,
        COUNT(*) as count
      FROM portal_requests
      WHERE customer_id = ? 
        AND created_at >= ? 
        AND created_at <= ?
      GROUP BY priority
      ORDER BY 
        CASE priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          WHEN 'standard' THEN 5
          ELSE 6
        END
    `;

    const [priorityDistribution] = await mysql.execute(priorityDistributionQuery, [
      customerId, 
      date_from, 
      date_to
    ]);

    // Get status distribution
    const statusDistributionQuery = `
      SELECT 
        status,
        COUNT(*) as count
      FROM portal_requests
      WHERE customer_id = ? 
        AND created_at >= ? 
        AND created_at <= ?
      GROUP BY status
      ORDER BY count DESC
    `;

    const [statusDistribution] = await mysql.execute(statusDistributionQuery, [
      customerId, 
      date_from, 
      date_to
    ]);

    // Build comprehensive report
    const reportData = {
      report_period: {
        from: date_from,
        to: date_to
      },
      service_overview: {
        total_requests: serviceOverview[0]?.total_requests || 0,
        total_jobs: serviceOverview[0]?.total_jobs || 0,
        completed_jobs: serviceOverview[0]?.completed_jobs || 0,
        cancelled_jobs: serviceOverview[0]?.cancelled_jobs || 0,
        total_spent: parseFloat(serviceOverview[0]?.total_spent || 0).toFixed(2)
      },
      service_types: serviceTypes.map(service => ({
        type: service.service_type,
        count: service.count,
        total_spent: parseFloat(service.total_spent || 0).toFixed(2),
        average_cost: parseFloat(service.average_cost || 0).toFixed(2)
      })),
      monthly_trends: monthlyTrends.map(trend => ({
        month: trend.month,
        jobs: trend.jobs,
        spent: parseFloat(trend.spent || 0).toFixed(2)
      })),
      ratings: {
        average_rating: parseFloat(ratings[0]?.average_rating || 0).toFixed(1),
        total_reviews: ratings[0]?.total_reviews || 0,
        rating_distribution: {
          '5_star': ratings[0]?.five_star || 0,
          '4_star': ratings[0]?.four_star || 0,
          '3_star': ratings[0]?.three_star || 0,
          '2_star': ratings[0]?.two_star || 0,
          '1_star': ratings[0]?.one_star || 0
        }
      },
      priority_distribution: priorityDistribution.map(priority => ({
        priority: priority.priority,
        count: priority.count
      })),
      status_distribution: statusDistribution.map(status => ({
        status: status.status,
        count: status.count
      }))
    };

    // Store report in database
    const reportId = require('uuid').v4();
    const storeReportQuery = `
      INSERT INTO portal_reports (
        id, customer_id, user_id, report_type, title, description,
        period_start, period_end, report_data, status, generated_at
      ) VALUES (?, ?, ?, 'custom', 'Service Summary Report', 'Service summary report for specified period', ?, ?, ?, 'ready', NOW())
    `;

    await mysql.execute(storeReportQuery, [
      reportId,
      customerId,
      req.user.userId,
      date_from,
      date_to,
      JSON.stringify(reportData)
    ]);

    // Log activity
    const activityQuery = `
      INSERT INTO portal_activity_logs (id, user_id, customer_id, activity_type, description, report_id)
      VALUES (?, ?, ?, 'download_report', 'Service summary report generated', ?)
    `;

    await mysql.execute(activityQuery, [
      require('uuid').v4(),
      req.user.userId,
      customerId,
      reportId
    ]);

    // Return report data
    res.json({
      success: true,
      message: 'Service summary report generated successfully',
      data: reportData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating service summary report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate service summary report',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Get available report types
async function getAvailableReportTypes(req, res) {
  try {
    const customerId = req.user.customerId;

    // Get user's report permissions
    const userQuery = `
      SELECT permissions FROM portal_users WHERE customer_id = ?
    `;
    
    const [users] = await mysql.execute(userQuery, [customerId]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    let permissions = {};
    try {
      permissions = JSON.parse(users[0].permissions || '{}');
    } catch (e) {
      permissions = {};
    }

    // Define available report types based on permissions
    const availableReports = [];

    if (permissions.dashboard !== false) {
      availableReports.push({
        type: 'service_summary',
        name: 'Service Summary Report',
        description: 'Overview of all services and spending',
        parameters: ['date_from', 'date_to'],
        format: ['json', 'pdf']
      });
    }

    if (permissions.reports !== false) {
      availableReports.push({
        type: 'monthly_summary',
        name: 'Monthly Summary Report',
        description: 'Monthly breakdown of services and costs',
        parameters: ['year', 'month'],
        format: ['json', 'pdf']
      });

      availableReports.push({
        type: 'service_type_analysis',
        name: 'Service Type Analysis',
        description: 'Detailed analysis by service type',
        parameters: ['date_from', 'date_to'],
        format: ['json', 'pdf']
      });

      availableReports.push({
        type: 'cost_analysis',
        name: 'Cost Analysis Report',
        description: 'Detailed cost breakdown and trends',
        parameters: ['date_from', 'date_to'],
        format: ['json', 'pdf']
      });
    }

    res.json({
      success: true,
      message: 'Available report types retrieved successfully',
      data: {
        available_reports: availableReports,
        user_permissions: permissions
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting available report types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve available report types',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Get user's report history
async function getReportHistory(req, res) {
  try {
    const customerId = req.user.customerId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM portal_reports
      WHERE customer_id = ?
    `;
    
    const [countResult] = await mysql.execute(countQuery, [customerId]);
    const total = countResult[0].total;

    // Get paginated results
    const query = `
      SELECT 
        id,
        report_type,
        title,
        period_start,
        period_end,
        status,
        generated_at,
        download_count,
        last_downloaded
      FROM portal_reports
      WHERE customer_id = ?
      ORDER BY generated_at DESC
      LIMIT ? OFFSET ?
    `;

    const [reports] = await mysql.execute(query, [customerId, parseInt(limit), offset]);

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    };

    res.json({
      success: true,
      message: 'Report history retrieved successfully',
      data: {
        reports,
        pagination
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting report history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve report history',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = {
  getServiceSummaryReport,
  getAvailableReportTypes,
  getReportHistory
};
