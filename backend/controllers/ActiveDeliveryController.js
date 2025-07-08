
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
        sh.status,
        d.estimated_arrival,
        d.actual_arrival,
        CASE 
          WHEN o.total_amount > 2000 THEN 'high'
          WHEN o.total_amount > 1000 THEN 'normal'
          ELSE 'low'
        END as priority,
        '0 km' as distance, -- You may want to calculate this based on coordinates
        r.name as region,
        COUNT(oi.order_item_id) as items,
        o.total_amount as value
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
      WHERE d.actual_arrival IS NULL 
        AND d.is_aborted = false
        AND sh.status IN ('assigned', 'picked_up', 'in_transit')
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (
        o.order_id::text ILIKE $${paramIndex} OR
        CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramIndex} OR
        CONCAT(db_user.first_name, ' ', db_user.last_name) ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (region && region !== 'all') {
      query += ` AND r.name ILIKE $${paramIndex}`;
      params.push(`%${region}%`);
      paramIndex++;
    }

    query += `
      GROUP BY d.delivery_id, o.order_id, u.first_name, u.last_name, 
               u.phone_number, a.address, db_user.first_name, db_user.last_name,
               db_user.phone_number, sh.status, d.estimated_arrival, 
               d.actual_arrival, o.total_amount, r.name
      ORDER BY d.estimated_arrival ASC
    `;

    const result = await pool.query(query, params);

    // Transform the data to match frontend expectations
    const deliveries = result.rows.map(row => ({
      deliveryId: `DEL-${row.delivery_id}`,
      orderId: `ORD-${row.order_id}`,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      address: row.address,
      deliveryBoy: row.delivery_boy,
      deliveryBoyPhone: row.delivery_boy_phone,
      status: row.status,
      estimatedArrival: row.estimated_arrival,
      actualArrival: row.actual_arrival,
      priority: row.priority,
      distance: row.distance,
      region: row.region,
      items: parseInt(row.items),
      value: parseFloat(row.value)
    }));

    res.json(deliveries);
  } catch (error) {
    console.error('Error fetching active deliveries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { deliveryId } = req.params;
    const { status } = req.body;

    // Extract numeric delivery ID
    const numericDeliveryId = deliveryId.replace('DEL-', '');

    // Get order_id from delivery
    const deliveryResult = await client.query(
      'SELECT order_id FROM "Delivery" WHERE delivery_id = $1',
      [numericDeliveryId]
    );

    if (deliveryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const orderId = deliveryResult.rows[0].order_id;

    // Update delivery actual_arrival if status is delivered
    if (status === 'delivered') {
      await client.query(
        'UPDATE "Delivery" SET actual_arrival = NOW(), updated_at = NOW() WHERE delivery_id = $1',
        [numericDeliveryId]
      );
    }

    // Insert new status in StatusHistory using consolidated approach
    await updateOrderStatus(orderId, status, null, 'Delivery status updated');

    await client.query('COMMIT');

    res.json({
      message: 'Delivery status updated successfully',
      deliveryId,
      status
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: 'Internal server error' });
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
        a.address,
        CONCAT(db_user.first_name, ' ', db_user.last_name) as delivery_boy,
        db_user.phone_number as delivery_boy_phone,
        sh.status,
        d.estimated_arrival,
        d.actual_arrival,
        CASE 
          WHEN o.total_amount > 2000 THEN 'high'
          WHEN o.total_amount > 1000 THEN 'normal'
          ELSE 'low'
        END as priority,
        '0 km' as distance,
        r.name as region,
        COUNT(oi.order_item_id) as items,
        o.total_amount as value
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
               u.phone_number, a.address, db_user.first_name, db_user.last_name,
               db_user.phone_number, sh.status, d.estimated_arrival, 
               d.actual_arrival, o.total_amount, r.name
    `;

    const result = await pool.query(query, [numericDeliveryId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const row = result.rows[0];
    const delivery = {
      deliveryId: `DEL-${row.delivery_id}`,
      orderId: `ORD-${row.order_id}`,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      address: row.address,
      deliveryBoy: row.delivery_boy,
      deliveryBoyPhone: row.delivery_boy_phone,
      status: row.status,
      estimatedArrival: row.estimated_arrival,
      actualArrival: row.actual_arrival,
      priority: row.priority,
      distance: row.distance,
      region: row.region,
      items: parseInt(row.items),
      value: parseFloat(row.value)
    };

    res.json(delivery);
  } catch (error) {
    console.error('Error fetching delivery details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};