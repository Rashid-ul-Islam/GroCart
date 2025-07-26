import pool from "../db.js";

// Helper function to get date range based on period
const getDateRange = (period) => {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  
  return { startDate, endDate: now };
};

// Get delivery boy weekly performance data
export const getWeeklyPerformance = async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;
    const { period = 'week' } = req.query;
    const { startDate, endDate } = getDateRange(period);
    
    const performanceQuery = `
      SELECT 
        TO_CHAR(d.created_at, 'Dy') as name,
        EXTRACT(DOW FROM d.created_at) as day_num,
        COUNT(d.delivery_id) as deliveries,
        COALESCE(AVG(dr.rating), 0) as rating,
        DATE(d.created_at) as date
      FROM "Delivery" d
      LEFT JOIN "DeliveryReview" dr ON d.delivery_id = dr.delivery_id
      WHERE d.delivery_boy_id = $1 
        AND d.created_at >= $2 
        AND d.created_at <= $3
        AND d.actual_arrival IS NOT NULL
      GROUP BY EXTRACT(DOW FROM d.created_at), TO_CHAR(d.created_at, 'Dy'), DATE(d.created_at)
      ORDER BY EXTRACT(DOW FROM d.created_at);
    `;
    
    const result = await pool.query(performanceQuery, [deliveryBoyId, startDate, endDate]);
    
    const performanceData = result.rows.map(row => ({
      name: row.name,
      deliveries: parseInt(row.deliveries),
      rating: parseFloat(row.rating).toFixed(1),
      date: row.date
    }));
    
    res.json(performanceData);
  } catch (error) {
    console.error('Error fetching weekly performance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get delivery boy summary statistics
export const getPerformanceSummary = async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;
    const { period = 'week' } = req.query;
    const { startDate, endDate } = getDateRange(period);
    
    const summaryQuery = `
      WITH delivery_stats AS (
        SELECT 
          COUNT(d.delivery_id) as total_deliveries,
          COALESCE(AVG(dr.rating), 0) as average_rating,
          COUNT(CASE WHEN d.actual_arrival <= d.estimated_arrival THEN 1 END) as on_time_deliveries,
          SUM(CASE WHEN dp.delivery_boy_id IS NOT NULL THEN 50 ELSE 30 END) as total_earnings
        FROM "Delivery" d
        LEFT JOIN "DeliveryReview" dr ON d.delivery_id = dr.delivery_id
        LEFT JOIN "DeliveryPerformance" dp ON d.delivery_id = dp.delivery_id AND d.delivery_boy_id = dp.delivery_boy_id
        WHERE d.delivery_boy_id = $1 
          AND d.created_at >= $2 
          AND d.created_at <= $3
          AND d.actual_arrival IS NOT NULL
      )
      SELECT 
        total_deliveries,
        ROUND(average_rating, 1) as average_rating,
        CASE 
          WHEN total_deliveries > 0 
          THEN ROUND((on_time_deliveries::decimal / total_deliveries * 100), 0)
          ELSE 0 
        END as on_time_rate,
        total_earnings
      FROM delivery_stats;
    `;
    
    const result = await pool.query(summaryQuery, [deliveryBoyId, startDate, endDate]);
    const data = result.rows[0] || {
      total_deliveries: 0,
      average_rating: 0,
      on_time_rate: 0,
      total_earnings: 0
    };
    
    res.json({
      totalWeeklyDeliveries: parseInt(data.total_deliveries) || 0,
      averageWeeklyRating: parseFloat(data.average_rating) || 0,
      onTimeRate: parseInt(data.on_time_rate) || 0,
      totalEarnings: parseInt(data.total_earnings) || 0
    });
  } catch (error) {
    console.error('Error fetching performance summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get rating distribution for pie chart
export const getRatingDistribution = async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;
    const { period = 'week' } = req.query;
    const { startDate, endDate } = getDateRange(period);
    
    const distributionQuery = `
      SELECT 
        CASE 
          WHEN dr.rating = 5 THEN 'Excellent (5★)'
          WHEN dr.rating = 4 THEN 'Good (4★)'
          WHEN dr.rating = 3 THEN 'Average (3★)'
          WHEN dr.rating <= 2 THEN 'Poor (≤2★)'
          ELSE 'No Rating'
        END as name,
        COUNT(*) as value
      FROM "Delivery" d
      LEFT JOIN "DeliveryReview" dr ON d.delivery_id = dr.delivery_id
      WHERE d.delivery_boy_id = $1 
        AND d.created_at >= $2 
        AND d.created_at <= $3
        AND d.actual_arrival IS NOT NULL
      GROUP BY 
        CASE 
          WHEN dr.rating = 5 THEN 'Excellent (5★)'
          WHEN dr.rating = 4 THEN 'Good (4★)'
          WHEN dr.rating = 3 THEN 'Average (3★)'
          WHEN dr.rating <= 2 THEN 'Poor (≤2★)'
          ELSE 'No Rating'
        END
      ORDER BY value DESC;
    `;
    
    const result = await pool.query(distributionQuery, [deliveryBoyId, startDate, endDate]);
    
    const colorMap = {
      'Excellent (5★)': '#10B981',
      'Good (4★)': '#3B82F6',
      'Average (3★)': '#F59E0B',
      'Poor (≤2★)': '#EF4444',
      'No Rating': '#6B7280'
    };
    
    const distributionData = result.rows.map(row => ({
      name: row.name,
      value: parseInt(row.value),
      fill: colorMap[row.name] || '#6B7280'
    }));
    
    res.json(distributionData);
  } catch (error) {
    console.error('Error fetching rating distribution:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get monthly performance data for bar chart
export const getMonthlyPerformance = async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;
    const { year = new Date().getFullYear() } = req.query;
    
    const monthlyQuery = `
      SELECT 
        TO_CHAR(d.created_at, 'Mon') as month,
        EXTRACT(MONTH FROM d.created_at) as month_num,
        COUNT(d.delivery_id) as deliveries,
        COALESCE(AVG(dr.rating), 0) as rating,
        SUM(CASE WHEN dp.delivery_boy_id IS NOT NULL THEN 50 ELSE 30 END) as revenue
      FROM "Delivery" d
      LEFT JOIN "DeliveryReview" dr ON d.delivery_id = dr.delivery_id
      LEFT JOIN "DeliveryPerformance" dp ON d.delivery_id = dp.delivery_id AND d.delivery_boy_id = dp.delivery_boy_id
      WHERE d.delivery_boy_id = $1 
        AND EXTRACT(YEAR FROM d.created_at) = $2
        AND d.actual_arrival IS NOT NULL
      GROUP BY EXTRACT(MONTH FROM d.created_at), TO_CHAR(d.created_at, 'Mon')
      ORDER BY EXTRACT(MONTH FROM d.created_at);
    `;
    
    const result = await pool.query(monthlyQuery, [deliveryBoyId, year]);
    
    const monthlyData = result.rows.map(row => ({
      month: row.month,
      deliveries: parseInt(row.deliveries),
      rating: parseFloat(row.rating).toFixed(1),
      revenue: parseInt(row.revenue)
    }));
    
    res.json(monthlyData);
  } catch (error) {
    console.error('Error fetching monthly performance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get performance insights
export const getPerformanceInsights = async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;
    const { period = 'week' } = req.query;
    const { startDate, endDate } = getDateRange(period);
    
    const insightsQuery = `
      WITH daily_performance AS (
        SELECT 
          TO_CHAR(d.created_at, 'Day') as day_name,
          COUNT(d.delivery_id) as daily_deliveries,
          COALESCE(AVG(dr.rating), 0) as daily_rating
        FROM "Delivery" d
        LEFT JOIN "DeliveryReview" dr ON d.delivery_id = dr.delivery_id
        WHERE d.delivery_boy_id = $1 
          AND d.created_at >= $2 
          AND d.created_at <= $3
          AND d.actual_arrival IS NOT NULL
        GROUP BY TO_CHAR(d.created_at, 'Day')
        ORDER BY daily_deliveries DESC
      ),
      overall_stats AS (
        SELECT 
          COUNT(d.delivery_id) as total_deliveries,
          COALESCE(AVG(dr.rating), 0) as overall_rating,
          COUNT(CASE WHEN d.actual_arrival <= d.estimated_arrival THEN 1 END) as on_time_count
        FROM "Delivery" d
        LEFT JOIN "DeliveryReview" dr ON d.delivery_id = dr.delivery_id
        WHERE d.delivery_boy_id = $1 
          AND d.created_at >= $2 
          AND d.created_at <= $3
          AND d.actual_arrival IS NOT NULL
      )
      SELECT 
        (SELECT TRIM(day_name) FROM daily_performance LIMIT 1) as peak_day,
        (SELECT daily_deliveries FROM daily_performance LIMIT 1) as peak_deliveries,
        os.overall_rating,
        CASE 
          WHEN os.total_deliveries > 0 
          THEN ROUND((os.on_time_count::decimal / os.total_deliveries * 100), 0)
          ELSE 0 
        END as satisfaction_rate
      FROM overall_stats os;
    `;
    
    const result = await pool.query(insightsQuery, [deliveryBoyId, startDate, endDate]);
    const data = result.rows[0];
    
    const insights = {
      peakPerformance: data?.peak_day && data?.peak_deliveries 
        ? `${data.peak_day} shows highest delivery count with ${data.peak_deliveries} deliveries and excellent ratings.`
        : "No peak performance data available for the selected period.",
      customerSatisfaction: data?.overall_rating 
        ? `Consistently maintaining ${parseFloat(data.overall_rating).toFixed(1)}+ rating with ${data.satisfaction_rate}% customer satisfaction rate.`
        : "No customer satisfaction data available.",
      improvementArea: data?.peak_day 
        ? "Consider route optimization strategies for lower performing days."
        : "Collect more delivery data for detailed insights."
    };
    
    res.json(insights);
  } catch (error) {
    console.error('Error fetching performance insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
