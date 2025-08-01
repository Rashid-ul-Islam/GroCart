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
        TO_CHAR(COALESCE(d.actual_arrival, d.estimated_arrival, d.created_at), 'Dy') as name,
        EXTRACT(DOW FROM COALESCE(d.actual_arrival, d.estimated_arrival, d.created_at)) as day_num,
        COUNT(d.delivery_id) as deliveries,
        COALESCE(AVG(dr.rating), 0) as rating,
        DATE(COALESCE(d.actual_arrival, d.estimated_arrival, d.created_at)) as date
      FROM "Delivery" d
      LEFT JOIN "DeliveryReview" dr ON d.delivery_id = dr.delivery_id
      WHERE d.delivery_boy_id = $1 
        AND COALESCE(d.actual_arrival, d.estimated_arrival, d.created_at) >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY EXTRACT(DOW FROM COALESCE(d.actual_arrival, d.estimated_arrival, d.created_at)), TO_CHAR(COALESCE(d.actual_arrival, d.estimated_arrival, d.created_at), 'Dy'), DATE(COALESCE(d.actual_arrival, d.estimated_arrival, d.created_at))
      ORDER BY 
        CASE EXTRACT(DOW FROM COALESCE(d.actual_arrival, d.estimated_arrival, d.created_at))
          WHEN 6 THEN 0  -- Saturday first
          WHEN 0 THEN 1  -- Sunday second
          WHEN 1 THEN 2  -- Monday third
          WHEN 2 THEN 3  -- Tuesday fourth
          WHEN 3 THEN 4  -- Wednesday fifth
          WHEN 4 THEN 5  -- Thursday sixth
          WHEN 5 THEN 6  -- Friday seventh
        END;
    `;
    
    const result = await pool.query(performanceQuery, [deliveryBoyId]);
    
    // Create array for all 7 days of the week starting from Saturday
    const daysOfWeek = [
      { name: 'Sat', dayNum: 6 },
      { name: 'Sun', dayNum: 0 },
      { name: 'Mon', dayNum: 1 },
      { name: 'Tue', dayNum: 2 },
      { name: 'Wed', dayNum: 3 },
      { name: 'Thu', dayNum: 4 },
      { name: 'Fri', dayNum: 5 }
    ];
    
    // Create performance data ensuring all days are included
    const performanceData = daysOfWeek.map(day => {
      const dayData = result.rows.find(row => parseInt(row.day_num) === day.dayNum);
      return {
        name: day.name,
        deliveries: dayData ? parseInt(dayData.deliveries) : 0,
        rating: dayData ? parseFloat(dayData.rating).toFixed(1) : '0.0',
        date: dayData ? dayData.date : null
      };
    });
    
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
          COUNT(d.delivery_id) * 30 as total_earnings
        FROM "Delivery" d
        LEFT JOIN "DeliveryReview" dr ON d.delivery_id = dr.delivery_id
        WHERE d.delivery_boy_id = $1
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
    
    const result = await pool.query(summaryQuery, [deliveryBoyId]);
    const data = result.rows[0] || {
      total_deliveries: 0,
      average_rating: 0,
      on_time_rate: 0,
      total_earnings: 0
    };
    
    res.json({
      totalDeliveries: parseInt(data.total_deliveries) || 0,
      averageRating: parseFloat(data.average_rating) || 0,
      onTimeRate: parseInt(data.on_time_rate) || 0,
      earnings: parseInt(data.total_earnings) || 0
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
          WHEN dp.customer_rating = 5 THEN 'Excellent (5★)'
          WHEN dp.customer_rating = 4 THEN 'Good (4★)'
          WHEN dp.customer_rating = 3 THEN 'Average (3★)'
          WHEN dp.customer_rating <= 2 THEN 'Poor (≤2★)'
          ELSE 'No customer_rating'
        END as name,
        COUNT(*) as value
      FROM "Delivery" d
      LEFT JOIN "DeliveryPerformance" dp ON d.delivery_id = dp.delivery_id
      WHERE d.delivery_boy_id = $1 
        AND d.created_at >= $2 
        AND d.created_at <= $3
        AND d.actual_arrival IS NOT NULL
      GROUP BY 
        CASE 
          WHEN dp.customer_rating = 5 THEN 'Excellent (5★)'
          WHEN dp.customer_rating = 4 THEN 'Good (4★)'
          WHEN dp.customer_rating = 3 THEN 'Average (3★)'
          WHEN dp.customer_rating <= 2 THEN 'Poor (≤2★)'
          ELSE 'No customer_rating'
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
        COUNT(d.delivery_id) * 30 as earnings
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
      revenue: parseInt(row.earnings)
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
