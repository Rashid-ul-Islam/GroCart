import pool from '../db.js';
import { updateOrderStatus } from './statusTrackingUtility.js';

export const getActiveDeliveries = async (req, res) => {
  try {
    const { search, region } = req.query;

    let query = `
      SELECT 
        d.delivery_id,
        o.order_id,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.phone_number as customer_phone,
        a.address,
        CONCAT(db_user.first_name, ' ', db_user.last_name) as delivery_boy,
        db_user.phone_number as delivery_boy_phone,
        d.current_status as status,
        d.estimated_arrival,
        d.actual_arrival,
        CASE 
          WHEN o.total_amount > 2000 THEN 'high'
          WHEN o.total_amount > 1000 THEN 'normal'
          ELSE 'low'
        END as priority,
        r.name as region,
        COUNT(oi.order_item_id) as items,
        o.total_amount as value,
        d.created_at as delivery_created
      FROM "Delivery" d
      JOIN "Order" o ON d.order_id = o.order_id
      JOIN "User" u ON o.user_id = u.user_id
      JOIN "Address" a ON d.address_id = a.address_id
      JOIN "Region" r ON a.region_id = r.region_id
      JOIN "DeliveryBoy" db ON d.delivery_boy_id = db.user_id
      JOIN "User" db_user ON db.user_id = db_user.user_id
      JOIN "OrderItem" oi ON o.order_id = oi.order_id
      WHERE d.actual_arrival IS NULL 
        AND COALESCE(d.is_aborted, false) = false
        AND d.current_status NOT IN ('delivery_completed','cancelled')
    `;

    const params = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      query += ` AND (
        o.order_id::text ILIKE $${paramIndex} OR
        CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramIndex} OR
        CONCAT(db_user.first_name, ' ', db_user.last_name) ILIKE $${paramIndex} OR
        u.phone_number ILIKE $${paramIndex}
      )`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (region && region !== 'all' && region.trim()) {
      query += ` AND r.name ILIKE $${paramIndex}`;
      params.push(`%${region.trim()}%`);
      paramIndex++;
    }

    query += `
      GROUP BY d.delivery_id, o.order_id, u.first_name, u.last_name, 
               u.phone_number, a.address, db_user.first_name, db_user.last_name,
               db_user.phone_number,d.current_status, d.estimated_arrival, 
               d.actual_arrival, o.total_amount, r.name, d.created_at
      ORDER BY 
        d.estimated_arrival ASC NULLS LAST,
        d.created_at ASC
    `;

    console.log('Executing query with params:', params);
    const result = await pool.query(query, params);
    console.log(`Found ${result.rows.length} active deliveries`);

    // Transform the data to match frontend expectations
    const deliveries = result.rows.map(row => ({
      deliveryId: `DEL-${row.delivery_id}`,
      orderId: `ORD-${row.order_id}`,
      customerName: row.customer_name || 'Unknown Customer',
      customerPhone: row.customer_phone || 'N/A',
      address: row.address || 'Address not available',
      deliveryBoy: row.delivery_boy || 'Unassigned',
      deliveryBoyPhone: row.delivery_boy_phone || 'N/A',
      status: row.status,
      estimatedArrival: row.estimated_arrival,
      actualArrival: row.actual_arrival,
      priority: row.priority,
      region: row.region || 'Unknown Region',
      items: parseInt(row.items) || 0,
      value: parseFloat(row.value) || 0
    }));

    res.json(deliveries);
  } catch (error) {
    console.error('Error fetching active deliveries:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch active deliveries'
    });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { deliveryId } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses 
      });
    }

    // Extract numeric delivery ID
    const numericDeliveryId = deliveryId.replace('DEL-', '');

    // Verify delivery exists and get order_id
    const deliveryResult = await client.query(
      'SELECT order_id FROM "Delivery" WHERE delivery_id = $1',
      [numericDeliveryId]
    );

    if (deliveryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const orderId = deliveryResult.rows[0].order_id;

    // Update delivery record based on status
    if (status === 'delivered') {
      await client.query(
        'UPDATE "Delivery" SET actual_arrival = NOW(), updated_at = NOW() WHERE delivery_id = $1',
        [numericDeliveryId]
      );
    } else if (status === 'failed' || status === 'cancelled') {
      await client.query(
        'UPDATE "Delivery" SET is_aborted = true, updated_at = NOW() WHERE delivery_id = $1',
        [numericDeliveryId]
      );
    } else {
      await client.query(
        'UPDATE "Delivery" SET updated_at = NOW() WHERE delivery_id = $1',
        [numericDeliveryId]
      );
    }

    // Insert new status in StatusHistory
    await updateOrderStatus(orderId, status, null, notes || `Delivery status updated to ${status}`);

    await client.query('COMMIT');

    console.log(`Delivery ${deliveryId} status updated to ${status}`);

    res.json({
      message: 'Delivery status updated successfully',
      deliveryId,
      status,
      orderId: `ORD-${orderId}`
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating delivery status:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to update delivery status'
    });
  } finally {
    client.release();
  }
};

