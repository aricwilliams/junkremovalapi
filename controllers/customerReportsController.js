const { query } = require('../config/database');

// Helper function to create standardized API response
const createResponse = (success, message, data = null, error = null) => ({
  success,
  message,
  data,
  error,
  timestamp: new Date().toISOString()
});

// 23. Get Customer Summary Report
const getCustomerSummaryReport = async (req, res) => {
  try {
    const { date_from, date_to, customer_type, status, format = 'json' } = req.query;

    // Build WHERE clause for filtering
    const conditions = [];
    const params = [];

    if (date_from) {
      conditions.push('created_at >= ?');
      params.push(date_from);
    }

    if (date_to) {
      conditions.push('created_at <= ?');
      params.push(date_to);
    }

    if (customer_type) {
      conditions.push('customer_type = ?');
      params.push(customer_type);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get summary statistics
    const summarySql = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as new_customers,
        COUNT(CASE WHEN status != 'inactive' AND status != 'blacklisted' THEN 1 END) as active_customers,
        COUNT(CASE WHEN status = 'inactive' OR status = 'blacklisted' THEN 1 END) as inactive_customers,
        SUM(total_spent) as total_revenue,
        AVG(total_spent) as average_customer_value
      FROM customers
      ${whereClause}
    `;
    
    const summary = await query(summarySql, params);

    // Get customers by type
    const customersByTypeSql = `
      SELECT 
        customer_type,
        COUNT(*) as count
      FROM customers
      ${whereClause}
      GROUP BY customer_type
      ORDER BY count DESC
    `;
    
    const customersByType = await query(customersByTypeSql, params);

    // Get customers by status
    const customersByStatusSql = `
      SELECT 
        status,
        COUNT(*) as count
      FROM customers
      ${whereClause}
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const customersByStatus = await query(customersByStatusSql, params);

    // Get top customers by revenue
    const topCustomersSql = `
      SELECT 
        id, name, total_spent, total_jobs
      FROM customers
      ${whereClause}
      ORDER BY total_spent DESC
      LIMIT 10
    `;
    
    const topCustomers = await query(topCustomersSql, params);

    // Calculate growth metrics
    const growthSql = `
      SELECT 
        COUNT(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as monthly_growth,
        COUNT(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY) THEN 1 END) as quarterly_growth,
        COUNT(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 365 DAY) THEN 1 END) as yearly_growth
      FROM customers
      ${whereClause}
    `;
    
    const growth = await query(growthSql, params);

    // Calculate growth percentages
    const totalCustomers = summary[0].total_customers || 0;
    const monthlyGrowth = totalCustomers > 0 ? ((growth[0].monthly_growth / totalCustomers) * 100).toFixed(1) : 0;
    const quarterlyGrowth = totalCustomers > 0 ? ((growth[0].quarterly_growth / totalCustomers) * 100).toFixed(1) : 0;
    const yearlyGrowth = totalCustomers > 0 ? ((growth[0].yearly_growth / totalCustomers) * 100).toFixed(1) : 0;

    // Format customers by type
    const customersByTypeObj = {};
    customersByType.forEach(item => {
      customersByTypeObj[item.customer_type] = item.count;
    });

    // Format customers by status
    const customersByStatusObj = {};
    customersByStatus.forEach(item => {
      customersByStatusObj[item.status] = item.count;
    });

    const response = createResponse(true, 'Customer summary report generated successfully', {
      report_period: {
        from: date_from || 'all_time',
        to: date_to || 'all_time'
      },
      summary: {
        total_customers: summary[0].total_customers || 0,
        new_customers: summary[0].new_customers || 0,
        active_customers: summary[0].active_customers || 0,
        inactive_customers: summary[0].inactive_customers || 0,
        total_revenue: parseFloat(summary[0].total_revenue || 0),
        average_customer_value: parseFloat(summary[0].average_customer_value || 0)
      },
      customers_by_type: customersByTypeObj,
      customers_by_status: customersByStatusObj,
      top_customers: topCustomers.map(customer => ({
        id: customer.id,
        name: customer.name,
        total_spent: parseFloat(customer.total_spent || 0),
        job_count: customer.total_jobs || 0
      })),
      customer_growth: {
        monthly_growth: parseFloat(monthlyGrowth),
        quarterly_growth: parseFloat(quarterlyGrowth),
        yearly_growth: parseFloat(yearlyGrowth)
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error generating customer summary report:', error);
    const response = createResponse(false, 'Failed to generate customer summary report', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get customer analytics dashboard data
const getCustomerAnalytics = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    // Build WHERE clause for filtering
    const conditions = [];
    const params = [];

    if (date_from) {
      conditions.push('created_at >= ?');
      params.push(date_from);
    }

    if (date_to) {
      conditions.push('created_at <= ?');
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get customer acquisition trends (last 12 months)
    const acquisitionTrendsSql = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as new_customers
      FROM customers
      ${whereClause}
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `;
    
    const acquisitionTrends = await query(acquisitionTrendsSql, params);

    // Get revenue trends
    const revenueTrendsSql = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(total_spent) as revenue
      FROM customers
      ${whereClause}
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `;
    
    const revenueTrends = await query(revenueTrendsSql, params);

    // Get customer retention metrics
    const retentionSql = `
      SELECT 
        COUNT(CASE WHEN total_jobs > 1 THEN 1 END) as repeat_customers,
        COUNT(CASE WHEN total_jobs = 1 THEN 1 END) as one_time_customers,
        COUNT(CASE WHEN total_jobs > 5 THEN 1 END) as loyal_customers
      FROM customers
      ${whereClause}
    `;
    
    const retention = await query(retentionSql, params);

    // Get top performing customer types
    const customerTypePerformanceSql = `
      SELECT 
        customer_type,
        COUNT(*) as customer_count,
        AVG(total_spent) as avg_revenue,
        SUM(total_spent) as total_revenue
      FROM customers
      ${whereClause}
      GROUP BY customer_type
      ORDER BY total_revenue DESC
    `;
    
    const customerTypePerformance = await query(customerTypePerformanceSql, params);

    // Get geographic distribution
    const geographicSql = `
      SELECT 
        state,
        COUNT(*) as customer_count,
        SUM(total_spent) as total_revenue
      FROM customers
      ${whereClause}
      GROUP BY state
      ORDER BY customer_count DESC
      LIMIT 10
    `;
    
    const geographic = await query(geographicSql, params);

    const response = createResponse(true, 'Customer analytics retrieved successfully', {
      acquisition_trends: acquisitionTrends.map(trend => ({
        month: trend.month,
        new_customers: trend.new_customers
      })),
      revenue_trends: revenueTrends.map(trend => ({
        month: trend.month,
        revenue: parseFloat(trend.revenue || 0)
      })),
      retention_metrics: {
        repeat_customers: retention[0].repeat_customers || 0,
        one_time_customers: retention[0].one_time_customers || 0,
        loyal_customers: retention[0].loyal_customers || 0
      },
      customer_type_performance: customerTypePerformance.map(type => ({
        customer_type: type.customer_type,
        customer_count: type.customer_count,
        avg_revenue: parseFloat(type.avg_revenue || 0),
        total_revenue: parseFloat(type.total_revenue || 0)
      })),
      geographic_distribution: geographic.map(geo => ({
        state: geo.state,
        customer_count: geo.customer_count,
        total_revenue: parseFloat(geo.total_revenue || 0)
      }))
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting customer analytics:', error);
    const response = createResponse(false, 'Failed to retrieve customer analytics', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get customer export data
const exportCustomers = async (req, res) => {
  try {
    const { date_from, date_to, customer_type, status, format = 'json' } = req.query;

    // Build WHERE clause for filtering
    const conditions = [];
    const params = [];

    if (date_from) {
      conditions.push('created_at >= ?');
      params.push(date_from);
    }

    if (date_to) {
      conditions.push('created_at <= ?');
      params.push(date_to);
    }

    if (customer_type) {
      conditions.push('customer_type = ?');
      params.push(customer_type);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get all customers for export
    const customersSql = `
      SELECT 
        id, name, email, phone, address, city, state, zip_code, country,
        customer_type, status, total_jobs, total_spent, average_job_value,
        source, created_at, updated_at
      FROM customers
      ${whereClause}
      ORDER BY created_at DESC
    `;
    
    const customers = await query(customersSql, params);

    // Format customers for export
    const exportData = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zip_code: customer.zip_code,
      country: customer.country,
      customer_type: customer.customer_type,
      status: customer.status,
      total_jobs: customer.total_jobs,
      total_spent: parseFloat(customer.total_spent || 0),
      average_job_value: parseFloat(customer.average_job_value || 0),
      source: customer.source,
      created_at: customer.created_at,
      updated_at: customer.updated_at
    }));

    const response = createResponse(true, 'Customer export completed successfully', {
      export_format: format,
      total_records: exportData.length,
      export_date: new Date().toISOString(),
      customers: exportData
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error exporting customers:', error);
    const response = createResponse(false, 'Failed to export customers', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get customer insights and recommendations
const getCustomerInsights = async (req, res) => {
  try {
    // Get customers with declining engagement
    const decliningEngagementSql = `
      SELECT 
        id, name, total_jobs, total_spent, last_contact_date
      FROM customers
      WHERE total_jobs > 0 
        AND last_contact_date < DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        AND status != 'inactive'
      ORDER BY last_contact_date ASC
      LIMIT 10
    `;
    
    const decliningEngagement = await query(decliningEngagementSql);

    // Get high-value customers
    const highValueCustomersSql = `
      SELECT 
        id, name, total_spent, total_jobs, customer_type
      FROM customers
      WHERE total_spent > 1000
      ORDER BY total_spent DESC
      LIMIT 10
    `;
    
    const highValueCustomers = await query(highValueCustomersSql);

    // Get customers with high potential (new customers with good initial engagement)
    const highPotentialSql = `
      SELECT 
        id, name, total_spent, total_jobs, created_at
      FROM customers
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND total_spent > 100
      ORDER BY total_spent DESC
      LIMIT 10
    `;
    
    const highPotential = await query(highPotentialSql);

    // Get customer satisfaction insights
    const satisfactionInsightsSql = `
      SELECT 
        AVG(customer_satisfaction) as avg_satisfaction,
        COUNT(CASE WHEN customer_satisfaction >= 4 THEN 1 END) as satisfied_customers,
        COUNT(CASE WHEN customer_satisfaction < 3 THEN 1 END) as dissatisfied_customers
      FROM customer_service_history
      WHERE customer_satisfaction IS NOT NULL
    `;
    
    const satisfactionInsights = await query(satisfactionInsightsSql);

    const response = createResponse(true, 'Customer insights retrieved successfully', {
      declining_engagement: decliningEngagement.map(customer => ({
        id: customer.id,
        name: customer.name,
        total_jobs: customer.total_jobs,
        total_spent: parseFloat(customer.total_spent || 0),
        last_contact_date: customer.last_contact_date,
        recommendation: 'Re-engage with follow-up call or special offer'
      })),
      high_value_customers: highValueCustomers.map(customer => ({
        id: customer.id,
        name: customer.name,
        total_spent: parseFloat(customer.total_spent || 0),
        total_jobs: customer.total_jobs,
        customer_type: customer.customer_type,
        recommendation: 'VIP treatment and exclusive offers'
      })),
      high_potential_customers: highPotential.map(customer => ({
        id: customer.id,
        name: customer.name,
        total_spent: parseFloat(customer.total_spent || 0),
        total_jobs: customer.total_jobs,
        created_at: customer.created_at,
        recommendation: 'Nurture relationship and cross-sell opportunities'
      })),
      satisfaction_insights: {
        average_satisfaction: parseFloat(satisfactionInsights[0].avg_satisfaction || 0),
        satisfied_customers: satisfactionInsights[0].satisfied_customers || 0,
        dissatisfied_customers: satisfactionInsights[0].dissatisfied_customers || 0,
        satisfaction_rate: satisfactionInsights[0].satisfied_customers > 0 ? 
          ((satisfactionInsights[0].satisfied_customers / (satisfactionInsights[0].satisfied_customers + satisfactionInsights[0].dissatisfied_customers)) * 100).toFixed(1) : 0
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error getting customer insights:', error);
    const response = createResponse(false, 'Failed to retrieve customer insights', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

module.exports = {
  getCustomerSummaryReport,
  getCustomerAnalytics,
  exportCustomers,
  getCustomerInsights
};
