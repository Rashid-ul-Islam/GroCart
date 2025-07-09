import pool from '../db.js';
import { updateOrderStatus } from './statusTrackingUtility.js';

// Create new order
export const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      user_id,
      items,
      address_id,
      payment_method,
      total_amount,
      product_total,
      tax_total,
      shipping_total,
      discount_total,
      coupon_id
    } = req.body;

    // Validate required fields
    if (!user_id || !items || items.length === 0 || !address_id || !payment_method || !total_amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: user_id, items, address_id, payment_method, and total_amount are required'
      });
    }

    // Validate address belongs to user
    const addressQuery = `
      SELECT a.address_id, a.region_id, r.delivery_region_id
      FROM "Address" a
      JOIN "Region" r ON a.region_id = r.region_id
      WHERE a.address_id = $1 AND a.user_id = $2;
    `;
    const addressResult = await client.query(addressQuery, [address_id, user_id]);

    if (addressResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Invalid address or address does not belong to user'
      });
    }

    const addressData = addressResult.rows[0];
    const delivery_region_id = addressData.delivery_region_id;

    // Check stock availability and validate items
    const productIds = items.map(item => item.product_id);
    const stockQuery = `
      SELECT product_id, quantity, is_available, name, price
      FROM "Product"
      WHERE product_id = ANY($1);
    `;
    const stockResult = await client.query(stockQuery, [productIds]);

    if (stockResult.rows.length !== items.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'One or more products not found'
      });
    }

    // Create a map for quick lookup
    const productMap = new Map();
    stockResult.rows.forEach(product => {
      productMap.set(product.product_id, product);
    });

    // Validate each item
    for (const item of items) {
      const product = productMap.get(item.product_id);

      if (!product) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Product with ID ${item.product_id} not found`
        });
      }

      if (!product.is_available) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is not available`
        });
      }

      if (product.quantity < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`
        });
      }

      // Validate item quantity is positive
      if (item.quantity <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for product "${product.name}"`
        });
      }
    }

    // Validate coupon if provided
    if (coupon_id) {
      const couponQuery = `
        SELECT coupon_id, code, discount_type, discount_value, min_purchase, max_discount, 
               start_date, end_date, is_active, usage_limit, usage_count
        FROM "Coupon"
        WHERE coupon_id = $1 AND is_active = true 
          AND start_date <= CURRENT_TIMESTAMP 
          AND end_date >= CURRENT_TIMESTAMP;
      `;
      const couponResult = await client.query(couponQuery, [coupon_id]);

      if (couponResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired coupon'
        });
      }

      const coupon = couponResult.rows[0];

      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Coupon usage limit exceeded'
        });
      }

      // Check minimum purchase requirement
      if (coupon.min_purchase && product_total < coupon.min_purchase) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `Minimum purchase amount of ${coupon.min_purchase} required for this coupon`
        });
      }
    }

    // Create order
    const orderQuery = `
      INSERT INTO "Order" (
        user_id, order_date, total_amount, product_total, tax_total, 
        shipping_total, discount_total, payment_method, payment_status, 
        created_at, updated_at
      )
      VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5, $6, $7, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING order_id;
    `;

    const orderResult = await client.query(orderQuery, [
      user_id, total_amount, product_total || 0, tax_total || 0,
      shipping_total || 0, discount_total || 0, payment_method
    ]);

    const order_id = orderResult.rows[0].order_id;

    // Create order items and update product quantities
    for (const item of items) {
      const product = productMap.get(item.product_id);

      // Use the price from the product if not provided in the item
      const itemPrice = item.price || product.price;

      // Insert order item
      const orderItemQuery = `
        INSERT INTO "OrderItem" (order_id, product_id, quantity, price)
        VALUES ($1, $2, $3, $4);
      `;
      await client.query(orderItemQuery, [order_id, item.product_id, item.quantity, itemPrice]);

      // Update product quantity
      const updateProductQuery = `
        UPDATE "Product"
        SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = $2;
      `;
      await client.query(updateProductQuery, [item.quantity, item.product_id]);
    }

    // Apply coupon if provided
    if (coupon_id && discount_total > 0) {
      const orderCouponQuery = `
        INSERT INTO "OrderCoupon" (order_id, coupon_id, discount_amount)
        VALUES ($1, $2, $3);
      `;
      await client.query(orderCouponQuery, [order_id, coupon_id, discount_total]);

      // Update coupon usage count
      const updateCouponQuery = `
        UPDATE "Coupon"
        SET usage_count = usage_count + 1
        WHERE coupon_id = $1;
      `;
      await client.query(updateCouponQuery, [coupon_id]);
    }

    // Create order status history using consolidated approach
    await updateOrderStatus(order_id, 'pending', user_id, 'Order created', client);

    // Clear user's cart
    const clearCartQuery = `
      DELETE FROM "ShoppingCart"
      WHERE user_id = $1 AND now_in_cart = true;
    `;
    await client.query(clearCartQuery, [user_id]);

    // Find an available delivery boy in the region
    let delivery_id = null;

    if (delivery_region_id) {
      const deliveryBoyQuery = `
        SELECT user_id
        FROM "DeliveryBoy"
        WHERE delivery_region_id = $1 AND availability_status = 'available'
        ORDER BY current_load ASC, user_id ASC
        LIMIT 1;
      `;
      const deliveryBoyResult = await client.query(deliveryBoyQuery, [delivery_region_id]);

      if (deliveryBoyResult.rows.length > 0) {
        const delivery_boy_id = deliveryBoyResult.rows[0].user_id;

        // Create delivery record
        const deliveryQuery = `
          INSERT INTO "Delivery" (order_id, address_id, delivery_boy_id, created_at, updated_at)
          VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING delivery_id;
        `;
        const deliveryResult = await client.query(deliveryQuery, [order_id, address_id, delivery_boy_id]);
        delivery_id = deliveryResult.rows[0].delivery_id;

        // Update order status to 'assigned' when delivery boy is assigned
        await updateOrderStatus(order_id, 'assigned', delivery_boy_id, 'Order assigned to delivery boy', client);

        // Update delivery boy's current load
        const updateDeliveryBoyQuery = `
          UPDATE "DeliveryBoy"
          SET current_load = current_load + 1
          WHERE user_id = $1;
        `;
        await client.query(updateDeliveryBoyQuery, [delivery_boy_id]);
      } else {
        // No delivery boy available, create delivery record without assignment
        const deliveryQuery = `
          INSERT INTO "Delivery" (order_id, address_id, delivery_boy_id, created_at, updated_at)
          VALUES ($1, $2, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING delivery_id;
        `;
        const deliveryResult = await client.query(deliveryQuery, [order_id, address_id]);
        delivery_id = deliveryResult.rows[0].delivery_id;
      }
    } else {
      // No delivery region found, create delivery record without assignment
      const deliveryQuery = `
        INSERT INTO "Delivery" (order_id, address_id, delivery_boy_id, created_at, updated_at)
        VALUES ($1, $2, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING delivery_id;
      `;
      const deliveryResult = await client.query(deliveryQuery, [order_id, address_id]);
      delivery_id = deliveryResult.rows[0].delivery_id;
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order_id,
        delivery_id,
        total_amount,
        payment_method,
        status: 'pending'
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Get user orders
export const getUserOrders = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id || isNaN(user_id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      });
    }

    const query = `
      SELECT 
        o.order_id,
        o.order_date,
        o.total_amount,
        d.address_id,
        a.address as delivery_address,
        (SELECT COUNT(*) FROM "OrderItem" oi WHERE oi.order_id = o.order_id) as item_count,
        (
          SELECT sh.status
          FROM "StatusHistory" sh
          WHERE sh.entity_type = 'order' AND sh.entity_id = o.order_id
          ORDER BY sh.updated_at DESC
          LIMIT 1
        ) as status
      FROM "Order" o
      LEFT JOIN "Delivery" d ON o.order_id = d.order_id
      LEFT JOIN "Address" a ON d.address_id = a.address_id
      WHERE o.user_id = $1
      ORDER BY o.order_date DESC;
    `;

    const result = await pool.query(query, [user_id]);

    const orders = result.rows.map(order => ({
      ...order,
      order_id: `ORD-${String(order.order_id).padStart(6, '0')}`,
      items: Array(parseInt(order.item_count, 10)).fill({}), // Create a dummy array for length
    }));


    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// Get order details
