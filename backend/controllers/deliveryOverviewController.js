import pool from '../db.js';

// Get delivery overview statistics
export const getDeliveryStats = async (req, res) => {
  try {
    console.log('Fetching delivery overview statistics...');

    // Get current date for today's calculations
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const client = await pool.connect();

    // Combined query for all statistics using proper schema
    const statsQuery = `
      WITH daily_stats AS (
        SELECT 
          COUNT(*) as total_deliveries,
          COUNT(CASE WHEN sh.status IN ('assigned', 'in_transit', 'out_for_delivery') THEN 1 END) as active_deliveries,
          COUNT(CASE WHEN sh.status = 'delivered' AND DATE(sh.updated_at) = $1 THEN 1 END) as completed_today,
          COUNT(CASE WHEN sh.status = 'delivered' AND DATE(sh.updated_at) = $2 THEN 1 END) as completed_yesterday,
          COUNT(CASE WHEN sh.status IN ('pending', 'order_placed', 'confirmed') THEN 1 END) as pending_assignments
        FROM "Delivery" d
        LEFT JOIN "StatusHistory" sh ON d.delivery_id = sh.entity_id AND sh.entity_type = 'delivery'
        WHERE d.created_at >= NOW() - INTERVAL '30 days'
          AND sh.updated_at = (
            SELECT MAX(sh2.updated_at) 
            FROM "StatusHistory" sh2 
            WHERE sh2.entity_id = d.delivery_id AND sh2.entity_type = 'delivery'
          )
      ),
      on_time_stats AS (
        SELECT 
          COUNT(*) as total_completed,
          COUNT(CASE WHEN d.actual_arrival <= d.estimated_arrival THEN 1 END) as on_time_deliveries
        FROM "Delivery" d
        LEFT JOIN "StatusHistory" sh ON d.delivery_id = sh.entity_id AND sh.entity_type = 'delivery'
        WHERE sh.status = 'delivered' 
          AND d.actual_arrival IS NOT NULL 
          AND d.estimated_arrival IS NOT NULL
          AND d.created_at >= NOW() - INTERVAL '30 days'
          AND sh.updated_at = (
            SELECT MAX(sh2.updated_at) 
            FROM "StatusHistory" sh2 
            WHERE sh2.entity_id = d.delivery_id AND sh2.entity_type = 'delivery'
          )
      ),
      delivery_boy_stats AS (
        SELECT 
          COUNT(*) as total_delivery_boys,
          COUNT(CASE WHEN db.availability_status = 'available' THEN 1 END) as available_delivery_boys,
          COUNT(CASE WHEN db.availability_status = 'busy' THEN 1 END) as busy_delivery_boys
        FROM "DeliveryBoy" db
      )
      SELECT 
        ds.total_deliveries,
        ds.active_deliveries,
        ds.completed_today,
        ds.completed_yesterday,
        ds.pending_assignments,
        CASE 
          WHEN ots.total_completed > 0 
          THEN ROUND((ots.on_time_deliveries::DECIMAL / ots.total_completed * 100), 1)
          ELSE 0 
        END as on_time_rate,
        dbs.available_delivery_boys,
        dbs.busy_delivery_boys
      FROM daily_stats ds
      CROSS JOIN on_time_stats ots
      CROSS JOIN delivery_boy_stats dbs
    `;

    const result = await client.query(statsQuery, [today, yesterday]);
    
    if (result.rows.length === 0) {
      client.release();
      return res.json({
        totalDeliveries: 0,
        activeDeliveries: 0,
        completedToday: 0,
        onTimeRate: 0,
        availableDeliveryBoys: 0,
        busyDeliveryBoys: 0,
        pendingAssignments: 0
      });
    }

    const stats = result.rows[0];
    
    console.log('Delivery overview stats fetched successfully:', stats);
    
    client.release();
    res.json({
      totalDeliveries: parseInt(stats.total_deliveries) || 0,
      activeDeliveries: parseInt(stats.active_deliveries) || 0,
      completedToday: parseInt(stats.completed_today) || 0,
      onTimeRate: parseFloat(stats.on_time_rate) || 0,
      availableDeliveryBoys: parseInt(stats.available_delivery_boys) || 0,
      busyDeliveryBoys: parseInt(stats.busy_delivery_boys) || 0,
      pendingAssignments: parseInt(stats.pending_assignments) || 0
    });

  } catch (error) {
    console.error('Error fetching delivery overview stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch delivery statistics',
      details: error.message 
    });
  }
};

