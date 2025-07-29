import pool from '../db.js';

// Get assigned deliveries for a delivery boy
export const getAssignedDeliveries = async (req, res) => {
  const client = await pool.connect();

  try {
    const { delivery_boy_id } = req.params;

    // Validate delivery_boy_id
    if (!delivery_boy_id) {
      return res.status(400).json({
        success: false,
        message: 'delivery_boy_id is required'
      });
    }

    const query = `
      SELECT 
        d.delivery_id,
        d.order_id,
        d.estimated_arrival,
        d.actual_arrival,
        d.is_aborted,
        o.total_amount,
        o.payment_status,
        o.order_date,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        a.address,
        STRING_AGG(
          CONCAT(oi.quantity, 'x ', p.name), 
          ', ' ORDER BY oi.order_item_id
        ) as items,
        COALESCE(sh.status, 'assigned') as current_status,
        CASE 
          WHEN d.actual_arrival IS NOT NULL THEN 'completed'
          WHEN d.is_aborted = true THEN 'cancelled'
          WHEN d.estimated_arrival IS NOT NULL AND d.estimated_arrival < NOW() THEN 'overdue'
          ELSE 'pending'
        END as status,
        CASE 
          WHEN d.estimated_arrival IS NOT NULL AND d.estimated_arrival < NOW() + INTERVAL '30 minutes' THEN 'high'
          WHEN d.estimated_arrival IS NOT NULL AND d.estimated_arrival < NOW() + INTERVAL '1 hour' THEN 'medium'
          ELSE 'low'
        END as priority
      FROM "Delivery" d
      JOIN "Order" o ON d.order_id = o.order_id
      JOIN "User" u ON o.user_id = u.user_id
      JOIN "Address" a ON d.address_id = a.address_id
      JOIN "OrderItem" oi ON o.order_id = oi.order_id
      JOIN "Product" p ON oi.product_id = p.product_id
      LEFT JOIN LATERAL (
        SELECT status 
        FROM "StatusHistory" 
        WHERE entity_type = 'order' AND entity_id = o.order_id 
        ORDER BY updated_at DESC LIMIT 1
      ) sh ON true
      LEFT JOIN "DeliveryReview" dr ON d.delivery_id = dr.delivery_id AND d.delivery_boy_id = dr.delivery_boy_id
      WHERE d.delivery_boy_id = $1
        AND (d.actual_arrival IS NULL OR d.actual_arrival IS NOT NULL)
        AND (d.is_aborted IS NULL OR d.is_aborted = false)
        AND dr.review_id IS NULL
      GROUP BY 
        d.delivery_id, d.order_id, d.estimated_arrival, d.actual_arrival, 
        d.is_aborted, o.total_amount, o.payment_status, o.order_date,
        u.first_name, u.last_name, u.email, u.phone_number, a.address, sh.status
      ORDER BY 
        CASE 
          WHEN d.estimated_arrival IS NOT NULL THEN d.estimated_arrival 
          ELSE NOW() + INTERVAL '1 year' 
        END ASC;
    `;

    const result = await client.query(query, [delivery_boy_id]);

    const deliveries = result.rows.map(row => ({
      id: `ORD-${row.order_id.toString().padStart(3, '0')}`,
      delivery_id: row.delivery_id,
      order_id: row.order_id,
      customerName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      customerEmail: row.email,
      customerPhone: row.phone_number,
      address: row.address,
      items: row.items ? row.items.split(', ') : [],
      estimatedTime: row.estimated_arrival ?
        new Date(row.estimated_arrival).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        }) : 'TBD',
      estimatedDateTime: row.estimated_arrival,
      totalAmount: parseFloat(row.total_amount),
      paymentStatus: row.payment_status,
      orderDate: row.order_date,
      status: row.status,
      currentStatus: row.current_status,
      priority: row.priority
    }));

    res.status(200).json({
      success: true,
      data: deliveries,
      count: deliveries.length
    });

  } catch (error) {
    console.error('Error fetching assigned deliveries:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned deliveries',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Modified getAssignedDeliveries to support date filtering
export const getAssignedDeliveriesForDashboard = async (req, res) => {
  const client = await pool.connect();
  try {
    const { delivery_boy_id } = req.params;
    const { date, status } = req.query; // Add query parameters

    let dateFilter = '';
    let statusFilter = '';

    if (date) {
      dateFilter = `AND DATE(d.estimated_arrival) = $2`;
    }

    if (status) {
      statusFilter = `AND CASE
        WHEN d.actual_arrival IS NOT NULL THEN 'completed'
        WHEN d.is_aborted = true THEN 'cancelled'
        WHEN d.estimated_arrival < NOW() THEN 'overdue'
        ELSE 'pending'
      END = $${date ? 3 : 2}`;
    }

    const query = `
      SELECT
        d.delivery_id,
        d.order_id,
        d.estimated_arrival,
        d.actual_arrival,
        d.is_aborted,
        o.total_amount,
        o.payment_status,
        o.order_date,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        a.address,
        STRING_AGG(
          CONCAT(oi.quantity, 'x ', p.name),
          ', ' ORDER BY oi.order_item_id
        ) as items,
        CASE
          WHEN d.actual_arrival IS NOT NULL THEN 'completed'
          WHEN d.is_aborted = true THEN 'cancelled'
          WHEN d.estimated_arrival < NOW() THEN 'overdue'
          ELSE 'pending'
        END as status,
        CASE
          WHEN d.estimated_arrival < NOW() + INTERVAL '30 minutes' THEN 'high'
          WHEN d.estimated_arrival < NOW() + INTERVAL '1 hour' THEN 'medium'
          ELSE 'low'
        END as priority
      FROM "Delivery" d
      JOIN "Order" o ON d.order_id = o.order_id
      JOIN "User" u ON o.user_id = u.user_id
      JOIN "Address" a ON d.address_id = a.address_id
      JOIN "OrderItem" oi ON o.order_id = oi.order_id
      JOIN "Product" p ON oi.product_id = p.product_id
      WHERE d.delivery_boy_id = $1
      ${dateFilter}
      ${statusFilter}
      GROUP BY
        d.delivery_id, d.order_id, d.estimated_arrival, d.actual_arrival,
        d.is_aborted, o.total_amount, o.payment_status, o.order_date,
        u.first_name, u.last_name, u.email, u.phone_number, a.address
      ORDER BY d.estimated_arrival ASC;
    `;

    const params = [delivery_boy_id];
    if (date) params.push(date);
    if (status) params.push(status);

    const result = await client.query(query, params);

    // ... rest of the existing code
  } catch (error) {
    // ... error handling
  } finally {
    client.release();
  }
};


// Mark delivery as completed
export const markDeliveryCompleted = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { delivery_id } = req.params;
    const { delivery_boy_id, customer_rating, feedback } = req.body;

    // Update delivery status
    const updateDeliveryQuery = `
      UPDATE "Delivery"
      SET actual_arrival = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE delivery_id = $1 AND delivery_boy_id = $2
      RETURNING order_id;
    `;

    const deliveryResult = await client.query(updateDeliveryQuery, [delivery_id, delivery_boy_id]);

    if (deliveryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Delivery not found or not assigned to this delivery boy'
      });
    }

    const order_id = deliveryResult.rows[0].order_id;

    // Update order status using consolidated StatusHistory table
    const updateOrderStatusQuery = `
      INSERT INTO "StatusHistory" (entity_type, entity_id, status, updated_at, updated_by)
      VALUES ('order', $1, 'delivery_completed', CURRENT_TIMESTAMP, $2);
    `;

    await client.query(updateOrderStatusQuery, [order_id, delivery_boy_id]);

    // Record delivery performance
    const performanceQuery = `
      INSERT INTO "DeliveryPerformance" 
      (delivery_boy_id, delivery_id, delivered_on_time, customer_rating, feedback)
      VALUES ($1, $2, $3, $4, $5);
    `;

    const deliveryTime = new Date();
    const estimatedQuery = `SELECT estimated_arrival FROM "Delivery" WHERE delivery_id = $1`;
    const estimatedResult = await client.query(estimatedQuery, [delivery_id]);
    const onTime = estimatedResult.rows.length > 0 &&
      deliveryTime <= new Date(estimatedResult.rows[0].estimated_arrival);

    await client.query(performanceQuery, [
      delivery_boy_id,
      delivery_id,
      onTime,
      customer_rating || null,
      feedback || null
    ]);

    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: 'Delivery marked as completed successfully'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error marking delivery as completed:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking delivery as completed',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Report delivery issue