export const getOrderDetails = async (req, res) => {
  try {
    const { order_id: orderIdStr } = req.params;
    const order_id = parseInt(orderIdStr.replace('ORD-', ''), 10);


    if (!order_id || isNaN(order_id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid order ID is required'
      });
    }

    const orderQuery = `
      SELECT 
        o.*,
        a.address as delivery_address,
        d.delivery_id,
        d.delivery_boy_id,
        d.estimated_arrival as estimated_delivery,
        db_user.first_name as db_first_name,
        db_user.last_name as db_last_name,
        db_user.phone_number as db_phone,
        db_user.email as db_email,
        (SELECT AVG(rating) FROM "DeliveryReview" WHERE delivery_boy_id = d.delivery_boy_id) as db_rating,
        (SELECT COUNT(*) FROM "Delivery" WHERE delivery_boy_id = d.delivery_boy_id AND actual_arrival IS NOT NULL) as db_total_deliveries,
        (
          SELECT sh.status
          FROM "StatusHistory" sh
          WHERE sh.entity_type = 'order' AND sh.entity_id = o.order_id
          ORDER BY sh.updated_at DESC
          LIMIT 1
        ) as status
      FROM "Order" o
      LEFT JOIN "Delivery" d ON o.order_id = d.order_id
      LEFT JOIN "Address" a ON d.address_id = a.address_id
      LEFT JOIN "DeliveryBoy" db ON d.delivery_boy_id = db.user_id
      LEFT JOIN "User" db_user ON db.user_id = db_user.user_id
      WHERE o.order_id = $1;
    `;

    const itemsQuery = `
      SELECT 
        oi.product_id,
        oi.quantity,
        oi.price,
        p.name,
        cat.name as category,
        pi.image_url as image
      FROM "OrderItem" oi
      JOIN "Product" p ON oi.product_id = p.product_id
      LEFT JOIN "Category" cat ON p.category_id = cat.category_id
      LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
      WHERE oi.order_id = $1;
    `;

    const statusHistoryQuery = `
      SELECT status, updated_at
      FROM "StatusHistory"
      WHERE entity_type = 'order' AND entity_id = $1
      ORDER BY updated_at ASC;
    `;

    const [orderResult, itemsResult, statusHistoryResult] = await Promise.all([
      pool.query(orderQuery, [order_id]),
      pool.query(itemsQuery, [order_id]),
      pool.query(statusHistoryQuery, [order_id]),
    ]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderResult.rows[0];
    const items = itemsResult.rows.map(item => ({ ...item, image: item.image || '/api/placeholder/80/80' }));
    const statusHistory = statusHistoryResult.rows;

    // Process status history into the format the frontend expects
    const tracking_info = {
      ordered_at: null,
      confirmed_at: null,
      preparing_at: null,
      out_for_delivery_at: null,
      delivered_at: null,
    };
    statusHistory.forEach(s => {
      const key = `${s.status}_at`;
      if (key in tracking_info) {
        tracking_info[key] = s.updated_at;
      }
    });
    if (!tracking_info.ordered_at) {
      const createdStatus = statusHistory.find(s => s.status === 'pending' || s.status === 'created');
      if (createdStatus) {
        tracking_info.ordered_at = createdStatus.updated_at;
      } else {
        tracking_info.ordered_at = order.order_date;
      }
    }


    // Determine if reviews can be left
    const can_review_products = order.status === 'delivered';
    const can_review_delivery = order.status === 'delivered' && order.delivery_boy_id;

    const delivery_boy = order.delivery_boy_id ? {
      name: `${order.db_first_name || ''} ${order.db_last_name || ''}`.trim(),
      phone: order.db_phone,
      email: order.db_email,
      rating: parseFloat(order.db_rating).toFixed(1),
      total_deliveries: parseInt(order.db_total_deliveries, 10),
    } : null;

    const responseData = {
      ...order,
      order_id: `ORD-${String(order.order_id).padStart(6, '0')}`,
      items,
      tracking_info,
      delivery_boy,
      can_review_products,
      can_review_delivery,
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: error.message
    });
  }
};