export const getDeliveryDetails = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const numericDeliveryId = deliveryId.replace('DEL-', '');

    const query = `
      SELECT 
        d.delivery_id,
        o.order_id,
        CONCAT(u.first_name, ' ', u.last_name) as customer_name,
        u.phone_number as customer_phone,
        u.email as customer_email,
        a.address,
        CONCAT(db_user.first_name, ' ', db_user.last_name) as delivery_boy,
        db_user.phone_number as delivery_boy_phone,
        COALESCE(sh.status, 'assigned') as status,
        d.estimated_arrival,
        d.actual_arrival,
        d.is_aborted,
        CASE 
          WHEN o.total_amount > 2000 THEN 'high'
          WHEN o.total_amount > 1000 THEN 'normal'
          ELSE 'low'
        END as priority,
        '0 km' as distance,
        r.name as region,
        COUNT(oi.order_item_id) as items,
        o.total_amount as value,
        o.payment_method,
        o.payment_status,
        d.created_at as delivery_created,
        d.updated_at as delivery_updated
      FROM "Delivery" d
      JOIN "Order" o ON d.order_id = o.order_id
      JOIN "User" u ON o.user_id = u.user_id
      JOIN "Address" a ON d.address_id = a.address_id
      JOIN "Region" r ON a.region_id = r.region_id
      JOIN "DeliveryBoy" db ON d.delivery_boy_id = db.user_id
      JOIN "User" db_user ON db.user_id = db_user.user_id
      JOIN "OrderItem" oi ON o.order_id = oi.order_id
      LEFT JOIN (
        SELECT DISTINCT ON (entity_id) 
          entity_id as order_id, status, updated_at
        FROM "StatusHistory"
        WHERE entity_type = 'order'
        ORDER BY entity_id, updated_at DESC
      ) sh ON o.order_id = sh.order_id
      WHERE d.delivery_id = $1
      GROUP BY d.delivery_id, o.order_id, u.first_name, u.last_name, 
               u.phone_number, u.email, a.address, db_user.first_name, db_user.last_name,
               db_user.phone_number, sh.status, d.estimated_arrival, 
               d.actual_arrival, d.is_aborted, o.total_amount, r.name, 
               o.payment_method, o.payment_status, d.created_at, d.updated_at
    `;

    const result = await pool.query(query, [numericDeliveryId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const row = result.rows[0];

    // Get order items details
    const itemsQuery = `
      SELECT 
        oi.quantity,
        oi.price,
        p.name as product_name,
        p.unit_measure
      FROM "OrderItem" oi
      JOIN "Product" p ON oi.product_id = p.product_id
      WHERE oi.order_id = $1
      ORDER BY p.name
    `;

    const itemsResult = await pool.query(itemsQuery, [row.order_id]);

    // Get status history
    const statusHistoryQuery = `
      SELECT status, updated_at, notes
      FROM "StatusHistory"
      WHERE entity_type = 'order' AND entity_id = $1
      ORDER BY updated_at DESC
      LIMIT 10
    `;

    const statusHistoryResult = await pool.query(statusHistoryQuery, [row.order_id]);

    const delivery = {
      deliveryId: `DEL-${row.delivery_id}`,
      orderId: `ORD-${row.order_id}`,
      customerName: row.customer_name || 'Unknown Customer',
      customerPhone: row.customer_phone || 'N/A',
      customerEmail: row.customer_email || 'N/A',
      address: row.address || 'Address not available',
      deliveryBoy: row.delivery_boy || 'Unassigned',
      deliveryBoyPhone: row.delivery_boy_phone || 'N/A',
      status: row.status,
      estimatedArrival: row.estimated_arrival,
      actualArrival: row.actual_arrival,
      isAborted: row.is_aborted || false,
      priority: row.priority,
      distance: row.distance,
      region: row.region || 'Unknown Region',
      items: parseInt(row.items) || 0,
      value: parseFloat(row.value) || 0,
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      deliveryCreated: row.delivery_created,
      deliveryUpdated: row.delivery_updated,
      orderItems: itemsResult.rows.map(item => ({
        productName: item.product_name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        unitMeasure: item.unit_measure
      })),
      statusHistory: statusHistoryResult.rows
    };

    res.json(delivery);
  } catch (error) {
    console.error('Error fetching delivery details:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to fetch delivery details'
    });
  }
};

