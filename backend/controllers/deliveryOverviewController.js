import pool from '../db.js';

// Get delivery overview statistics
export const getDeliveryStats = async (req, res) => {
  try {
    const client = await pool.connect();

    // Get total deliveries (all time)
    const totalDeliveriesQuery = `
      SELECT COUNT(*) as total_deliveries FROM "Delivery"
    `;

    // Get active deliveries (not delivered yet)
    const activeDeliveriesQuery = `
      SELECT COUNT(*) as active_deliveries 
      FROM "Delivery" d
      JOIN "StatusHistory" sh ON d.order_id = sh.entity_id
      WHERE sh.entity_type = 'order' 
        AND sh.status NOT IN ('delivered', 'cancelled')
        AND sh.updated_at = (
          SELECT MAX(updated_at) 
          FROM "StatusHistory" 
          WHERE entity_id = d.order_id AND entity_type = 'order'
        )
    `;

    // Get completed today
    const completedTodayQuery = `
      SELECT COUNT(*) as completed_today
      FROM "Delivery" d
      JOIN "StatusHistory" sh ON d.order_id = sh.entity_id
      WHERE sh.entity_type = 'order' 
        AND sh.status = 'delivered'
        AND DATE(sh.updated_at) = CURRENT_DATE
        AND sh.updated_at = (
          SELECT MAX(updated_at) 
          FROM "StatusHistory" 
          WHERE entity_id = d.order_id AND entity_type = 'order'
        )
    `;

    // Get on-time delivery rate
    // Get on-time delivery rate
    const onTimeRateQuery = `
      SELECT
      ROUND(
      COALESCE(
        (COUNT(CASE WHEN dp.delivered_on_time = true THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 
        0
      ), 1
      ) as on_time_rate
      FROM "DeliveryPerformance" dp
      WHERE dp.recorded_at >= CURRENT_DATE - INTERVAL '30 days'
    `;


    // Get available and busy delivery boys
    const deliveryBoysQuery = `
      SELECT 
        COUNT(CASE WHEN availability_status = 'available' THEN 1 END) as available_delivery_boys,
        COUNT(CASE WHEN availability_status = 'busy' THEN 1 END) as busy_delivery_boys
      FROM "DeliveryBoy"
    `;

    // Get pending assignments (orders without delivery assignment)
    const pendingAssignmentsQuery = `
      SELECT COUNT(*) as pending_assignments
      FROM "Order" o
      LEFT JOIN "Delivery" d ON o.order_id = d.order_id
      JOIN "StatusHistory" sh ON o.order_id = sh.entity_id
      WHERE d.delivery_id IS NULL
        AND sh.entity_type = 'order'
        AND sh.status NOT IN ('cancelled', 'delivered')
        AND sh.updated_at = (
          SELECT MAX(updated_at) 
          FROM "StatusHistory" 
          WHERE entity_id = o.order_id AND entity_type = 'order'
        )
    `;

    const results = await Promise.all([
      client.query(totalDeliveriesQuery),
      client.query(activeDeliveriesQuery),
      client.query(completedTodayQuery),
      client.query(onTimeRateQuery),
      client.query(deliveryBoysQuery),
      client.query(pendingAssignmentsQuery)
    ]);

    const stats = {
      totalDeliveries: parseInt(results[0].rows[0].total_deliveries) || 0,
      activeDeliveries: parseInt(results[1].rows[0].active_deliveries) || 0,
      completedToday: parseInt(results[2].rows[0].completed_today) || 0,
      onTimeRate: parseFloat(results[3].rows[0].on_time_rate) || 0,
      availableDeliveryBoys: parseInt(results[4].rows[0].available_delivery_boys) || 0,
      busyDeliveryBoys: parseInt(results[4].rows[0].busy_delivery_boys) || 0,
      pendingAssignments: parseInt(results[5].rows[0].pending_assignments) || 0
    };

    client.release();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get recent orders with delivery information
export const getRecentOrders = async (req, res) => {
  try {
    const { searchTerm, filterRegion, limit = 10 } = req.query;
    const client = await pool.connect();

    let query = `
      SELECT 
        o.order_id,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        a.address,
        sh.status,
        CASE 
          WHEN d.delivery_boy_id IS NOT NULL THEN CONCAT(db_user.first_name, ' ', db_user.last_name)
          ELSE 'Unassigned'
        END as delivery_boy,
        CASE 
          WHEN d.estimated_arrival IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (d.estimated_arrival - NOW())) / 60
          ELSE NULL
        END as estimated_minutes,
        CASE 
          WHEN o.total_amount > 1000 THEN 'high'
          WHEN o.total_amount > 500 THEN 'normal'
          ELSE 'low'
        END as priority,
        r.name as region_name
      FROM "Order" o
      JOIN "User" u ON o.user_id = u.user_id
      LEFT JOIN "Delivery" d ON o.order_id = d.order_id
      LEFT JOIN "Address" a ON d.address_id = a.address_id
      LEFT JOIN "Region" r ON a.region_id = r.region_id
      LEFT JOIN "DeliveryBoy" db ON d.delivery_boy_id = db.user_id
      LEFT JOIN "User" db_user ON db.user_id = db_user.user_id
      JOIN "StatusHistory" sh ON o.order_id = sh.entity_id
      WHERE sh.entity_type = 'order'
        AND sh.updated_at = (
          SELECT MAX(updated_at) 
          FROM "StatusHistory" 
          WHERE entity_id = o.order_id AND entity_type = 'order'
        )
        AND sh.status NOT IN ('delivered', 'cancelled')
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (searchTerm) {
      query += ` AND (
        CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramIndex}
        OR o.order_id::text ILIKE $${paramIndex}
        OR a.address ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${searchTerm}%`);
      paramIndex++;
    }

    if (filterRegion) {
      query += ` AND r.name ILIKE $${paramIndex}`;
      queryParams.push(`%${filterRegion}%`);
      paramIndex++;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex}`;
    queryParams.push(limit);

    const result = await client.query(query, queryParams);

    const orders = result.rows.map(row => ({
      orderId: `ORD-${row.order_id}`,
      customerName: row.customer_name || 'Unknown Customer',
      address: row.address || 'Address not specified',
      status: mapOrderStatus(row.status),
      deliveryBoy: row.delivery_boy || 'Unassigned',
      estimatedTime: row.estimated_minutes ? `${Math.round(row.estimated_minutes)} mins` : 'N/A',
      priority: row.priority,
      region: row.region_name
    }));

    client.release();
    res.json(orders);
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to map database status to frontend status
const mapOrderStatus = (dbStatus) => {
  const statusMap = {
    'order_placed': 'pending',
    'confirmed': 'assigned',
    'preparing': 'assigned',
    'ready_for_delivery': 'assigned',
    'out_for_delivery': 'in_transit',
    'delivered': 'delivered',
    'cancelled': 'cancelled'
  };
  return statusMap[dbStatus] || 'pending';
};