// Update order status
export const updateOrderStatusHandler = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { order_id } = req.params;
    const { status, updated_by } = req.body;

    // Validate inputs
    if (!order_id || isNaN(order_id)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Valid order ID is required'
      });
    }

    if (!status) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Check if order exists
    const orderExistsQuery = `
      SELECT order_id FROM "Order" WHERE order_id = $1;
    `;
    const orderExistsResult = await client.query(orderExistsQuery, [order_id]);

    if (orderExistsResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if this status already exists for this order
    const statusExistsQuery = `
      SELECT entity_id FROM "StatusHistory" 
      WHERE entity_type = 'order' AND entity_id = $1 AND status = $2;
    `;
    const statusExistsResult = await client.query(statusExistsQuery, [order_id, status]);

    if (statusExistsResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'This status has already been set for this order'
      });
    }

    // Update order payment status if it's a payment-related status
    if (['paid', 'failed', 'refunded'].includes(status)) {
      const updateOrderQuery = `
        UPDATE "Order"
        SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE order_id = $2;
      `;
      await client.query(updateOrderQuery, [status, order_id]);
    }

    // Add to order status history using consolidated approach
    await updateOrderStatus(order_id, status, updated_by, 'Order status updated', client);

    // Update delivery boy availability if order is delivered or cancelled
    if (['delivered', 'cancelled'].includes(status)) {
      const updateDeliveryBoyQuery = `
        UPDATE "DeliveryBoy"
        SET current_load = GREATEST(current_load - 1, 0)
        WHERE user_id = (
          SELECT delivery_boy_id FROM "Delivery" WHERE order_id = $1
        );
      `;
      await client.query(updateDeliveryBoyQuery, [order_id]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { order_id } = req.params;
    const { cancelled_by, reason } = req.body;

    // Validate inputs
    if (!order_id || isNaN(order_id)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Valid order ID is required'
      });
    }

    // Check if order exists and can be cancelled
    const orderQuery = `
      SELECT o.order_id, o.payment_status, o.user_id,
             COALESCE(latest_status.status, 'pending') as current_status
      FROM "Order" o
      LEFT JOIN (
        SELECT DISTINCT ON (entity_id) entity_id as order_id, status
        FROM "StatusHistory"
        WHERE entity_type = 'order'
        ORDER BY entity_id, updated_at DESC
      ) latest_status ON o.order_id = latest_status.order_id
      WHERE o.order_id = $1;
    `;
    const orderResult = await client.query(orderQuery, [order_id]);

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = orderResult.rows[0];

    // Check if order can be cancelled
    const nonCancellableStatuses = ['delivered', 'cancelled', 'refunded'];
    if (nonCancellableStatuses.includes(order.current_status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${order.current_status}`
      });
    }

    // Get order items to restore stock
    const orderItemsQuery = `
      SELECT product_id, quantity FROM "OrderItem" WHERE order_id = $1;
    `;
    const orderItemsResult = await client.query(orderItemsQuery, [order_id]);

    // Restore product quantities
    for (const item of orderItemsResult.rows) {
      const restoreStockQuery = `
        UPDATE "Product"
        SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = $2;
      `;
      await client.query(restoreStockQuery, [item.quantity, item.product_id]);
    }

    // Update order status to cancelled using consolidated approach
    await updateOrderStatus(order_id, 'cancelled', cancelled_by, `Order cancelled. Reason: ${cancellation_reason}`, client);

    // Update delivery boy availability
    const updateDeliveryBoyQuery = `
      UPDATE "DeliveryBoy"
      SET current_load = GREATEST(current_load - 1, 0)
      WHERE user_id = (
        SELECT delivery_boy_id FROM "Delivery" WHERE order_id = $1
      );
    `;
    await client.query(updateDeliveryBoyQuery, [order_id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling order',
      error: error.message
    });
  } finally {
    client.release();
  }
};

// Assign delivery boy to order
export const assignDeliveryBoy = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { order_id } = req.params;
    const { delivery_boy_id } = req.body;

    // Validate inputs
    if (!order_id || isNaN(order_id)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Valid order ID is required'
      });
    }

    if (!delivery_boy_id || isNaN(delivery_boy_id)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Valid delivery boy ID is required'
      });
    }

    // Check if delivery boy exists and is available
    const deliveryBoyQuery = `
      SELECT user_id, availability_status, current_load, delivery_region_id
      FROM "DeliveryBoy"
      WHERE user_id = $1;
    `;
    const deliveryBoyResult = await client.query(deliveryBoyQuery, [delivery_boy_id]);

    if (deliveryBoyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Delivery boy not found'
      });
    }

    const deliveryBoy = deliveryBoyResult.rows[0];

    if (deliveryBoy.availability_status !== 'available') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Delivery boy is not available'
      });
    }

    // Check if delivery record exists
    const deliveryQuery = `
      SELECT delivery_id, delivery_boy_id FROM "Delivery" WHERE order_id = $1;
    `;
    const deliveryResult = await client.query(deliveryQuery, [order_id]);

    if (deliveryResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Delivery record not found for this order'
      });
    }

    const delivery = deliveryResult.rows[0];

    // If there's already a delivery boy assigned, decrease their load
    if (delivery.delivery_boy_id) {
      const decreaseLoadQuery = `
        UPDATE "DeliveryBoy"
        SET current_load = GREATEST(current_load - 1, 0)
        WHERE user_id = $1;
      `;
      await client.query(decreaseLoadQuery, [delivery.delivery_boy_id]);
    }

    // Update delivery record with new delivery boy
    const updateDeliveryQuery = `
      UPDATE "Delivery"
      SET delivery_boy_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = $2;
    `;
    await client.query(updateDeliveryQuery, [delivery_boy_id, order_id]);

    // Increase new delivery boy's load
    const increaseLoadQuery = `
      UPDATE "DeliveryBoy"
      SET current_load = current_load + 1
      WHERE user_id = $1;
    `;
    await client.query(increaseLoadQuery, [delivery_boy_id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Delivery boy assigned successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error assigning delivery boy:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning delivery boy',
      error: error.message
    });
  } finally {
    client.release();
  }
};