// Debug endpoint to check data integrity
export const debugActiveDeliveries = async (req, res) => {
  try {
    // Check basic delivery data
    const basicDeliveries = await pool.query(`
      SELECT 
        COUNT(*) as total_deliveries,
        COUNT(CASE WHEN actual_arrival IS NULL THEN 1 END) as pending_deliveries,
        COUNT(CASE WHEN COALESCE(is_aborted, false) = false THEN 1 END) as non_aborted,
        COUNT(CASE WHEN actual_arrival IS NULL AND COALESCE(is_aborted, false) = false THEN 1 END) as active_deliveries
      FROM "Delivery"
    `);

    // Check status history coverage
    const statusCoverage = await pool.query(`
      SELECT 
        COUNT(DISTINCT d.order_id) as deliveries_with_orders,
        COUNT(DISTINCT sh.entity_id) as orders_with_status,
        COUNT(DISTINCT CASE WHEN sh.status IN ('assigned', 'picked_up', 'in_transit', 'pending') THEN sh.entity_id END) as orders_with_active_status
      FROM "Delivery" d
      JOIN "Order" o ON d.order_id = o.order_id
      LEFT JOIN "StatusHistory" sh ON o.order_id = sh.entity_id AND sh.entity_type = 'order'
      WHERE d.actual_arrival IS NULL AND COALESCE(d.is_aborted, false) = false
    `);

    // Check delivery boy assignments
    const deliveryBoyCheck = await pool.query(`
      SELECT 
        COUNT(*) as total_active_deliveries,
        COUNT(db.user_id) as with_delivery_boys,
        COUNT(db_user.user_id) as with_valid_users
      FROM "Delivery" d
      LEFT JOIN "DeliveryBoy" db ON d.delivery_boy_id = db.user_id
      LEFT JOIN "User" db_user ON db.user_id = db_user.user_id
      WHERE d.actual_arrival IS NULL AND COALESCE(d.is_aborted, false) = false
    `);

    // Check address and region data
    const addressCheck = await pool.query(`
      SELECT 
        COUNT(*) as total_active_deliveries,
        COUNT(a.address_id) as with_addresses,
        COUNT(r.region_id) as with_regions
      FROM "Delivery" d
      LEFT JOIN "Address" a ON d.address_id = a.address_id
      LEFT JOIN "Region" r ON a.region_id = r.region_id
      WHERE d.actual_arrival IS NULL AND COALESCE(d.is_aborted, false) = false
    `);

    // Sample delivery data
    const sampleDeliveries = await pool.query(`
      SELECT 
        d.delivery_id,
        d.order_id,
        d.delivery_boy_id,
        d.address_id,
        COALESCE(sh.status, 'no_status') as status,
        d.actual_arrival,
        d.is_aborted
      FROM "Delivery" d
      LEFT JOIN "StatusHistory" sh ON d.order_id = sh.entity_id AND sh.entity_type = 'order'
      WHERE d.actual_arrival IS NULL AND COALESCE(d.is_aborted, false) = false
      ORDER BY d.delivery_id
      LIMIT 5
    `);

    res.json({
      basicDeliveries: basicDeliveries.rows[0],
      statusCoverage: statusCoverage.rows[0],
      deliveryBoyCheck: deliveryBoyCheck.rows[0],
      addressCheck: addressCheck.rows[0],
      sampleDeliveries: sampleDeliveries.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug query error:', error);
    res.status(500).json({ 
      error: 'Debug query failed', 
      message: error.message 
    });
  }
};

// Helper function to initialize missing status records
export const initializeDeliveryStatuses = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Find deliveries without status history
    const deliveriesWithoutStatus = await client.query(`
      SELECT DISTINCT d.order_id, d.delivery_id
      FROM "Delivery" d
      LEFT JOIN "StatusHistory" sh ON d.order_id = sh.entity_id AND sh.entity_type = 'order'
      WHERE sh.entity_id IS NULL 
        AND d.actual_arrival IS NULL
        AND COALESCE(d.is_aborted, false) = false
    `);

    let initializedCount = 0;

    // Initialize missing status records
    for (const row of deliveriesWithoutStatus.rows) {
      await client.query(`
        INSERT INTO "StatusHistory" (entity_type, entity_id, status, updated_at, notes)
        VALUES ('order', $1, 'assigned', NOW(), 'Auto-initialized for delivery tracking')
        ON CONFLICT DO NOTHING
      `, [row.order_id]);
      initializedCount++;
    }

    await client.query('COMMIT');
    
    console.log(`Initialized status for ${initializedCount} orders`);
    
    res.json({
      message: 'Status initialization completed',
      initializedOrders: initializedCount,
      deliveriesProcessed: deliveriesWithoutStatus.rows.length
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Status initialization error:', error);
    res.status(500).json({ 
      error: 'Status initialization failed',
      message: error.message
    });
  } finally {
    client.release();
  }
};