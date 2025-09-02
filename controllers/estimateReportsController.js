const mysql = require('mysql2/promise');
const { getConnection } = require('../config/database');

/**
 * Estimate Reports Controller
 * Handles all estimate reporting operations
 */

/**
 * Get estimate summary report
 */
async function getEstimateSummaryReport(req, res) {
  try {
    const connection = await getConnection();
    
    const {
      date_from,
      date_to,
      status,
      service_type,
      format = 'json'
    } = req.query;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (date_from) {
      conditions.push('e.created_at >= ?');
      params.push(date_from);
    }

    if (date_to) {
      conditions.push('e.created_at <= ?');
      params.push(date_to);
    }

    if (status) {
      conditions.push('e.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_estimates,
        SUM(CASE WHEN e.status = 'draft' THEN 1 ELSE 0 END) as draft_estimates,
        SUM(CASE WHEN e.status = 'sent' THEN 1 ELSE 0 END) as sent_estimates,
        SUM(CASE WHEN e.status = 'accepted' THEN 1 ELSE 0 END) as accepted_estimates,
        SUM(CASE WHEN e.status = 'rejected' THEN 1 ELSE 0 END) as rejected_estimates,
        SUM(CASE WHEN e.status = 'expired' THEN 1 ELSE 0 END) as expired_estimates,
        SUM(CASE WHEN e.status = 'converted' THEN 1 ELSE 0 END) as converted_estimates,
        SUM(e.total) as total_value,
        AVG(e.total) as average_value,
        MIN(e.total) as min_value,
        MAX(e.total) as max_value,
        SUM(CASE WHEN e.status = 'accepted' THEN e.total ELSE 0 END) as accepted_value,
        SUM(CASE WHEN e.status = 'converted' THEN e.total ELSE 0 END) as converted_value
      FROM estimates e
      ${whereClause}
    `;

    const [summaryResult] = await connection.execute(summaryQuery, params);
    const summary = summaryResult[0];

    // Get estimates by status
    const statusBreakdownQuery = `
      SELECT 
        e.status,
        COUNT(*) as count,
        SUM(e.total) as total_value,
        AVG(e.total) as average_value
      FROM estimates e
      ${whereClause}
      GROUP BY e.status
      ORDER BY count DESC
    `;

    const [statusBreakdown] = await connection.execute(statusBreakdownQuery, params);

    // Get estimates by month (last 12 months)
    const monthlyQuery = `
      SELECT 
        DATE_FORMAT(e.created_at, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(e.total) as total_value,
        AVG(e.total) as average_value
      FROM estimates e
      WHERE e.created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      ${whereClause ? whereClause.replace('e.created_at', 'e.created_at') : ''}
      GROUP BY DATE_FORMAT(e.created_at, '%Y-%m')
      ORDER BY month DESC
    `;

    const [monthlyData] = await connection.execute(monthlyQuery, params);

    // Get top performing categories
    const categoryQuery = `
      SELECT 
        ei.category,
        COUNT(*) as estimate_count,
        SUM(ei.total) as total_value,
        AVG(ei.total) as average_value
      FROM estimate_items ei
      JOIN estimates e ON ei.estimate_id = e.id
      ${whereClause ? `WHERE ${whereClause.replace('e.', 'e.')}` : ''}
      GROUP BY ei.category
      ORDER BY total_value DESC
      LIMIT 10
    `;

    const [categoryData] = await connection.execute(categoryQuery, params);

    // Calculate conversion rates
    const totalSent = summary.sent_estimates || 0;
    const totalAccepted = summary.accepted_estimates || 0;
    const totalConverted = summary.converted_estimates || 0;

    const conversionRates = {
      acceptance_rate: totalSent > 0 ? ((totalAccepted / totalSent) * 100).toFixed(2) : 0,
      conversion_rate: totalAccepted > 0 ? ((totalConverted / totalAccepted) * 100).toFixed(2) : 0,
      overall_conversion_rate: totalSent > 0 ? ((totalConverted / totalSent) * 100).toFixed(2) : 0
    };

    const response = {
      success: true,
      message: 'Estimate summary report generated successfully',
      data: {
        report_period: {
          date_from: date_from || 'all_time',
          date_to: date_to || 'all_time'
        },
        summary: {
          total_estimates: summary.total_estimates || 0,
          total_value: summary.total_value || 0,
          average_value: summary.average_value || 0,
          min_value: summary.min_value || 0,
          max_value: summary.max_value || 0
        },
        status_breakdown: {
          draft: summary.draft_estimates || 0,
          sent: summary.sent_estimates || 0,
          accepted: summary.accepted_estimates || 0,
          rejected: summary.rejected_estimates || 0,
          expired: summary.expired_estimates || 0,
          converted: summary.converted_estimates || 0
        },
        value_breakdown: {
          accepted_value: summary.accepted_value || 0,
          converted_value: summary.converted_value || 0,
          pending_value: (summary.total_value || 0) - (summary.accepted_value || 0)
        },
        conversion_rates,
        monthly_trends: monthlyData.map(month => ({
          month: month.month,
          estimate_count: month.count,
          total_value: month.total_value,
          average_value: month.average_value
        })),
        top_categories: categoryData.map(cat => ({
          category: cat.category,
          estimate_count: cat.estimate_count,
          total_value: cat.total_value,
          average_value: cat.average_value
        })),
        insights: generateInsights(summary, conversionRates, monthlyData)
      },
      timestamp: new Date().toISOString()
    };

    if (format === 'pdf') {
      // TODO: Implement PDF generation
      res.json({
        success: false,
        message: 'PDF format not yet implemented',
        error: 'PDF_NOT_IMPLEMENTED',
        timestamp: new Date().toISOString()
      });
    } else {
      res.json(response);
    }

  } catch (error) {
    console.error('Error generating estimate summary report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate estimate summary report',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get estimate performance report
 */
async function getEstimatePerformanceReport(req, res) {
  try {
    const connection = await getConnection();
    
    const {
      date_from,
      date_to,
      status,
      service_type,
      format = 'json'
    } = req.query;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (date_from) {
      conditions.push('e.created_at >= ?');
      params.push(date_from);
    }

    if (date_to) {
      conditions.push('e.created_at <= ?');
      params.push(date_to);
    }

    if (status) {
      conditions.push('e.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get performance metrics
    const performanceQuery = `
      SELECT 
        COUNT(*) as total_estimates,
        SUM(CASE WHEN e.status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
        SUM(CASE WHEN e.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN e.status = 'expired' THEN 1 ELSE 0 END) as expired_count,
        SUM(e.total) as total_value,
        SUM(CASE WHEN e.status = 'accepted' THEN e.total ELSE 0 END) as accepted_value,
        AVG(CASE WHEN e.status = 'accepted' THEN e.total ELSE NULL END) as avg_accepted_value,
        AVG(CASE WHEN e.status = 'rejected' THEN e.total ELSE NULL END) as avg_rejected_value,
        AVG(CASE WHEN e.status = 'expired' THEN e.total ELSE NULL END) as avg_expired_value
      FROM estimates e
      ${whereClause}
    `;

    const [performanceResult] = await connection.execute(performanceQuery, params);
    const performance = performanceResult[0];

    // Get response time analysis
    const responseTimeQuery = `
      SELECT 
        e.id,
        e.created_at,
        e.sent_date,
        e.accepted_date,
        e.rejected_date,
        DATEDIFF(e.sent_date, e.created_at) as days_to_send,
        DATEDIFF(e.accepted_date, e.sent_date) as days_to_accept,
        DATEDIFF(e.rejected_date, e.sent_date) as days_to_reject
      FROM estimates e
      WHERE e.sent_date IS NOT NULL
      ${whereClause ? whereClause.replace('e.created_at', 'e.created_at') : ''}
      ORDER BY e.sent_date DESC
    `;

    const [responseTimeData] = await connection.execute(responseTimeQuery, params);

    // Calculate response time metrics
    const responseTimeMetrics = calculateResponseTimeMetrics(responseTimeData);

    // Get estimate lifecycle analysis
    const lifecycleQuery = `
      SELECT 
        e.id,
        e.created_at,
        e.sent_date,
        e.accepted_date,
        e.rejected_date,
        e.expiry_date,
        e.status,
        DATEDIFF(e.expiry_date, e.created_at) as validity_period,
        DATEDIFF(COALESCE(e.accepted_date, e.rejected_date, e.expiry_date), e.created_at) as lifecycle_duration
      FROM estimates e
      ${whereClause}
      ORDER BY e.created_at DESC
    `;

    const [lifecycleData] = await connection.execute(lifecycleQuery, params);

    // Calculate lifecycle metrics
    const lifecycleMetrics = calculateLifecycleMetrics(lifecycleData);

    // Get customer behavior analysis
    const customerBehaviorQuery = `
      SELECT 
        e.customer_email,
        COUNT(*) as estimate_count,
        SUM(e.total) as total_value,
        AVG(e.total) as average_value,
        SUM(CASE WHEN e.status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
        SUM(CASE WHEN e.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
      FROM estimates e
      ${whereClause}
      GROUP BY e.customer_email
      HAVING estimate_count > 1
      ORDER BY estimate_count DESC, total_value DESC
      LIMIT 20
    `;

    const [customerBehavior] = await connection.execute(customerBehaviorQuery, params);

    const response = {
      success: true,
      message: 'Estimate performance report generated successfully',
      data: {
        report_period: {
          date_from: date_from || 'all_time',
          date_to: date_to || 'all_time'
        },
        performance_metrics: {
          total_estimates: performance.total_estimates || 0,
          acceptance_rate: performance.total_estimates > 0 ? 
            ((performance.accepted_count / performance.total_estimates) * 100).toFixed(2) : 0,
          rejection_rate: performance.total_estimates > 0 ? 
            ((performance.rejected_count / performance.total_estimates) * 100).toFixed(2) : 0,
          expiration_rate: performance.total_estimates > 0 ? 
            ((performance.expired_count / performance.total_estimates) * 100).toFixed(2) : 0,
          total_value: performance.total_value || 0,
          accepted_value: performance.accepted_value || 0,
          value_acceptance_rate: performance.total_value > 0 ? 
            ((performance.accepted_value / performance.total_value) * 100).toFixed(2) : 0
        },
        value_analysis: {
          avg_accepted_value: performance.avg_accepted_value || 0,
          avg_rejected_value: performance.avg_rejected_value || 0,
          avg_expired_value: performance.avg_expired_value || 0,
          value_difference: (performance.avg_accepted_value || 0) - (performance.avg_rejected_value || 0)
        },
        response_time_metrics: responseTimeMetrics,
        lifecycle_metrics: lifecycleMetrics,
        customer_behavior: customerBehavior.map(customer => ({
          customer_email: customer.customer_email,
          estimate_count: customer.estimate_count,
          total_value: customer.total_value,
          average_value: customer.average_value,
          acceptance_rate: customer.estimate_count > 0 ? 
            ((customer.accepted_count / customer.estimate_count) * 100).toFixed(2) : 0,
          customer_type: getCustomerType(customer.estimate_count, customer.accepted_count)
        })),
        recommendations: generatePerformanceRecommendations(performance, responseTimeMetrics, lifecycleMetrics)
      },
      timestamp: new Date().toISOString()
    };

    if (format === 'pdf') {
      // TODO: Implement PDF generation
      res.json({
        success: false,
        message: 'PDF format not yet implemented',
        error: 'PDF_NOT_IMPLEMENTED',
        timestamp: new Date().toISOString()
      });
    } else {
      res.json(response);
    }

  } catch (error) {
    console.error('Error generating estimate performance report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate estimate performance report',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get estimate insights
 */
async function getEstimateInsights(req, res) {
  try {
    const connection = await getConnection();
    
    const {
      date_from,
      date_to,
      status,
      service_type
    } = req.query;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (date_from) {
      conditions.push('e.created_at >= ?');
      params.push(date_from);
    }

    if (date_to) {
      conditions.push('e.created_at <= ?');
      params.push(date_to);
    }

    if (status) {
      conditions.push('e.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get trend analysis
    const trendQuery = `
      SELECT 
        DATE_FORMAT(e.created_at, '%Y-%m') as month,
        COUNT(*) as estimate_count,
        SUM(e.total) as total_value,
        AVG(e.total) as average_value,
        SUM(CASE WHEN e.status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
        SUM(CASE WHEN e.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
      FROM estimates e
      WHERE e.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      ${whereClause ? whereClause.replace('e.created_at', 'e.created_at') : ''}
      GROUP BY DATE_FORMAT(e.created_at, '%Y-%m')
      ORDER BY month ASC
    `;

    const [trendData] = await connection.execute(trendQuery, params);

    // Get seasonal patterns
    const seasonalQuery = `
      SELECT 
        MONTH(e.created_at) as month_number,
        MONTHNAME(e.created_at) as month_name,
        COUNT(*) as estimate_count,
        AVG(e.total) as average_value,
        SUM(CASE WHEN e.status = 'accepted' THEN 1 ELSE 0 END) as accepted_count
      FROM estimates e
      WHERE e.created_at >= DATE_SUB(NOW(), INTERVAL 2 YEAR)
      ${whereClause ? whereClause.replace('e.created_at', 'e.created_at') : ''}
      GROUP BY MONTH(e.created_at), MONTHNAME(e.created_at)
      ORDER BY month_number
    `;

    const [seasonalData] = await connection.execute(seasonalQuery, params);

    // Get pricing insights
    const pricingQuery = `
      SELECT 
        ei.category,
        COUNT(*) as item_count,
        AVG(ei.base_price) as avg_base_price,
        AVG(ei.price_per_unit) as avg_unit_price,
        MIN(ei.base_price) as min_price,
        MAX(ei.base_price) as max_price,
        SUM(ei.total) as total_value
      FROM estimate_items ei
      JOIN estimates e ON ei.estimate_id = e.id
      ${whereClause ? `WHERE ${whereClause.replace('e.', 'e.')}` : ''}
      GROUP BY ei.category
      ORDER BY total_value DESC
    `;

    const [pricingData] = await connection.execute(pricingQuery, params);

    // Get customer insights
    const customerQuery = `
      SELECT 
        e.customer_email,
        COUNT(*) as estimate_count,
        SUM(e.total) as total_value,
        AVG(e.total) as average_value,
        MIN(e.created_at) as first_estimate,
        MAX(e.created_at) as last_estimate,
        SUM(CASE WHEN e.status = 'accepted' THEN 1 ELSE 0 END) as accepted_count
      FROM estimates e
      ${whereClause}
      GROUP BY e.customer_email
      ORDER BY total_value DESC
      LIMIT 15
    `;

    const [customerData] = await connection.execute(customerQuery, params);

    const response = {
      success: true,
      message: 'Estimate insights generated successfully',
      data: {
        report_period: {
          date_from: date_from || 'all_time',
          date_to: date_to || 'all_time'
        },
        trends: {
          monthly_trends: trendData.map(month => ({
            month: month.month,
            estimate_count: month.estimate_count,
            total_value: month.total_value,
            average_value: month.average_value,
            acceptance_rate: month.estimate_count > 0 ? 
              ((month.accepted_count / month.estimate_count) * 100).toFixed(2) : 0
          })),
          growth_rate: calculateGrowthRate(trendData),
          seasonality: seasonalData.map(season => ({
            month: season.month_name,
            estimate_count: season.estimate_count,
            average_value: season.average_value,
            acceptance_rate: season.estimate_count > 0 ? 
              ((season.accepted_count / season.estimate_count) * 100).toFixed(2) : 0
          }))
        },
        pricing_insights: {
          category_analysis: pricingData.map(cat => ({
            category: cat.category,
            item_count: cat.item_count,
            avg_base_price: cat.avg_base_price,
            avg_unit_price: cat.avg_unit_price,
            price_range: {
              min: cat.min_price,
              max: cat.max_price
            },
            total_value: cat.total_value
          })),
          price_trends: analyzePriceTrends(pricingData),
          competitive_analysis: generateCompetitiveAnalysis(pricingData)
        },
        customer_insights: {
          top_customers: customerData.map(customer => ({
            customer_email: customer.customer_email,
            estimate_count: customer.estimate_count,
            total_value: customer.total_value,
            average_value: customer.average_value,
            customer_lifetime: calculateCustomerLifetime(customer.first_estimate, customer.last_estimate),
            acceptance_rate: customer.estimate_count > 0 ? 
              ((customer.accepted_count / customer.estimate_count) * 100).toFixed(2) : 0,
            customer_segment: getCustomerSegment(customer.total_value, customer.estimate_count)
          })),
          customer_segments: analyzeCustomerSegments(customerData)
        },
        actionable_insights: generateActionableInsights(trendData, seasonalData, pricingData, customerData)
      },
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error generating estimate insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate estimate insights',
      error: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}

// Helper functions

function generateInsights(summary, conversionRates, monthlyData) {
  const insights = [];

  if (conversionRates.acceptance_rate < 30) {
    insights.push({
      type: 'warning',
      message: 'Low acceptance rate detected. Consider reviewing pricing strategy and estimate quality.',
      metric: 'acceptance_rate',
      value: conversionRates.acceptance_rate + '%',
      recommendation: 'Review pricing competitiveness and estimate presentation'
    });
  }

  if (summary.average_value < 500) {
    insights.push({
      type: 'info',
      message: 'Average estimate value is below industry standard.',
      metric: 'average_value',
      value: '$' + summary.average_value,
      recommendation: 'Consider bundling services or reviewing pricing structure'
    });
  }

  return insights;
}

function calculateResponseTimeMetrics(responseTimeData) {
  if (responseTimeData.length === 0) {
    return {
      avg_days_to_send: 0,
      avg_days_to_accept: 0,
      avg_days_to_reject: 0
    };
  }

  const validSendTimes = responseTimeData.filter(item => item.days_to_send !== null);
  const validAcceptTimes = responseTimeData.filter(item => item.days_to_accept !== null);
  const validRejectTimes = responseTimeData.filter(item => item.days_to_reject !== null);

  return {
    avg_days_to_send: validSendTimes.length > 0 ? 
      (validSendTimes.reduce((sum, item) => sum + item.days_to_send, 0) / validSendTimes.length).toFixed(1) : 0,
    avg_days_to_accept: validAcceptTimes.length > 0 ? 
      (validAcceptTimes.reduce((sum, item) => sum + item.days_to_accept, 0) / validAcceptTimes.length).toFixed(1) : 0,
    avg_days_to_reject: validRejectTimes.length > 0 ? 
      (validRejectTimes.reduce((sum, item) => sum + item.days_to_reject, 0) / validRejectTimes.length).toFixed(1) : 0
  };
}

function calculateLifecycleMetrics(lifecycleData) {
  if (lifecycleData.length === 0) {
    return {
      avg_validity_period: 0,
      avg_lifecycle_duration: 0
    };
  }

  const validValidityPeriods = lifecycleData.filter(item => item.validity_period !== null);
  const validLifecycleDurations = lifecycleData.filter(item => item.lifecycle_duration !== null);

  return {
    avg_validity_period: validValidityPeriods.length > 0 ? 
      (validValidityPeriods.reduce((sum, item) => sum + item.validity_period, 0) / validValidityPeriods.length).toFixed(1) : 0,
    avg_lifecycle_duration: validLifecycleDurations.length > 0 ? 
      (validLifecycleDurations.reduce((sum, item) => sum + item.lifecycle_duration, 0) / validLifecycleDurations.length).toFixed(1) : 0
  };
}

function getCustomerType(estimateCount, acceptedCount) {
  if (estimateCount >= 5 && acceptedCount >= 3) return 'loyal';
  if (estimateCount >= 3 && acceptedCount >= 1) return 'regular';
  if (estimateCount >= 2) return 'returning';
  return 'new';
}

function generatePerformanceRecommendations(performance, responseTimeMetrics, lifecycleMetrics) {
  const recommendations = [];

  if (responseTimeMetrics.avg_days_to_send > 3) {
    recommendations.push({
      category: 'response_time',
      priority: 'high',
      message: 'Reduce time to send estimates to improve customer experience',
      action: 'Implement estimate templates and streamline approval process'
    });
  }

  if (lifecycleMetrics.avg_lifecycle_duration > 45) {
    recommendations.push({
      category: 'lifecycle',
      priority: 'medium',
      message: 'Estimates are taking too long to reach resolution',
      action: 'Implement follow-up automation and improve communication'
    });
  }

  return recommendations;
}

function calculateGrowthRate(trendData) {
  if (trendData.length < 2) return 0;
  
  const recent = trendData[trendData.length - 1];
  const previous = trendData[trendData.length - 2];
  
  if (previous.estimate_count === 0) return 0;
  
  return (((recent.estimate_count - previous.estimate_count) / previous.estimate_count) * 100).toFixed(2);
}

function analyzePriceTrends(pricingData) {
  // Simple price trend analysis
  return {
    highest_priced_category: pricingData.reduce((max, cat) => 
      cat.avg_base_price > max.avg_base_price ? cat : max, pricingData[0]),
    lowest_priced_category: pricingData.reduce((min, cat) => 
      cat.avg_base_price < min.avg_base_price ? cat : min, pricingData[0]),
    price_variance: pricingData.map(cat => ({
      category: cat.category,
      variance: ((cat.max_price - cat.min_price) / cat.avg_base_price * 100).toFixed(2)
    }))
  };
}

function generateCompetitiveAnalysis(pricingData) {
  return {
    market_position: pricingData.map(cat => ({
      category: cat.category,
      position: cat.avg_base_price > 1000 ? 'premium' : 
                cat.avg_base_price > 500 ? 'mid-market' : 'budget'
    })),
    pricing_strategy: 'Consider implementing dynamic pricing based on demand and competition'
  };
}

function calculateCustomerLifetime(firstEstimate, lastEstimate) {
  if (!firstEstimate || !lastEstimate) return 0;
  const first = new Date(firstEstimate);
  const last = new Date(lastEstimate);
  return Math.ceil((last - first) / (1000 * 60 * 60 * 24));
}

function getCustomerSegment(totalValue, estimateCount) {
  if (totalValue > 10000) return 'enterprise';
  if (totalValue > 5000) return 'business';
  if (totalValue > 1000) return 'small_business';
  return 'individual';
}

function analyzeCustomerSegments(customerData) {
  const segments = {
    enterprise: 0,
    business: 0,
    small_business: 0,
    individual: 0
  };

  customerData.forEach(customer => {
    const segment = getCustomerSegment(customer.total_value, customer.estimate_count);
    segments[segment]++;
  });

  return segments;
}

function generateActionableInsights(trendData, seasonalData, pricingData, customerData) {
  const insights = [];

  // Trend-based insights
  if (trendData.length > 1) {
    const recent = trendData[trendData.length - 1];
    const previous = trendData[trendData.length - 2];
    
    if (recent.estimate_count < previous.estimate_count) {
      insights.push({
        type: 'warning',
        message: 'Declining estimate volume detected',
        action: 'Review marketing strategies and lead generation efforts'
      });
    }
  }

  // Seasonal insights
  const peakMonth = seasonalData.reduce((max, month) => 
    month.estimate_count > max.estimate_count ? month : max, seasonalData[0]);
  
  if (peakMonth) {
    insights.push({
      type: 'opportunity',
      message: `Peak season identified: ${peakMonth.month_name}`,
      action: 'Increase marketing efforts and capacity planning for peak months'
    });
  }

  // Pricing insights
  const highVarianceCategories = pricingData.filter(cat => 
    ((cat.max_price - cat.min_price) / cat.avg_base_price) > 2
  );

  if (highVarianceCategories.length > 0) {
    insights.push({
      type: 'info',
      message: 'High price variance detected in some categories',
      action: 'Standardize pricing structure for better consistency'
    });
  }

  return insights;
}

module.exports = {
  getEstimateSummaryReport,
  getEstimatePerformanceReport,
  getEstimateInsights
};
