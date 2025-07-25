// controllers/analyticsController.js
import pool from '../db.js';

// Get revenue and orders data for trend chart
export const getRevenueData = async (req, res) => {
    try {
        const { timeRange = '7d' } = req.query;

        let dateFilter = '';
        switch (timeRange) {
            case '7d':
                dateFilter = "AND o.order_date >= CURRENT_DATE - INTERVAL '7 days'";
                break;
            case '30d':
                dateFilter = "AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'";
                break;
            case '90d':
                dateFilter = "AND o.order_date >= CURRENT_DATE - INTERVAL '90 days'";
                break;
            default:
                dateFilter = "AND o.order_date >= CURRENT_DATE - INTERVAL '7 days'";
        }

        const query = `
      SELECT 
        DATE(o.order_date) as date,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COUNT(o.order_id) as orders,
        COUNT(DISTINCT o.user_id) as customers
      FROM "Order" o
      WHERE o.payment_status = 'completed' ${dateFilter}
      GROUP BY DATE(o.order_date)
      ORDER BY DATE(o.order_date)
    `;

        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching revenue data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get KPI metrics
export const getKPIMetrics = async (req, res) => {
    try {
        const { timeRange = '30d' } = req.query;

        let dateFilter = '';
        switch (timeRange) {
            case '7d':
                dateFilter = "AND order_date >= CURRENT_DATE - INTERVAL '7 days'";
                break;
            case '30d':
                dateFilter = "AND order_date >= CURRENT_DATE - INTERVAL '30 days'";
                break;
            case '90d':
                dateFilter = "AND order_date >= CURRENT_DATE - INTERVAL '90 days'";
                break;
            default:
                dateFilter = "AND order_date >= CURRENT_DATE - INTERVAL '30 days'";
        }

        // Get total revenue
        const revenueQuery = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as current_revenue,
        (
          SELECT COALESCE(SUM(total_amount), 0) 
          FROM "Order" 
          WHERE payment_status = 'completed' 
          AND order_date >= CURRENT_DATE - INTERVAL '60 days'
          AND order_date < CURRENT_DATE - INTERVAL '30 days'
        ) as previous_revenue
      FROM "Order" 
      WHERE payment_status = 'completed' ${dateFilter}
    `;

        // Get total orders
        const ordersQuery = `
      SELECT 
        COUNT(*) as current_orders,
        (
          SELECT COUNT(*) 
          FROM "Order" 
          WHERE order_date >= CURRENT_DATE - INTERVAL '60 days'
          AND order_date < CURRENT_DATE - INTERVAL '30 days'
        ) as previous_orders,
        (
          SELECT COUNT(*) 
          FROM "Order" 
          WHERE payment_status IN ('pending', 'processing')
        ) as active_orders
      FROM "Order" 
      WHERE ${dateFilter.replace('AND ', '')}
    `;

        // Get active customers
        const customersQuery = `
      SELECT 
        COUNT(DISTINCT user_id) as current_customers,
        (
          SELECT COUNT(DISTINCT user_id) 
          FROM "Order" 
          WHERE order_date >= CURRENT_DATE - INTERVAL '60 days'
          AND order_date < CURRENT_DATE - INTERVAL '30 days'
        ) as previous_customers,
        (
          SELECT COUNT(*) 
          FROM "User" 
          WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        ) as new_customers
      FROM "Order" 
      WHERE ${dateFilter.replace('AND ', '')}
    `;

        // Get average rating
        const ratingQuery = `
      SELECT 
        COALESCE(AVG(rating::numeric), 0) as avg_rating,
        COUNT(*) as total_reviews
      FROM "Review" 
      WHERE review_date >= CURRENT_DATE - INTERVAL '30 days'
    `;

        const [revenueResult, ordersResult, customersResult, ratingResult] = await Promise.all([
            pool.query(revenueQuery),
            pool.query(ordersQuery),
            pool.query(customersQuery),
            pool.query(ratingQuery)
        ]);

        const revenue = revenueResult.rows[0];
        const orders = ordersResult.rows[0];
        const customers = customersResult.rows[0];
        const rating = ratingResult.rows[0];

        const revenueChange = revenue.previous_revenue > 0
            ? ((revenue.current_revenue - revenue.previous_revenue) / revenue.previous_revenue * 100).toFixed(1)
            : 0;

        const ordersChange = orders.previous_orders > 0
            ? ((orders.current_orders - orders.previous_orders) / orders.previous_orders * 100).toFixed(1)
            : 0;

        const customersChange = customers.previous_customers > 0
            ? ((customers.current_customers - customers.previous_customers) / customers.previous_customers * 100).toFixed(1)
            : 0;

        res.json({
            revenue: {
                value: parseFloat(revenue.current_revenue),
                change: parseFloat(revenueChange)
            },
            orders: {
                value: parseInt(orders.current_orders),
                change: parseFloat(ordersChange),
                active: parseInt(orders.active_orders)
            },
            customers: {
                value: parseInt(customers.current_customers),
                change: parseFloat(customersChange),
                new: parseInt(customers.new_customers)
            },
            rating: {
                value: parseFloat(rating.avg_rating).toFixed(1),
                change: 2.1, // Static for now, would need historical data
                reviews: parseInt(rating.total_reviews)
            }
        });
    } catch (error) {
        console.error('Error fetching KPI metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get sales by category data
export const getCategoryData = async (req, res) => {
    try {
        const query = `
      SELECT 
        c.name,
        COUNT(oi.order_item_id) as order_count,
        SUM(oi.price * oi.quantity) as sales,
        ROUND(
          (SUM(oi.price * oi.quantity) * 100.0 / 
          (SELECT SUM(oi2.price * oi2.quantity) 
           FROM "OrderItem" oi2 
           JOIN "Order" o2 ON oi2.order_id = o2.order_id 
           WHERE o2.payment_status = 'completed')), 1
        ) as percentage
      FROM "Category" c
      JOIN "Product" p ON c.category_id = p.category_id
      JOIN "OrderItem" oi ON p.product_id = oi.product_id
      JOIN "Order" o ON oi.order_id = o.order_id
      WHERE o.payment_status = 'completed'
      GROUP BY c.category_id, c.name
      ORDER BY sales DESC
      LIMIT 5
    `;

        const result = await pool.query(query);

        const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

        const categoryData = result.rows.map((row, index) => ({
            name: row.name,
            value: parseFloat(row.percentage),
            sales: parseFloat(row.sales),
            color: colors[index] || '#6B7280'
        }));

        res.json(categoryData);
    } catch (error) {
        console.error('Error fetching category data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get delivery performance by region
export const getDeliveryPerformance = async (req, res) => {
    try {
        const query = `
      SELECT 
        dr.name as region,
        COUNT(dp.delivery_id) as total_deliveries,
        COUNT(CASE WHEN dp.delivered_on_time = true THEN 1 END) as on_time_deliveries,
        ROUND(
          COUNT(CASE WHEN dp.delivered_on_time = true THEN 1 END) * 100.0 / 
          NULLIF(COUNT(dp.delivery_id), 0), 0
        ) as on_time_percentage,
        COALESCE(AVG(dp.customer_rating), 0) as avg_rating
      FROM "DeliveryRegion" dr
      LEFT JOIN "DeliveryBoy" db ON dr.delivery_region_id = db.delivery_region_id
      LEFT JOIN "DeliveryPerformance" dp ON db.user_id = dp.delivery_boy_id
      GROUP BY dr.delivery_region_id, dr.name
      HAVING COUNT(dp.delivery_id) > 0
      ORDER BY on_time_percentage DESC
    `;

        const result = await pool.query(query);

        const deliveryData = result.rows.map(row => ({
            region: row.region,
            onTime: parseInt(row.on_time_percentage) || 0,
            late: 100 - (parseInt(row.on_time_percentage) || 0),
            avgRating: parseFloat(row.avg_rating).toFixed(1)
        }));

        res.json(deliveryData);
    } catch (error) {
        console.error('Error fetching delivery performance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get customer tier distribution
export const getCustomerTiers = async (req, res) => {
    try {
        const query = `
      SELECT 
        ut.name as tier,
        COUNT(u.user_id) as count,
        COALESCE(SUM(order_totals.total_amount), 0) as revenue
      FROM "UserTier" ut
      LEFT JOIN "User" u ON ut.tier_id = u.tier_id
      LEFT JOIN (
        SELECT 
          user_id,
          SUM(total_amount) as total_amount
        FROM "Order" 
        WHERE payment_status = 'completed'
        GROUP BY user_id
      ) order_totals ON order_totals.user_id = u.user_id
      GROUP BY ut.tier_id, ut.name, ut.min_points
      ORDER BY ut.min_points DESC
    `;

        const result = await pool.query(query);

        const colors = ['#8B5CF6', '#F59E0B', '#6B7280', '#92400E'];

        const tierData = result.rows.map((row, index) => ({
            tier: row.tier,
            count: parseInt(row.count),
            revenue: parseFloat(row.revenue),
            color: colors[index] || '#6B7280',
            angle: 90 - (index * 20)
        }));

        res.json(tierData);
    } catch (error) {
        console.error('Error fetching customer tiers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get top performing products
export const getTopProducts = async (req, res) => {
    try {
        const query = `
      WITH product_sales AS (
        SELECT 
          p.product_id,
          p.name,
          SUM(oi.quantity) as total_sales,
          SUM(oi.price * oi.quantity) as total_revenue,
          COUNT(DISTINCT o.order_id) as order_count
        FROM "Product" p
        JOIN "OrderItem" oi ON p.product_id = oi.product_id
        JOIN "Order" o ON oi.order_id = o.order_id
        WHERE o.payment_status = 'completed'
        AND o.order_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY p.product_id, p.name
      ),
      previous_sales AS (
        SELECT 
          p.product_id,
          SUM(oi.quantity) as prev_sales
        FROM "Product" p
        JOIN "OrderItem" oi ON p.product_id = oi.product_id
        JOIN "Order" o ON oi.order_id = o.order_id
        WHERE o.payment_status = 'completed'
        AND o.order_date >= CURRENT_DATE - INTERVAL '60 days'
        AND o.order_date < CURRENT_DATE - INTERVAL '30 days'
        GROUP BY p.product_id
      )
      SELECT 
        ps.name,
        ps.total_sales as sales,
        ps.total_revenue as revenue,
        COALESCE(
          ROUND(
            ((ps.total_sales - COALESCE(prev.prev_sales, 0)) * 100.0 / 
            NULLIF(COALESCE(prev.prev_sales, 1), 0)), 1
          ), 0
        ) as trend
      FROM product_sales ps
      LEFT JOIN previous_sales prev ON ps.product_id = prev.product_id
      ORDER BY ps.total_revenue DESC
      LIMIT 5
    `;

        const result = await pool.query(query);

        const topProducts = result.rows.map(row => ({
            name: row.name,
            sales: parseInt(row.sales),
            revenue: parseFloat(row.revenue),
            trend: parseFloat(row.trend)
        }));

        res.json(topProducts);
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get monthly growth analysis
export const getMonthlyGrowth = async (req, res) => {
    try {
        const query = `
      WITH monthly_data AS (
        SELECT 
          TO_CHAR(o.order_date, 'Mon') as month,
          EXTRACT(MONTH FROM o.order_date) as month_num,
          SUM(o.total_amount) as revenue,
          COUNT(o.order_id) as orders
        FROM "Order" o
        WHERE o.payment_status = 'completed'
        AND o.order_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY EXTRACT(MONTH FROM o.order_date), TO_CHAR(o.order_date, 'Mon')
        ORDER BY month_num
      ),
      growth_calc AS (
        SELECT 
          *,
          LAG(revenue) OVER (ORDER BY month_num) as prev_revenue
        FROM monthly_data
      )
      SELECT 
        month,
        revenue,
        orders,
        COALESCE(
          ROUND(
            ((revenue - prev_revenue) * 100.0 / NULLIF(prev_revenue, 0)), 1
          ), 0
        ) as growth
      FROM growth_calc
      ORDER BY month_num
    `;

        const result = await pool.query(query);

        const monthlyGrowth = result.rows.map(row => ({
            month: row.month,
            revenue: parseFloat(row.revenue),
            orders: parseInt(row.orders),
            growth: parseFloat(row.growth)
        }));

        res.json(monthlyGrowth);
    } catch (error) {
        console.error('Error fetching monthly growth:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get inventory status by warehouse
export const getInventoryStatus = async (req, res) => {
    try {
        const query = `
      SELECT 
        w.name as warehouse,
        COUNT(CASE WHEN i.quantity_in_stock > i.reorder_level THEN 1 END) as in_stock,
        COUNT(CASE WHEN i.quantity_in_stock <= i.reorder_level AND i.quantity_in_stock > 0 THEN 1 END) as low_stock,
        COUNT(CASE WHEN i.quantity_in_stock = 0 THEN 1 END) as out_of_stock
      FROM "Warehouse" w
      LEFT JOIN "Inventory" i ON w.warehouse_id = i.warehouse_id
      GROUP BY w.warehouse_id, w.name
      ORDER BY w.name
    `;

        const result = await pool.query(query);

        const inventoryData = result.rows.map(row => ({
            warehouse: row.warehouse,
            inStock: parseInt(row.in_stock) || 0,
            lowStock: parseInt(row.low_stock) || 0,
            outOfStock: parseInt(row.out_of_stock) || 0
        }));

        res.json(inventoryData);
    } catch (error) {
        console.error('Error fetching inventory status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get comprehensive dashboard data (all endpoints combined)
export const getDashboardData = async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        // Create a mock response object that captures the data
        const createMockRes = () => {
            let responseData = null;
            return {
                status: () => ({
                    json: (data) => {
                        responseData = data;
                        return responseData;
                    }
                }),
                json: (data) => {
                    responseData = data;
                    return responseData;
                },
                getData: () => responseData
            };
        };

        // Execute all queries in parallel for better performance
        const mockResponses = Array.from({ length: 8 }, () => createMockRes());

        await Promise.all([
            getKPIMetrics({ query: { period } }, mockResponses[0]),
            getRevenueData({ query: { timeRange: period } }, mockResponses[1]),
            getCategoryData({ query: {} }, mockResponses[2]),
            getDeliveryPerformance({ query: {} }, mockResponses[3]),
            getCustomerTiers({ query: {} }, mockResponses[4]),
            getTopProducts({ query: {} }, mockResponses[5]),
            getMonthlyGrowth({ query: {} }, mockResponses[6]),
            getInventoryStatus({ query: {} }, mockResponses[7])
        ]);

        // Extract data from mock responses
        const [
            kpiMetrics,
            trendData,
            categoryData,
            deliveryData,
            tierData,
            topProducts,
            monthlyGrowth,
            inventoryData
        ] = mockResponses.map(mockRes => mockRes.getData());

        res.status(200).json({
            success: true,
            data: {
                kpiMetrics: kpiMetrics || {},
                revenueOrdersTrend: trendData || [],
                salesByCategory: categoryData || [],
                deliveryPerformance: deliveryData || [],
                customerTiers: tierData || [],
                topProducts: topProducts || [],
                monthlyGrowth: monthlyGrowth || [],
                inventoryStatus: inventoryData || []
            }
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};