export const reportDeliveryIssue = async (req, res) => {
  const client = await pool.connect();

  try {
    const { delivery_id } = req.params;
    const { delivery_boy_id, issue_type, description } = req.body;

    // Update delivery as aborted
    const updateQuery = `
      UPDATE "Delivery"
      SET is_aborted = true,
          updated_at = CURRENT_TIMESTAMP
      WHERE delivery_id = $1 AND delivery_boy_id = $2
      RETURNING order_id;
    `;

    const result = await client.query(updateQuery, [delivery_id, delivery_boy_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found or not assigned to this delivery boy'
      });
    }

    const order_id = result.rows[0].order_id;

    // Update order status using consolidated StatusHistory table
    const statusQuery = `
      INSERT INTO "StatusHistory" (entity_type, entity_id, status, updated_at, updated_by)
      VALUES ('order', $1, 'delivery_failed', CURRENT_TIMESTAMP, $2);
    `;

    await client.query(statusQuery, [order_id, delivery_boy_id]);

    res.status(200).json({
      success: true,
      message: 'Delivery issue reported successfully'
    });

  } catch (error) {
    console.error('Error reporting delivery issue:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting delivery issue',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get delivery boy profile
export const getDeliveryBoyProfile = async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id } = req.params;

    const query = `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        db.availability_status,
        db.current_load,
        db.joined_date,
        dr.name as delivery_region,
        COUNT(d.delivery_id) as total_deliveries,
        AVG(dp.customer_rating) as average_rating
      FROM "User" u
      JOIN "DeliveryBoy" db ON u.user_id = db.user_id
      JOIN "DeliveryRegion" dr ON db.delivery_region_id = dr.delivery_region_id
      LEFT JOIN "Delivery" d ON db.user_id = d.delivery_boy_id
      LEFT JOIN "DeliveryPerformance" dp ON db.user_id = dp.delivery_boy_id
      WHERE u.user_id = $1
      GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.phone_number,
               db.availability_status, db.current_load, db.joined_date, dr.name;
    `;

    const result = await client.query(query, [user_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery boy not found'
      });
    }

    const profile = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        user_id: profile.user_id,
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        phone: profile.phone_number,
        availability_status: profile.availability_status,
        current_load: profile.current_load,
        joined_date: profile.joined_date,
        delivery_region: profile.delivery_region,
        total_deliveries: parseInt(profile.total_deliveries) || 0,
        average_rating: parseFloat(profile.average_rating) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching delivery boy profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery boy profile',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get delivery boy statistics
