import pool from "../db.js";

// Helper function to get date range based on timeRange parameter
const getDateRange = (timeRange) => {
  const now = new Date();
  let startDate;
  
  switch (timeRange) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  return { startDate, endDate: now };
};

// Get KPI data (revenue, orders, customers, rating)
export const getKpiData = async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    const { startDate, endDate } = getDateRange(timeRange);
    
    // Get current period data
    const kpiQuery = `
      WITH current_period AS (
        SELECT 
          COALESCE(SUM(o.total_amount), 0) as current_revenue,
          COUNT(DISTINCT o.order_id) as current_orders,
          COUNT(DISTINCT CASE WHEN o.payment_status = 'pending' OR o.payment_status = 'processing' THEN o.order_id END) as active_orders
        FROM "Order" o
        WHERE o.created_at >= $1 AND o.created_at <= $2
      ),
      current_reviews AS (
        SELECT 
          COALESCE(AVG(r.rating), 0) as current_rating,
          COUNT(DISTINCT r.review_id) as total_reviews
        FROM "Review" r
        WHERE r.review_date >= $1 AND r.review_date <= $2
      ),
      total_customers AS (
        SELECT COUNT(*) as current_customers
        FROM "User" u
      ),
      new_customers AS (
        SELECT COUNT(*) as new_customer_count
        FROM "User" u
        WHERE u.created_at >= $1 AND u.created_at <= $2
      )
      SELECT 
        cp.current_revenue,
        cp.current_orders,
        tc.current_customers,
        cr.current_rating,
        cr.total_reviews,
        cp.active_orders,
        nc.new_customer_count
      FROM current_period cp
      CROSS JOIN current_reviews cr
      CROSS JOIN total_customers tc
      CROSS JOIN new_customers nc;
    `;
    
    const result = await pool.query(kpiQuery, [startDate, endDate]);
    const data = result.rows[0];
    
    const kpiData = {
      revenue: { 
        value: parseFloat(data.current_revenue) || 0
      },
      orders: { 
        value: parseInt(data.current_orders) || 0, 
        active: parseInt(data.active_orders) || 0
      },
      customers: { 
        value: parseInt(data.current_customers) || 0, 
        new: parseInt(data.new_customer_count) || 0
      },
      rating: { 
        value: parseFloat(data.current_rating).toFixed(1) || '0.0', 
        reviews: parseInt(data.total_reviews) || 0
      }
    };
    
    res.json(kpiData);
  } catch (error) {
    console.error('Error fetching KPI data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get revenue data for charts
export const getRevenueData = async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    const { startDate, endDate } = getDateRange(timeRange);
    
    const revenueQuery = `
      SELECT 
        DATE(o.created_at) as date,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COUNT(DISTINCT o.order_id) as orders,
        COUNT(DISTINCT o.user_id) as customers
      FROM "Order" o
      WHERE o.created_at >= $1 AND o.created_at <= $2
      GROUP BY DATE(o.created_at)
      ORDER BY DATE(o.created_at);
    `;
    
    const result = await pool.query(revenueQuery, [startDate, endDate]);
    
    const revenueData = result.rows.map(row => ({
      date: row.date,
      revenue: parseFloat(row.revenue),
      orders: parseInt(row.orders),
      customers: parseInt(row.customers)
    }));
    
    res.json(revenueData);
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get category performance data
export const getCategoryData = async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    const { startDate, endDate } = getDateRange(timeRange);
    
    const categoryQuery = `
      WITH category_sales AS (
        SELECT 
          c.name,
          SUM(oi.price * oi.quantity) as sales,
          COUNT(oi.order_item_id) as item_count
        FROM "Category" c
        JOIN "Product" p ON c.category_id = p.category_id
        JOIN "OrderItem" oi ON p.product_id = oi.product_id
        JOIN "Order" o ON oi.order_id = o.order_id
        WHERE o.created_at >= $1 AND o.created_at <= $2
        GROUP BY c.category_id, c.name
      ),
      total_sales AS (
        SELECT SUM(sales) as total FROM category_sales
      )
      SELECT 
        cs.name,
        cs.sales,
        ROUND((cs.sales / ts.total * 100)::numeric, 1) as value
      FROM category_sales cs
      CROSS JOIN total_sales ts
      ORDER BY cs.sales DESC
      LIMIT 10;
    `;
    
    const result = await pool.query(categoryQuery, [startDate, endDate]);
    
    const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5A2B', '#6366F1', '#EC4899', '#14B8A6', '#F97316'];
    
    const categoryData = result.rows.map((row, index) => ({
      name: row.name,
      value: parseFloat(row.value),
      sales: parseFloat(row.sales),
      color: colors[index % colors.length]
    }));
    
    res.json(categoryData);
  } catch (error) {
    console.error('Error fetching category data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get delivery performance data
export const getDeliveryData = async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    const { startDate, endDate } = getDateRange(timeRange);
    
    const deliveryQuery = `
      SELECT 
        dr.name as region,
        COUNT(d.delivery_id) as total_deliveries,
        COUNT(CASE WHEN d.actual_arrival <= d.estimated_arrival THEN 1 END) as on_time_count,
        COUNT(CASE WHEN d.actual_arrival > d.estimated_arrival THEN 1 END) as late_count,
        COALESCE(AVG(rev.rating), 0) as avg_rating
      FROM "DeliveryRegion" dr
      LEFT JOIN "DeliveryBoy" db ON dr.delivery_region_id = db.delivery_region_id
      LEFT JOIN "Delivery" d ON db.user_id = d.delivery_boy_id
      LEFT JOIN "Order" o ON d.order_id = o.order_id
      LEFT JOIN "DeliveryReview" rev ON d.delivery_id = rev.delivery_id
      WHERE o.created_at >= $1 AND o.created_at <= $2
      GROUP BY dr.delivery_region_id, dr.name
      HAVING COUNT(d.delivery_id) > 0
      ORDER BY total_deliveries DESC;
    `;
    
    const result = await pool.query(deliveryQuery, [startDate, endDate]);
    
    const deliveryData = result.rows.map(row => ({
      region: row.region,
      onTime: Math.round((row.on_time_count / row.total_deliveries) * 100),
      late: Math.round((row.late_count / row.total_deliveries) * 100),
      avgRating: parseFloat(row.avg_rating).toFixed(1),
      totalDeliveries: parseInt(row.total_deliveries)
    }));
    
    res.json(deliveryData);
  } catch (error) {
    console.error('Error fetching delivery data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get customer tier data
export const getTierData = async (req, res) => {
  try {
    const tierQuery = `
      SELECT 
        ut.name as tier,
        COUNT(u.user_id) as count,
        COALESCE(SUM(user_revenue.revenue), 0) as revenue
      FROM "UserTier" ut
      LEFT JOIN "User" u ON ut.tier_id = u.tier_id
      LEFT JOIN (
        SELECT 
          o.user_id,
          SUM(o.total_amount) as revenue
        FROM "Order" o
        WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY o.user_id
      ) user_revenue ON u.user_id = user_revenue.user_id
      GROUP BY ut.tier_id, ut.name
      ORDER BY ut.min_points;
    `;
    
    const result = await pool.query(tierQuery);
    
    const colors = ['#92400E', '#6B7280', '#F59E0B', '#8B5CF6'];
    
    const tierData = result.rows.map((row, index) => ({
      tier: row.tier,
      count: parseInt(row.count),
      revenue: parseFloat(row.revenue),
      color: colors[index % colors.length]
    }));
    
    res.json(tierData);
  } catch (error) {
    console.error('Error fetching tier data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get top products data
export const getTopProducts = async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    const { startDate, endDate } = getDateRange(timeRange);
    
    const productsQuery = `
      WITH current_sales AS (
        SELECT 
          p.name,
          c.name as category,
          SUM(oi.quantity) as sales,
          SUM(oi.price * oi.quantity) as revenue
        FROM "Product" p
        JOIN "Category" c ON p.category_id = c.category_id
        JOIN "OrderItem" oi ON p.product_id = oi.product_id
        JOIN "Order" o ON oi.order_id = o.order_id
        WHERE o.created_at >= $1 AND o.created_at <= $2
        GROUP BY p.product_id, p.name, c.name
      ),
      previous_sales AS (
        SELECT 
          p.name,
          SUM(oi.quantity) as prev_sales
        FROM "Product" p
        JOIN "OrderItem" oi ON p.product_id = oi.product_id
        JOIN "Order" o ON oi.order_id = o.order_id
        WHERE o.created_at >= $3 AND o.created_at < $1
        GROUP BY p.product_id, p.name
      )
      SELECT 
        cs.name,
        cs.category,
        cs.sales,
        cs.revenue,
        COALESCE(ps.prev_sales, 0) as prev_sales,
        CASE 
          WHEN COALESCE(ps.prev_sales, 0) > 0 
          THEN ROUND(((cs.sales - ps.prev_sales) / ps.prev_sales * 100)::numeric, 1)
          ELSE 0
        END as trend
      FROM current_sales cs
      LEFT JOIN previous_sales ps ON cs.name = ps.name
      ORDER BY cs.revenue DESC
      LIMIT 10;
    `;
    
    const prevStartDate = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    
    const result = await pool.query(productsQuery, [startDate, endDate, prevStartDate]);
    
    const topProducts = result.rows.map(row => ({
      name: row.name,
      sales: parseInt(row.sales),
      revenue: parseFloat(row.revenue),
      trend: parseFloat(row.trend),
      category: row.category
    }));
    
    res.json(topProducts);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get inventory data
export const getInventoryData = async (req, res) => {
  try {
    const inventoryQuery = `
      SELECT 
        w.name as warehouse,
        COUNT(CASE WHEN i.quantity_in_stock > i.reorder_level THEN 1 END) as inStock,
        COUNT(CASE WHEN i.quantity_in_stock <= i.reorder_level AND i.quantity_in_stock > 0 THEN 1 END) as lowStock,
        COUNT(CASE WHEN i.quantity_in_stock = 0 THEN 1 END) as outOfStock
      FROM "Warehouse" w
      LEFT JOIN "Inventory" i ON w.warehouse_id = i.warehouse_id
      GROUP BY w.warehouse_id, w.name
      ORDER BY w.name;
    `;
    
    const result = await pool.query(inventoryQuery);
    
    const inventoryData = result.rows.map(row => ({
      warehouse: row.warehouse,
      inStock: parseInt(row.instock) || 0,
      lowStock: parseInt(row.lowstock) || 0,
      outOfStock: parseInt(row.outofstock) || 0
    }));
    
    res.json(inventoryData);
  } catch (error) {
    console.error('Error fetching inventory data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get growth metrics data
export const getGrowthData = async (req, res) => {
  try {
    const growthQuery = `
      WITH monthly_data AS (
        SELECT 
          TO_CHAR(o.created_at, 'Mon') as month,
          EXTRACT(MONTH FROM o.created_at) as month_num,
          SUM(o.total_amount) as revenue
        FROM "Order" o
        WHERE o.created_at >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY EXTRACT(MONTH FROM o.created_at), TO_CHAR(o.created_at, 'Mon')
        ORDER BY EXTRACT(MONTH FROM o.created_at)
      ),
      growth_calc AS (
        SELECT 
          *,
          LAG(revenue) OVER (ORDER BY month_num) as prev_revenue,
          revenue * 1.15 as target  -- Assuming 15% growth target
        FROM monthly_data
      )
      SELECT 
        month,
        revenue,
        target,
        CASE 
          WHEN prev_revenue > 0 
          THEN ROUND(((revenue - prev_revenue) / prev_revenue * 100)::numeric, 1)
          ELSE 0
        END as growth
      FROM growth_calc
      ORDER BY month_num;
    `;
    
    const result = await pool.query(growthQuery);
    
    const growthData = result.rows.map(row => ({
      month: row.month,
      revenue: parseFloat(row.revenue),
      growth: parseFloat(row.growth),
      target: parseFloat(row.target)
    }));
    
    res.json(growthData);
  } catch (error) {
    console.error('Error fetching growth data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get monthly sales data
export const getMonthlySales = async (req, res) => {
  try {
    const salesQuery = `
      SELECT 
        TO_CHAR(o.created_at, 'Mon') as month,
        EXTRACT(MONTH FROM o.created_at) as month_num,
        SUM(o.total_amount) as sales,
        COUNT(DISTINCT o.order_id) as orders
      FROM "Order" o
      WHERE o.created_at >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY EXTRACT(MONTH FROM o.created_at), TO_CHAR(o.created_at, 'Mon')
      ORDER BY EXTRACT(MONTH FROM o.created_at);
    `;
    
    const result = await pool.query(salesQuery);
    
    const monthlySales = result.rows.map(row => ({
      month: row.month,
      sales: parseFloat(row.sales),
      orders: parseInt(row.orders)
    }));
    
    res.json(monthlySales);
  } catch (error) {
    console.error('Error fetching monthly sales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get order trends data
export const getOrderTrends = async (req, res) => {
  try {
    const trendsQuery = `
      SELECT 
        TO_CHAR(o.created_at, 'Dy') as day,
        EXTRACT(DOW FROM o.created_at) as day_num,
        COUNT(DISTINCT o.order_id) as orders,
        COUNT(CASE WHEN o.payment_status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN o.payment_status IN ('pending', 'processing') THEN 1 END) as pending
      FROM "Order" o
      WHERE o.created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY EXTRACT(DOW FROM o.created_at), TO_CHAR(o.created_at, 'Dy')
      ORDER BY EXTRACT(DOW FROM o.created_at);
    `;
    
    const result = await pool.query(trendsQuery);
    
    const orderTrends = result.rows.map(row => ({
      day: row.day,
      orders: parseInt(row.orders),
      completed: parseInt(row.completed),
      pending: parseInt(row.pending)
    }));
    
    res.json(orderTrends);
  } catch (error) {
    console.error('Error fetching order trends:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get comprehensive stats (all data at once)
export const getAllStats = async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    // Call all individual functions and aggregate results
    const [kpi, revenue, categories, delivery, tiers, topProducts, inventory, growth] = await Promise.all([
      getKpiDataInternal(timeRange),
      getRevenueDataInternal(timeRange),
      getCategoryDataInternal(timeRange),
      getDeliveryDataInternal(timeRange),
      getTierDataInternal(),
      getTopProductsInternal(timeRange),
      getInventoryDataInternal(),
      getGrowthDataInternal()
    ]);
    
    res.json({
      kpi,
      revenue,
      categories,
      delivery,
      tiers,
      topProducts,
      inventory,
      growth
    });
  } catch (error) {
    console.error('Error fetching all stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Internal helper functions (without res.json calls)
const getKpiDataInternal = async (timeRange) => {
  const { startDate, endDate } = getDateRange(timeRange);
  // ... (same logic as getKpiData but return data instead of sending response)
  // Implementation would be similar to getKpiData but return the data
};

const getRevenueDataInternal = async (timeRange) => {
  const { startDate, endDate } = getDateRange(timeRange);
  // ... (same logic as getRevenueData but return data)
};

// ... (similar internal functions for other data types)