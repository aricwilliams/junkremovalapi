const { query } = require('../config/database');

// Helper function to create standardized API response
const createResponse = (success, message, data = null, error = null) => ({
  success,
  message,
  data,
  error,
  timestamp: new Date().toISOString()
});

// Get lead summary report
const getLeadSummaryReport = async (req, res) => {
  try {
    const {
      date_from,
      date_to,
      status,
      source,
      assigned_to,
      format = 'json'
    } = req.query;

    // Build WHERE clause for filtering
    let whereClause = 'WHERE status != "deleted"';
    const params = [];

    if (date_from) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(date_to);
    }

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (source) {
      whereClause += ' AND source = ?';
      params.push(source);
    }

    if (assigned_to) {
      whereClause += ' AND assigned_to = ?';
      params.push(assigned_to);
    }

    // Get summary statistics
    const summarySql = `
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
        COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_leads,
        COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified_leads,
        COUNT(CASE WHEN status = 'quoted' THEN 1 END) as quoted_leads,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_leads,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
        COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_leads,
        SUM(estimated_value) as total_potential_value,
        AVG(estimated_value) as average_estimated_value,
        AVG(lead_score) as average_lead_score
      FROM leads 
      ${whereClause}
    `;
    
    const summary = await query(summarySql, params);

    // Get leads by source
    const leadsBySourceSql = `
      SELECT 
        source,
        COUNT(*) as count,
        SUM(estimated_value) as total_value,
        AVG(estimated_value) as average_value
      FROM leads 
      ${whereClause}
      GROUP BY source
      ORDER BY count DESC
    `;
    
    const leadsBySource = await query(leadsBySourceSql, params);

    // Get leads by status
    const leadsByStatusSql = `
      SELECT 
        status,
        COUNT(*) as count,
        SUM(estimated_value) as total_value
      FROM leads 
      ${whereClause}
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const leadsByStatus = await query(leadsByStatusSql, params);

    // Get leads by priority
    const leadsByPrioritySql = `
      SELECT 
        priority,
        COUNT(*) as count,
        SUM(estimated_value) as total_value
      FROM leads 
      ${whereClause}
      GROUP BY priority
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END
    `;
    
    const leadsByPriority = await query(leadsByPrioritySql, params);

    // Get top performing sources
    const topSourcesSql = `
      SELECT 
        source,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
        ROUND((COUNT(CASE WHEN status = 'converted' THEN 1 END) / COUNT(*)) * 100, 1) as conversion_rate,
        AVG(estimated_value) as average_value
      FROM leads 
      ${whereClause}
      GROUP BY source
      HAVING total_leads >= 5
      ORDER BY conversion_rate DESC
      LIMIT 5
    `;
    
    const topPerformingSources = await query(topSourcesSql, params);

    // Get lead growth trends (monthly)
    const growthSql = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as new_leads,
        SUM(estimated_value) as total_value
      FROM leads 
      ${whereClause}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `;
    
    const leadGrowth = await query(growthSql, params);

    // Calculate growth percentages
    let monthlyGrowth = 0;
    let quarterlyGrowth = 0;

    if (leadGrowth.length >= 2) {
      const currentMonth = leadGrowth[0];
      const previousMonth = leadGrowth[1];
      
      if (previousMonth.new_leads > 0) {
        monthlyGrowth = ((currentMonth.new_leads - previousMonth.new_leads) / previousMonth.new_leads) * 100;
      }
    }

    if (leadGrowth.length >= 4) {
      const currentQuarter = leadGrowth.slice(0, 3).reduce((sum, month) => sum + month.new_leads, 0);
      const previousQuarter = leadGrowth.slice(3, 6).reduce((sum, month) => sum + month.new_leads, 0);
      
      if (previousQuarter > 0) {
        quarterlyGrowth = ((currentQuarter - previousQuarter) / previousQuarter) * 100;
      }
    }

    const response = createResponse(true, 'Lead summary report generated successfully', {
      report_period: {
        from: date_from || 'all_time',
        to: date_to || 'now'
      },
      summary: {
        total_leads: summary[0].total_leads,
        new_leads: summary[0].new_leads,
        contacted_leads: summary[0].contacted_leads,
        qualified_leads: summary[0].qualified_leads,
        quoted_leads: summary[0].quoted_leads,
        scheduled_leads: summary[0].scheduled_leads,
        converted_leads: summary[0].converted_leads,
        lost_leads: summary[0].lost_leads,
        total_potential_value: parseFloat(summary[0].total_potential_value || 0),
        average_estimated_value: parseFloat(summary[0].average_estimated_value || 0),
        average_lead_score: parseFloat(summary[0].average_lead_score || 0)
      },
      leads_by_source: leadsBySource.map(source => ({
        source: source.source,
        count: source.count,
        total_value: parseFloat(source.total_value || 0),
        average_value: parseFloat(source.average_value || 0)
      })),
      leads_by_status: leadsByStatus.map(status => ({
        status: status.status,
        count: status.count,
        total_value: parseFloat(status.total_value || 0)
      })),
      leads_by_priority: leadsByPriority.map(priority => ({
        priority: priority.priority,
        count: priority.count,
        total_value: parseFloat(priority.total_value || 0)
      })),
      top_performing_sources: topPerformingSources.map(source => ({
        source: source.source,
        total_leads: source.total_leads,
        converted_leads: source.converted_leads,
        conversion_rate: parseFloat(source.conversion_rate || 0),
        average_value: parseFloat(source.average_value || 0)
      })),
      lead_growth: {
        monthly_growth: Math.round(monthlyGrowth * 100) / 100,
        quarterly_growth: Math.round(quarterlyGrowth * 100) / 100,
        monthly_trends: leadGrowth.map(month => ({
          month: month.month,
          new_leads: month.new_leads,
          total_value: parseFloat(month.total_value || 0)
        }))
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error generating lead summary report:', error);
    const response = createResponse(false, 'Failed to generate lead summary report', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get lead performance report
const getLeadPerformanceReport = async (req, res) => {
  try {
    const {
      date_from,
      date_to,
      employee_id,
      source
    } = req.query;

    // Build WHERE clause for filtering
    let whereClause = 'WHERE l.status != "deleted"';
    const params = [];

    if (date_from) {
      whereClause += ' AND DATE(l.created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(l.created_at) <= ?';
      params.push(date_to);
    }

    if (employee_id) {
      whereClause += ' AND l.assigned_to = ?';
      params.push(employee_id);
    }

    if (source) {
      whereClause += ' AND l.source = ?';
      params.push(source);
    }

    // Get team performance
    const teamPerformanceSql = `
      SELECT 
        l.assigned_to,
        COUNT(*) as leads_assigned,
        COUNT(CASE WHEN l.status = 'qualified' THEN 1 END) as leads_qualified,
        COUNT(CASE WHEN l.status = 'converted' THEN 1 END) as leads_converted,
        ROUND((COUNT(CASE WHEN l.status = 'converted' THEN 1 END) / COUNT(*)) * 100, 1) as conversion_rate,
        SUM(l.estimated_value) as total_value,
        AVG(l.estimated_value) as average_value
      FROM leads l
      ${whereClause}
      GROUP BY l.assigned_to
      ORDER BY leads_converted DESC
    `;
    
    const teamPerformance = await query(teamPerformanceSql, params);

    // Get source performance
    const sourcePerformanceSql = `
      SELECT 
        l.source,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN l.status = 'converted' THEN 1 END) as converted_leads,
        ROUND((COUNT(CASE WHEN l.status = 'converted' THEN 1 END) / COUNT(*)) * 100, 1) as conversion_rate,
        AVG(l.estimated_value) as average_value
      FROM leads l
      ${whereClause}
      GROUP BY l.source
      ORDER BY conversion_rate DESC
    `;
    
    const sourcePerformance = await query(sourcePerformanceSql, params);

    // Get conversion funnel
    const conversionFunnelSql = `
      SELECT 
        COUNT(*) as new_leads,
        COUNT(CASE WHEN l.status IN ('contacted', 'qualified', 'quoted', 'scheduled', 'converted') THEN 1 END) as contacted_leads,
        COUNT(CASE WHEN l.status IN ('qualified', 'quoted', 'scheduled', 'converted') THEN 1 END) as qualified_leads,
        COUNT(CASE WHEN l.status IN ('quoted', 'scheduled', 'converted') THEN 1 END) as proposal_sent,
        COUNT(CASE WHEN l.status = 'converted' THEN 1 END) as converted_leads
      FROM leads l
      ${whereClause}
    `;
    
    const conversionFunnel = await query(conversionFunnelSql, params);

    // Get average response time (if activity tracking is available)
    const responseTimeSql = `
      SELECT 
        AVG(TIMESTAMPDIFF(HOUR, l.created_at, la.activity_date)) as avg_response_hours
      FROM leads l
      LEFT JOIN lead_activities la ON l.id = la.lead_id 
        AND la.activity_type IN ('phone_call', 'email', 'sms')
        AND la.activity_date > l.created_at
      ${whereClause}
      AND la.id IS NOT NULL
    `;
    
    const responseTime = await query(responseTimeSql, params);

    const response = createResponse(true, 'Lead performance report generated successfully', {
      report_period: {
        from: date_from || 'all_time',
        to: date_to || 'now'
      },
      team_performance: teamPerformance.map(employee => ({
        employee_id: employee.assigned_to,
        leads_assigned: employee.leads_assigned,
        leads_qualified: employee.leads_qualified,
        leads_converted: employee.leads_converted,
        conversion_rate: parseFloat(employee.conversion_rate || 0),
        total_value: parseFloat(employee.total_value || 0),
        average_value: parseFloat(employee.average_value || 0),
        average_response_time: responseTime[0]?.avg_response_hours ? 
          `${Math.round(responseTime[0].avg_response_hours)} hours` : 'N/A'
      })),
      source_performance: sourcePerformance.map(source => ({
        source: source.source,
        total_leads: source.total_leads,
        conversion_rate: parseFloat(source.conversion_rate || 0),
        average_value: parseFloat(source.average_value || 0)
      })),
      conversion_funnel: {
        new_leads: conversionFunnel[0].new_leads,
        contacted_leads: conversionFunnel[0].contacted_leads,
        qualified_leads: conversionFunnel[0].qualified_leads,
        proposal_sent: conversionFunnel[0].proposal_sent,
        converted_leads: conversionFunnel[0].converted_leads
      }
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error generating lead performance report:', error);
    const response = createResponse(false, 'Failed to generate lead performance report', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

// Get lead insights and recommendations
const getLeadInsights = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    // Build WHERE clause for filtering
    let whereClause = 'WHERE status != "deleted"';
    const params = [];

    if (date_from) {
      whereClause += ' AND DATE(created_at) >= ?';
      params.push(date_from);
    }

    if (date_to) {
      whereClause += ' AND DATE(created_at) <= ?';
      params.push(date_to);
    }

    // Get conversion rate trends
    const conversionTrendsSql = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
        ROUND((COUNT(CASE WHEN status = 'converted' THEN 1 END) / COUNT(*)) * 100, 1) as conversion_rate
      FROM leads 
      ${whereClause}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 6
    `;
    
    const conversionTrends = await query(conversionTrendsSql, params);

    // Get lead quality insights
    const qualityInsightsSql = `
      SELECT 
        AVG(lead_score) as avg_lead_score,
        COUNT(CASE WHEN lead_score >= 80 THEN 1 END) as high_quality_leads,
        COUNT(CASE WHEN lead_score < 50 THEN 1 END) as low_quality_leads,
        COUNT(CASE WHEN estimated_value >= 5000 THEN 1 END) as high_value_leads
      FROM leads 
      ${whereClause}
    `;
    
    const qualityInsights = await query(qualityInsightsSql, params);

    // Get source effectiveness
    const sourceEffectivenessSql = `
      SELECT 
        source,
        COUNT(*) as total_leads,
        ROUND((COUNT(CASE WHEN status = 'converted' THEN 1 END) / COUNT(*)) * 100, 1) as conversion_rate,
        AVG(estimated_value) as avg_value
      FROM leads 
      ${whereClause}
      GROUP BY source
      HAVING total_leads >= 3
      ORDER BY conversion_rate DESC
    `;
    
    const sourceEffectiveness = await query(sourceEffectivenessSql, params);

    // Generate insights and recommendations
    const insights = [];
    const recommendations = [];

    // Conversion rate insights
    if (conversionTrends.length >= 2) {
      const currentRate = conversionTrends[0].conversion_rate;
      const previousRate = conversionTrends[1].conversion_rate;
      
      if (currentRate > previousRate) {
        insights.push('Conversion rate is improving month over month');
      } else if (currentRate < previousRate) {
        insights.push('Conversion rate has declined recently');
        recommendations.push('Review lead qualification process and follow-up procedures');
      }
    }

    // Lead quality insights
    const avgScore = qualityInsights[0].avg_lead_score;
    if (avgScore < 60) {
      insights.push('Average lead quality score is below optimal levels');
      recommendations.push('Improve lead qualification criteria and scoring system');
    }

    const highQualityPercentage = (qualityInsights[0].high_quality_leads / qualityInsights[0].total_leads) * 100;
    if (highQualityPercentage < 30) {
      recommendations.push('Focus on attracting higher quality leads through better targeting');
    }

    // Source effectiveness insights
    const bestSource = sourceEffectiveness[0];
    const worstSource = sourceEffectiveness[sourceEffectiveness.length - 1];
    
    if (bestSource && worstSource) {
      const rateDifference = bestSource.conversion_rate - worstSource.conversion_rate;
      if (rateDifference > 20) {
        insights.push(`Significant performance gap between lead sources: ${bestSource.source} (${bestSource.conversion_rate}%) vs ${worstSource.source} (${worstSource.conversion_rate}%)`);
        recommendations.push(`Optimize ${worstSource.source} lead generation or reallocate budget to ${bestSource.source}`);
      }
    }

    // General recommendations based on data
    if (qualityInsights[0].high_value_leads < 10) {
      recommendations.push('Focus on attracting higher value leads through premium service positioning');
    }

    const response = createResponse(true, 'Lead insights generated successfully', {
      insights: insights,
      recommendations: recommendations,
      conversion_trends: conversionTrends.map(trend => ({
        month: trend.month,
        total_leads: trend.total_leads,
        converted_leads: trend.converted_leads,
        conversion_rate: parseFloat(trend.conversion_rate || 0)
      })),
      quality_metrics: {
        average_lead_score: parseFloat(qualityInsights[0].avg_lead_score || 0),
        high_quality_leads: qualityInsights[0].high_quality_leads,
        low_quality_leads: qualityInsights[0].low_quality_leads,
        high_value_leads: qualityInsights[0].high_value_leads
      },
      source_effectiveness: sourceEffectiveness.map(source => ({
        source: source.source,
        total_leads: source.total_leads,
        conversion_rate: parseFloat(source.conversion_rate || 0),
        average_value: parseFloat(source.avg_value || 0)
      }))
    });

    res.status(200).json(response);

  } catch (error) {
    console.error('Error generating lead insights:', error);
    const response = createResponse(false, 'Failed to generate lead insights', null, 'INTERNAL_SERVER_ERROR');
    res.status(500).json(response);
  }
};

module.exports = {
  getLeadSummaryReport,
  getLeadPerformanceReport,
  getLeadInsights
};