export const getDeliveryBoyStats = async (req, res) => {
  try {
    const { user_id } = req.params; // Get delivery boy ID from params
    
    const query = `
      SELECT
        COUNT(d.delivery_id) AS total_deliveries,
        ROUND(100.0 * SUM(CASE WHEN d.actual_arrival <= d.estimated_arrival THEN 1 ELSE 0 END) / NULLIF(COUNT(d.delivery_id), 0), 1) AS on_time_rate,
        SUM(CASE WHEN d.actual_arrival::date = CURRENT_DATE THEN 1 ELSE 0 END) AS completed_today,
        ROUND(AVG(dp.customer_rating), 1) AS customer_rating
      FROM "Delivery" d
      LEFT JOIN "DeliveryPerformance" dp ON d.delivery_id = dp.delivery_id
      WHERE d.delivery_boy_id = $1 
        AND d.actual_arrival IS NOT NULL;
    `;

    const result = await pool.query(query, [user_id]);

    const stats = result.rows[0];
    console.log('Parsed stats:', stats);
    res.status(200).json({
      success: true,
      data: {
        totalDeliveries: parseInt(stats.total_deliveries) || 0,
        onTimeRate: parseFloat(stats.on_time_rate) || 0.0,
        completedToday: parseInt(stats.completed_today) || 0,
        customerRating: parseFloat(stats.customer_rating) || 0.0,
      }
    });
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery statistics',
      error: error.message
    });
  }
};