// Get recent orders with delivery information
export const getRecentOrders = async (req, res) => {
  try {
    console.log('Fetching recent orders...');
    
    const { searchTerm, filterRegion, limit = 10 } = req.query;
    const client = await pool.connect();
    
    let whereConditions = ['d.created_at >= NOW() - INTERVAL \'7 days\''];
    let queryParams = [];
    let paramIndex = 1;

    // Add search term filter
    if (searchTerm && searchTerm.trim()) {
      whereConditions.push(`(
        o.order_id::TEXT ILIKE $${paramIndex} OR 
        CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramIndex} OR 
        a.address ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${searchTerm.trim()}%`);
      paramIndex++;
    }

    // Add region filter
    if (filterRegion && filterRegion.trim()) {
      whereConditions.push(`dr.name ILIKE $${paramIndex}`);
      queryParams.push(`%${filterRegion.trim()}%`);
      paramIndex++;
    }

    // Add limit parameter
    queryParams.push(parseInt(limit));

    const recentOrdersQuery = `
      SELECT 
        d.delivery_id,
        d.order_id,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        a.address,
        sh.status,
        CASE 
          WHEN o.total_amount > 1000 THEN 'high'
          WHEN o.total_amount > 500 THEN 'normal'
          ELSE 'low'
        END as priority,
        d.estimated_arrival as expected_delivery_time,
        d.created_at,
        dr.name as region_name,
        CONCAT(db_user.first_name, ' ', db_user.last_name) as delivery_boy_name,
        CASE 
          WHEN d.estimated_arrival IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (d.estimated_arrival - NOW())) / 3600
          ELSE NULL 
        END as hours_until_delivery
      FROM "Delivery" d
      LEFT JOIN "Order" o ON d.order_id = o.order_id
      LEFT JOIN "User" u ON o.user_id = u.user_id
      LEFT JOIN "Address" a ON d.address_id = a.address_id
      LEFT JOIN "Region" r ON a.region_id = r.region_id
      LEFT JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
      LEFT JOIN "DeliveryBoy" db ON d.delivery_boy_id = db.user_id
      LEFT JOIN "User" db_user ON db.user_id = db_user.user_id
      LEFT JOIN "StatusHistory" sh ON d.delivery_id = sh.entity_id AND sh.entity_type = 'delivery'
      WHERE ${whereConditions.join(' AND ')}
        AND sh.status NOT IN ('delivered', 'cancelled')
        AND sh.updated_at = (
          SELECT MAX(sh2.updated_at) 
          FROM "StatusHistory" sh2 
          WHERE sh2.entity_id = d.delivery_id AND sh2.entity_type = 'delivery'
        )
      ORDER BY d.created_at DESC, 
               CASE 
                 WHEN o.total_amount > 1000 THEN 1 
                 WHEN o.total_amount > 500 THEN 2 
                 ELSE 3 
               END
      LIMIT $${paramIndex}
    `;

    const result = await client.query(recentOrdersQuery, queryParams);

    const orders = result.rows.map(order => ({
      orderId: order.order_id,
      deliveryId: order.delivery_id,
      customerName: order.customer_name || 'Unknown Customer',
      address: order.address || 'Address not provided',
      status: order.status || 'pending',
      priority: order.priority || 'normal',
      regionName: order.region_name,
      deliveryBoyName: order.delivery_boy_name,
      expectedDeliveryTime: order.expected_delivery_time,
      createdAt: order.created_at,
      estimatedTime: order.hours_until_delivery 
        ? `${Math.abs(Math.round(order.hours_until_delivery))}h ${order.hours_until_delivery < 0 ? 'overdue' : 'remaining'}`
        : 'Time not set'
    }));

    console.log(`Recent orders fetched successfully: ${orders.length} orders`);
    
    client.release();
    res.json(orders);

  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ 
      error: 'Failed to fetch recent orders',
      details: error.message 
    });
  }
};