// Get detailed delivery performance metrics
export const getDeliveryPerformanceMetrics = async (req, res) => {
  const client = await pool.connect();

  try {
    const { delivery_boy_id } = req.params;
    const { period = 'week' } = req.query; // week, month, year

    let dateFilter = '';
    switch (period) {
      case 'week':
        dateFilter = "AND d.actual_arrival >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND d.actual_arrival >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'year':
        dateFilter = "AND d.actual_arrival >= CURRENT_DATE - INTERVAL '365 days'";
        break;
      default:
        dateFilter = "AND d.actual_arrival >= CURRENT_DATE - INTERVAL '7 days'";
    }

    const performanceQuery = `
      SELECT 
        DATE(d.actual_arrival) as delivery_date,
        COUNT(*) as deliveries_count,
        SUM(CASE WHEN dp.delivered_on_time = true THEN 1 ELSE 0 END) as on_time_count,
        AVG(dp.customer_rating) as avg_rating,
        SUM(CASE WHEN d.actual_arrival <= d.estimated_arrival THEN 1 ELSE 0 END) as early_on_time_count
      FROM "Delivery" d
      LEFT JOIN "DeliveryPerformance" dp ON d.delivery_id = dp.delivery_id
      WHERE d.delivery_boy_id = $1 
        AND d.actual_arrival IS NOT NULL
        ${dateFilter}
      GROUP BY DATE(d.actual_arrival)
      ORDER BY delivery_date DESC;
    `;

    const result = await client.query(performanceQuery, [delivery_boy_id]);

    const metrics = result.rows.map(row => ({
      date: row.delivery_date,
      deliveriesCount: parseInt(row.deliveries_count),
      onTimeCount: parseInt(row.on_time_count) || 0,
      onTimeRate: row.deliveries_count > 0
        ? ((parseInt(row.on_time_count) / parseInt(row.deliveries_count)) * 100).toFixed(1)
        : 0,
      averageRating: row.avg_rating ? parseFloat(row.avg_rating).toFixed(1) : 0,
      earlyOnTimeCount: parseInt(row.early_on_time_count) || 0
    }));

    res.status(200).json({
      success: true,
      data: {
        period,
        metrics
      }
    });

  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching performance metrics',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get recent delivery reviews
export const getDeliveryReviews = async (req, res) => {
  const client = await pool.connect();

  try {
    const { delivery_boy_id } = req.params;
    const { limit = 10 } = req.query;

    const reviewsQuery = `
      SELECT 
        dr.review_id,
        dr.rating,
        dr.comment,
        dr.review_date,
        dr.was_customer_available,
        dr.behavior,
        u.first_name,
        u.last_name,
        o.order_id,
        o.total_amount
      FROM "DeliveryReview" dr
      JOIN "User" u ON dr.customer_id = u.user_id
      JOIN "Delivery" d ON dr.delivery_id = d.delivery_id
      JOIN "Order" o ON d.order_id = o.order_id
      WHERE dr.delivery_boy_id = $1
      ORDER BY dr.review_date DESC
      LIMIT $2;
    `;

    const result = await client.query(reviewsQuery, [delivery_boy_id, limit]);

    const reviews = result.rows.map(row => ({
      reviewId: row.review_id,
      rating: row.rating,
      comment: row.comment,
      reviewDate: row.review_date,
      customerName: `${row.first_name} ${row.last_name}`,
      orderId: `ORD-${row.order_id.toString().padStart(3, '0')}`,
      orderAmount: parseFloat(row.total_amount),
      wasCustomerAvailable: row.was_customer_available,
      behavior: row.behavior
    }));

    res.status(200).json({
      success: true,
      data: reviews
    });

  } catch (error) {
    console.error('Error fetching delivery reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery reviews',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get delivery boy earnings
export const getDeliveryBoyEarnings = async (req, res) => {
  const client = await pool.connect();

  try {
    const { delivery_boy_id } = req.params;
    const { period = 'month' } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = "AND DATE(d.actual_arrival) = CURRENT_DATE";
        break;
      case 'week':
        dateFilter = "AND d.actual_arrival >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'month':
        dateFilter = "AND d.actual_arrival >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      default:
        dateFilter = "AND d.actual_arrival >= CURRENT_DATE - INTERVAL '30 days'";
    }

    // Assuming delivery boys earn a percentage of delivery fees
    // You can adjust this based on your business model
    const earningsQuery = `
      SELECT 
        COUNT(*) as total_deliveries,
        SUM(o.shipping_total * 0.15) as estimated_earnings,
        AVG(o.shipping_total * 0.15) as avg_earning_per_delivery
      FROM "Delivery" d
      JOIN "Order" o ON d.order_id = o.order_id
      WHERE d.delivery_boy_id = $1 
        AND d.actual_arrival IS NOT NULL
        ${dateFilter};
    `;

    const result = await client.query(earningsQuery, [delivery_boy_id]);
    const earnings = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        period,
        totalDeliveries: parseInt(earnings.total_deliveries) || 0,
        estimatedEarnings: parseFloat(earnings.estimated_earnings) || 0,
        averageEarningPerDelivery: parseFloat(earnings.avg_earning_per_delivery) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching delivery boy earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching earnings data',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get dashboard summary for delivery boy
export const getDeliveryDashboardSummary = async (req, res) => {
  const client = await pool.connect();
  try {
    const { delivery_boy_id } = req.params;

    // Get today's scheduled deliveries
    const todayScheduledQuery = `
      SELECT COUNT(*) as scheduled_today
      FROM "Delivery" d
      WHERE d.delivery_boy_id = $1
      AND DATE(d.estimated_arrival) = CURRENT_DATE
      AND d.actual_arrival IS NULL
      AND d.is_aborted = false;
    `;

    // Get tomorrow's scheduled deliveries
    const tomorrowScheduledQuery = `
      SELECT COUNT(*) as scheduled_tomorrow
      FROM "Delivery" d
      WHERE d.delivery_boy_id = $1
      AND DATE(d.estimated_arrival) = CURRENT_DATE + INTERVAL '1 day'
      AND d.actual_arrival IS NULL
      AND d.is_aborted = false;
    `;

    // Get pending deliveries
    const pendingQuery = `
      SELECT COUNT(*) as pending_deliveries
      FROM "Delivery" d
      WHERE d.delivery_boy_id = $1
      AND d.actual_arrival IS NULL
      AND d.is_aborted = false
      AND d.estimated_arrival < NOW();
    `;

    // Get completed today
    const completedTodayQuery = `
      SELECT COUNT(*) as completed_today
      FROM "Delivery" d
      WHERE d.delivery_boy_id = $1
      AND DATE(d.actual_arrival) = CURRENT_DATE;
    `;

    const [todayResult, tomorrowResult, pendingResult, completedResult] = await Promise.all([
      client.query(todayScheduledQuery, [delivery_boy_id]),
      client.query(tomorrowScheduledQuery, [delivery_boy_id]),
      client.query(pendingQuery, [delivery_boy_id]),
      client.query(completedTodayQuery, [delivery_boy_id])
    ]);

    res.status(200).json({
      success: true,
      data: {
        scheduledToday: parseInt(todayResult.rows[0].scheduled_today) || 0,
        scheduledTomorrow: parseInt(tomorrowResult.rows[0].scheduled_tomorrow) || 0,
        pendingDeliveries: parseInt(pendingResult.rows[0].pending_deliveries) || 0,
        completedToday: parseInt(completedResult.rows[0].completed_today) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard summary',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get delivery schedule by date range
export const getDeliverySchedule = async (req, res) => {
  const client = await pool.connect();
  try {
    const { delivery_boy_id } = req.params;
    const { start_date, end_date } = req.query;

    const scheduleQuery = `
      SELECT
        DATE(d.estimated_arrival) as delivery_date,
        COUNT(*) as total_deliveries,
        SUM(CASE WHEN d.actual_arrival IS NOT NULL THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN d.is_aborted = true THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN d.actual_arrival IS NULL AND d.is_aborted = false THEN 1 ELSE 0 END) as pending
      FROM "Delivery" d
      WHERE d.delivery_boy_id = $1
      AND DATE(d.estimated_arrival) BETWEEN $2 AND $3
      GROUP BY DATE(d.estimated_arrival)
      ORDER BY delivery_date ASC;
    `;

    const result = await client.query(scheduleQuery, [
      delivery_boy_id,
      start_date || new Date().toISOString().split('T')[0],
      end_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ]);

    const schedule = result.rows.map(row => ({
      date: row.delivery_date,
      totalDeliveries: parseInt(row.total_deliveries),
      completed: parseInt(row.completed),
      cancelled: parseInt(row.cancelled),
      pending: parseInt(row.pending)
    }));

    res.status(200).json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error('Error fetching delivery schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery schedule',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Search deliveries with filters
export const searchDeliveries = async (req, res) => {
  const client = await pool.connect();
  try {
    const { delivery_boy_id } = req.params;
    const {
      search_term,
      status,
      priority,
      date_from,
      date_to,
      limit = 20,
      offset = 0
    } = req.query;

    let whereConditions = ['d.delivery_boy_id = $1'];
    let queryParams = [delivery_boy_id];
    let paramCount = 1;

    if (search_term) {
      paramCount++;
      whereConditions.push(`(
        u.first_name ILIKE $${paramCount} OR 
        u.last_name ILIKE $${paramCount} OR 
        u.email ILIKE $${paramCount} OR 
        a.address ILIKE $${paramCount} OR
        o.order_id::text ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search_term}%`);
    }

    if (status) {
      whereConditions.push(`CASE
        WHEN d.actual_arrival IS NOT NULL THEN 'completed'
        WHEN d.is_aborted = true THEN 'cancelled'
        WHEN d.estimated_arrival < NOW() THEN 'overdue'
        ELSE 'pending'
      END = $${++paramCount}`);
      queryParams.push(status);
    }

    if (date_from) {
      whereConditions.push(`DATE(d.estimated_arrival) >= $${++paramCount}`);
      queryParams.push(date_from);
    }

    if (date_to) {
      whereConditions.push(`DATE(d.estimated_arrival) <= $${++paramCount}`);
      queryParams.push(date_to);
    }

    const searchQuery = `
      SELECT
        d.delivery_id,
        d.order_id,
        d.estimated_arrival,
        d.actual_arrival,
        d.is_aborted,
        o.total_amount,
        o.payment_status,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        a.address,
        STRING_AGG(
          CONCAT(oi.quantity, 'x ', p.name),
          ', ' ORDER BY oi.order_item_id
        ) as items,
        CASE
          WHEN d.actual_arrival IS NOT NULL THEN 'completed'
          WHEN d.is_aborted = true THEN 'cancelled'
          WHEN d.estimated_arrival < NOW() THEN 'overdue'
          ELSE 'pending'
        END as status,
        CASE
          WHEN d.estimated_arrival < NOW() + INTERVAL '30 minutes' THEN 'high'
          WHEN d.estimated_arrival < NOW() + INTERVAL '1 hour' THEN 'medium'
          ELSE 'low'
        END as priority
      FROM "Delivery" d
      JOIN "Order" o ON d.order_id = o.order_id
      JOIN "User" u ON o.user_id = u.user_id
      JOIN "Address" a ON d.address_id = a.address_id
      JOIN "OrderItem" oi ON o.order_id = oi.order_id
      JOIN "Product" p ON oi.product_id = p.product_id
      WHERE ${whereConditions.join(' AND ')}
      GROUP BY
        d.delivery_id, d.order_id, d.estimated_arrival, d.actual_arrival,
        d.is_aborted, o.total_amount, o.payment_status,
        u.first_name, u.last_name, u.email, u.phone_number, a.address
      ORDER BY d.estimated_arrival ASC
      LIMIT $${++paramCount} OFFSET $${++paramCount};
    `;

    queryParams.push(limit, offset);

    const result = await client.query(searchQuery, queryParams);

    // Format results similar to getAssignedDeliveries
    const deliveries = result.rows.map(row => ({
      id: `ORD-${row.order_id.toString().padStart(3, '0')}`,
      delivery_id: row.delivery_id,
      order_id: row.order_id,
      customerName: `${row.first_name} ${row.last_name}`,
      customerEmail: row.email,
      customerPhone: row.phone_number,
      address: row.address,
      items: row.items ? row.items.split(', ') : [],
      estimatedTime: new Date(row.estimated_arrival).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      estimatedDateTime: row.estimated_arrival,
      totalAmount: parseFloat(row.total_amount),
      paymentStatus: row.payment_status,
      status: row.status,
      priority: row.priority
    }));

    res.status(200).json({
      success: true,
      data: deliveries,
      count: deliveries.length
    });

  } catch (error) {
    console.error('Error searching deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching deliveries',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get weekly performance data for delivery boy
export const getWeeklyPerformance = async (req, res) => {
  const client = await pool.connect();
  try {
    const { delivery_boy_id } = req.params;

    const weeklyPerformanceQuery = `
      WITH date_series AS (
        SELECT 
          generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            INTERVAL '1 day'
          )::date as date
      ),
      daily_deliveries AS (
        SELECT
          DATE(d.actual_arrival) as delivery_date,
          COUNT(*) as deliveries_count,
          AVG(dp.customer_rating) as avg_rating
        FROM "Delivery" d
        LEFT JOIN "DeliveryPerformance" dp ON d.delivery_id = dp.delivery_id
        WHERE d.delivery_boy_id = $1
        AND d.actual_arrival IS NOT NULL
        AND DATE(d.actual_arrival) >= CURRENT_DATE - INTERVAL '6 days'
        GROUP BY DATE(d.actual_arrival)
      )
      SELECT
        ds.date,
        TO_CHAR(ds.date, 'Dy') as day_name,
        COALESCE(dd.deliveries_count, 0) as deliveries,
        COALESCE(dd.avg_rating, 0) as rating
      FROM date_series ds
      LEFT JOIN daily_deliveries dd ON ds.date = dd.delivery_date
      ORDER BY ds.date;
    `;

    const result = await client.query(weeklyPerformanceQuery, [delivery_boy_id]);

    const performanceData = result.rows.map(row => ({
      name: row.day_name,
      date: row.date,
      deliveries: parseInt(row.deliveries),
      rating: parseFloat(row.rating).toFixed(1)
    }));

    // Calculate totals
    const totalDeliveries = performanceData.reduce((sum, day) => sum + day.deliveries, 0);
    const avgRating = performanceData.length > 0
      ? (performanceData.reduce((sum, day) => sum + parseFloat(day.rating), 0) / performanceData.filter(day => day.rating > 0).length).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        weeklyData: performanceData,
        totalWeeklyDeliveries: totalDeliveries,
        averageWeeklyRating: parseFloat(avgRating) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching weekly performance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly performance data',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get performance data for different time periods
export const getPerformanceByPeriod = async (req, res) => {
  const client = await pool.connect();
  try {
    const { delivery_boy_id } = req.params;
    const { period = 'week' } = req.query; // week, month, quarter

    let dateInterval = '';
    let dateFormat = '';
    let groupBy = '';

    switch (period) {
      case 'week':
        dateInterval = "INTERVAL '6 days'";
        dateFormat = 'Dy';
        groupBy = 'DATE(d.actual_arrival)';
        break;
      case 'month':
        dateInterval = "INTERVAL '29 days'";
        dateFormat = 'DD';
        groupBy = 'DATE(d.actual_arrival)';
        break;
      case 'quarter':
        dateInterval = "INTERVAL '89 days'";
        dateFormat = 'Mon DD';
        groupBy = 'DATE_TRUNC(\'week\', d.actual_arrival)';
        break;
      default:
        dateInterval = "INTERVAL '6 days'";
        dateFormat = 'Dy';
        groupBy = 'DATE(d.actual_arrival)';
    }

    const performanceQuery = `
      SELECT
        ${groupBy} as period_date,
        TO_CHAR(${groupBy}, '${dateFormat}') as period_name,
        COUNT(*) as deliveries_count,
        AVG(dp.customer_rating) as avg_rating,
        SUM(CASE WHEN dp.delivered_on_time = true THEN 1 ELSE 0 END) as on_time_count
      FROM "Delivery" d
      LEFT JOIN "DeliveryPerformance" dp ON d.delivery_id = dp.delivery_id
      WHERE d.delivery_boy_id = $1
      AND d.actual_arrival IS NOT NULL
      AND d.actual_arrival >= CURRENT_DATE - ${dateInterval}
      GROUP BY ${groupBy}
      ORDER BY period_date;
    `;

    const result = await client.query(performanceQuery, [delivery_boy_id]);

    const performanceData = result.rows.map(row => ({
      name: row.period_name,
      date: row.period_date,
      deliveries: parseInt(row.deliveries_count),
      rating: parseFloat(row.avg_rating || 0).toFixed(1),
      onTimeRate: row.deliveries_count > 0
        ? ((parseInt(row.on_time_count) / parseInt(row.deliveries_count)) * 100).toFixed(1)
        : 0
    }));

    // Calculate summary statistics
    const totalDeliveries = performanceData.reduce((sum, item) => sum + item.deliveries, 0);
    const avgRating = performanceData.length > 0
      ? (performanceData.reduce((sum, item) => sum + parseFloat(item.rating), 0) / performanceData.filter(item => item.rating > 0).length).toFixed(1)
      : 0;
    const avgOnTimeRate = performanceData.length > 0
      ? (performanceData.reduce((sum, item) => sum + parseFloat(item.onTimeRate), 0) / performanceData.length).toFixed(1)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        period,
        performanceData,
        summary: {
          totalDeliveries,
          averageRating: parseFloat(avgRating) || 0,
          averageOnTimeRate: parseFloat(avgOnTimeRate) || 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching performance by period:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching performance data',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get real-time performance metrics
export const getRealTimePerformanceMetrics = async (req, res) => {
  const client = await pool.connect();
  try {
    const { delivery_boy_id } = req.params;

    // Today's performance
    const todayQuery = `
      SELECT
        COUNT(*) as today_deliveries,
        AVG(dp.customer_rating) as today_rating,
        SUM(CASE WHEN dp.delivered_on_time = true THEN 1 ELSE 0 END) as today_on_time
      FROM "Delivery" d
      LEFT JOIN "DeliveryPerformance" dp ON d.delivery_id = dp.delivery_id
      WHERE d.delivery_boy_id = $1
      AND d.actual_arrival IS NOT NULL
      AND DATE(d.actual_arrival) = CURRENT_DATE;
    `;

    // This week's performance
    const weekQuery = `
      SELECT
        COUNT(*) as week_deliveries,
        AVG(dp.customer_rating) as week_rating,
        SUM(CASE WHEN dp.delivered_on_time = true THEN 1 ELSE 0 END) as week_on_time
      FROM "Delivery" d
      LEFT JOIN "DeliveryPerformance" dp ON d.delivery_id = dp.delivery_id
      WHERE d.delivery_boy_id = $1
      AND d.actual_arrival IS NOT NULL
      AND d.actual_arrival >= DATE_TRUNC('week', CURRENT_DATE);
    `;

    // This month's performance
    const monthQuery = `
      SELECT
        COUNT(*) as month_deliveries,
        AVG(dp.customer_rating) as month_rating,
        SUM(CASE WHEN dp.delivered_on_time = true THEN 1 ELSE 0 END) as month_on_time
      FROM "Delivery" d
      LEFT JOIN "DeliveryPerformance" dp ON d.delivery_id = dp.delivery_id
      WHERE d.delivery_boy_id = $1
      AND d.actual_arrival IS NOT NULL
      AND d.actual_arrival >= DATE_TRUNC('month', CURRENT_DATE);
    `;

    const [todayResult, weekResult, monthResult] = await Promise.all([
      client.query(todayQuery, [delivery_boy_id]),
      client.query(weekQuery, [delivery_boy_id]),
      client.query(monthQuery, [delivery_boy_id])
    ]);

    const todayData = todayResult.rows[0];
    const weekData = weekResult.rows[0];
    const monthData = monthResult.rows[0];

    res.status(200).json({
      success: true,
      data: {
        today: {
          deliveries: parseInt(todayData.today_deliveries) || 0,
          rating: parseFloat(todayData.today_rating || 0).toFixed(1),
          onTimeRate: todayData.today_deliveries > 0
            ? ((parseInt(todayData.today_on_time) / parseInt(todayData.today_deliveries)) * 100).toFixed(1)
            : 0
        },
        week: {
          deliveries: parseInt(weekData.week_deliveries) || 0,
          rating: parseFloat(weekData.week_rating || 0).toFixed(1),
          onTimeRate: weekData.week_deliveries > 0
            ? ((parseInt(weekData.week_on_time) / parseInt(weekData.week_deliveries)) * 100).toFixed(1)
            : 0
        },
        month: {
          deliveries: parseInt(monthData.month_deliveries) || 0,
          rating: parseFloat(monthData.month_rating || 0).toFixed(1),
          onTimeRate: monthData.month_deliveries > 0
            ? ((parseInt(monthData.month_on_time) / parseInt(monthData.month_deliveries)) * 100).toFixed(1)
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Error fetching real-time performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching real-time performance metrics',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Abort delivery - marks delivery as failed and updates delivery boy load
export const abortDelivery = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { delivery_id } = req.params;
    const { delivery_boy_id, reason } = req.body;

    // Validate required parameters
    if (!delivery_id || !delivery_boy_id) {
      return res.status(400).json({
        success: false,
        message: 'delivery_id and delivery_boy_id are required'
      });
    }

    // Check if delivery exists and belongs to the delivery boy
    const checkQuery = `
      SELECT d.*, o.user_id as customer_id, o.order_id
      FROM "Delivery" d 
      INNER JOIN "Order" o ON d.order_id = o.order_id
      WHERE d.delivery_id = $1 AND d.delivery_boy_id = $2 
      AND d.current_status NOT IN ('delivered', 'failed', 'cancelled')
    `;
    const checkResult = await client.query(checkQuery, [delivery_id, delivery_boy_id]);

    if (checkResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Delivery not found, not assigned to you, or already completed/cancelled'
      });
    }

    const delivery = checkResult.rows[0];

    // Update delivery status to failed and mark as aborted
    const updateDeliveryQuery = `
      UPDATE "Delivery" 
      SET 
        current_status = 'failed',
        is_aborted = true,
        updated_at = NOW()
      WHERE delivery_id = $1
      RETURNING *
    `;
    
    await client.query(updateDeliveryQuery, [delivery_id]);

    // Update delivery boy's current load (decrease by 1)
    const updateDeliveryBoyQuery = `
      UPDATE "DeliveryBoy" 
      SET current_load = GREATEST(0, current_load - 1)
      WHERE user_id = $1
    `;
    
    await client.query(updateDeliveryBoyQuery, [delivery_boy_id]);

    // Add status history
    const statusHistoryQuery = `
      INSERT INTO "StatusHistory" (entity_type, entity_id, status, updated_by, notes)
      VALUES ('delivery', $1, 'failed', $2, $3)
    `;
    
    await client.query(statusHistoryQuery, [
      delivery_id, 
      delivery_boy_id, 
      reason || 'Delivery aborted by delivery boy'
    ]);

    // Create notification for customer
    const notificationQuery = `
      INSERT INTO "Notification" (
        user_id, notification_type, title, message, 
        reference_type, reference_id, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    
    await client.query(notificationQuery, [
      delivery.customer_id,
      'delivery_update',
      'Delivery Failed',
      `Unfortunately, your delivery for order #${delivery.order_id} could not be completed. We will contact you shortly to resolve this issue.`,
      'delivery',
      delivery_id,
      'high'
    ]);

    // Create notification for admin/management
    const adminNotificationQuery = `
      INSERT INTO "Notification" (
        user_id, notification_type, title, message, 
        reference_type, reference_id, priority
      ) VALUES (
        (SELECT user_id FROM "User" WHERE role_id = 'admin' LIMIT 1),
        'delivery_update',
        'Delivery Aborted',
        $1,
        'delivery',
        $2,
        'high'
      )
    `;
    
    await client.query(adminNotificationQuery, [
      `Delivery #${delivery_id} for order #${delivery.order_id} was aborted by delivery boy. Reason: ${reason || 'No reason provided'}`,
      delivery_id
    ]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Delivery aborted successfully',
      data: {
        delivery_id,
        status: 'failed',
        aborted: true
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error aborting delivery:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to abort delivery',
      error: error.message
    });
  } finally {
    client.release();
  }
};


