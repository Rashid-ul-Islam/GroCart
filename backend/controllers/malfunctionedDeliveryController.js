import pool from '../db.js';

const malfunctionedDeliveryController = {
  // Get all malfunctioned deliveries (late + failed)
  getMalfunctionedDeliveries: async (req, res) => {
    try {
      const query = `
        SELECT 
          d.delivery_id,
          d.order_id,
          d.current_status,
          d.estimated_arrival,
          d.actual_arrival,
          d.created_at,
          d.updated_at,
          d.is_aborted,
          o.total_amount,
          o.payment_method,
          u.first_name || ' ' || u.last_name as customer_name,
          u.phone_number as customer_phone,
          a.address as delivery_address,
          db_user.first_name || ' ' || db_user.last_name as delivery_boy_name,
          db_user.phone_number as delivery_boy_phone,
          dr.name as region_name,
          CASE 
            WHEN d.current_status = 'failed' THEN 'failed'
            WHEN d.estimated_arrival < NOW() AND d.current_status NOT IN ('delivered', 'failed') THEN 'late'
            ELSE 'unknown'
          END as malfunction_type
        FROM "Delivery" d
        INNER JOIN "Order" o ON d.order_id = o.order_id
        INNER JOIN "User" u ON o.user_id = u.user_id
        INNER JOIN "Address" a ON d.address_id = a.address_id
        INNER JOIN "DeliveryBoy" db ON d.delivery_boy_id = db.user_id
        INNER JOIN "User" db_user ON db.user_id = db_user.user_id
        INNER JOIN "DeliveryRegion" dr ON db.delivery_region_id = dr.delivery_region_id
        WHERE 
          (d.current_status = 'failed') OR 
          (d.estimated_arrival < NOW() AND d.current_status NOT IN ('delivered', 'failed'))
        ORDER BY d.created_at DESC
      `;

      const result = await pool.query(query);
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      console.error('Error fetching malfunctioned deliveries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch malfunctioned deliveries',
        error: error.message
      });
    }
  },

  // Get delivery details by ID
  getDeliveryDetails: async (req, res) => {
    try {
      const { deliveryId } = req.params;

      const query = `
        SELECT 
          d.*,
          o.total_amount,
          o.payment_method,
          o.payment_status,
          o.created_at as order_date,
          u.first_name || ' ' || u.last_name as customer_name,
          u.phone_number as customer_phone,
          u.email as customer_email,
          a.address as delivery_address,
          r.name as region_name,
          db_user.first_name || ' ' || db_user.last_name as delivery_boy_name,
          db_user.phone_number as delivery_boy_phone,
          db_user.email as delivery_boy_email,
          dr.name as delivery_region_name,
          CASE 
            WHEN d.current_status = 'failed' THEN 'failed'
            WHEN d.estimated_arrival < NOW() AND d.current_status NOT IN ('delivered', 'failed') THEN 'late'
            ELSE 'unknown'
          END as malfunction_type
        FROM "Delivery" d
        INNER JOIN "Order" o ON d.order_id = o.order_id
        INNER JOIN "User" u ON o.user_id = u.user_id
        INNER JOIN "Address" a ON d.address_id = a.address_id
        INNER JOIN "Region" r ON a.region_id = r.region_id
        INNER JOIN "DeliveryBoy" db ON d.delivery_boy_id = db.user_id
        INNER JOIN "User" db_user ON db.user_id = db_user.user_id
        INNER JOIN "DeliveryRegion" dr ON db.delivery_region_id = dr.delivery_region_id
        WHERE d.delivery_id = $1
      `;

      const result = await pool.query(query, [deliveryId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Delivery not found'
        });
      }

      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      console.error('Error fetching delivery details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch delivery details',
        error: error.message
      });
    }
  },

  // Cancel delivery
  cancelDelivery: async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const { deliveryId } = req.params;
      const { reason } = req.body;

      // Check if delivery exists and can be cancelled
      const checkQuery = `
        SELECT d.*, o.user_id as customer_id 
        FROM "Delivery" d 
        INNER JOIN "Order" o ON d.order_id = o.order_id
        WHERE d.delivery_id = $1 AND d.current_status NOT IN ('delivered', 'cancelled')
      `;
      const checkResult = await client.query(checkQuery, [deliveryId]);

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Delivery not found or cannot be cancelled'
        });
      }

      const delivery = checkResult.rows[0];

      // Update delivery status to cancelled
      const updateQuery = `
        UPDATE "Delivery" 
        SET 
          current_status = 'cancelled',
          is_aborted = true,
          updated_at = NOW()
        WHERE delivery_id = $1
        RETURNING *
      `;
      
      await client.query(updateQuery, [deliveryId]);

      // Update delivery boy's current load
      const updateDeliveryBoyQuery = `
        UPDATE "DeliveryBoy" 
        SET current_load = GREATEST(0, current_load - 1)
        WHERE user_id = $1
      `;
      
      await client.query(updateDeliveryBoyQuery, [delivery.delivery_boy_id]);

      // Add status history
      const statusHistoryQuery = `
        INSERT INTO "StatusHistory" (entity_type, entity_id, status, notes)
        VALUES ('delivery', $1, 'cancelled', $2)
      `;
      
      await client.query(statusHistoryQuery, [deliveryId, reason || 'Cancelled by admin due to malfunction']);

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
        'Delivery Cancelled',
        `Your delivery for order #${delivery.order_id} has been cancelled. We apologize for the inconvenience.`,
        'delivery',
        deliveryId,
        'high'
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Delivery cancelled successfully'
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error cancelling delivery:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel delivery',
        error: error.message
      });
    } finally {
      client.release();
    }
  },

  // Reassign delivery to new delivery boy
  reassignDelivery: async (req, res) => {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const { deliveryId } = req.params;
      const { newDeliveryBoyId, reason, newEstimatedTime, resetIsAborted, updateEstimatedTime } = req.body;

      console.log('Reassign request data:', { newDeliveryBoyId, reason, newEstimatedTime, resetIsAborted, updateEstimatedTime });

      if (!newDeliveryBoyId) {
        return res.status(400).json({
          success: false,
          message: 'New delivery boy ID is required'
        });
      }

      // Check if delivery exists and can be reassigned
      const checkDeliveryQuery = `
        SELECT d.*, o.user_id as customer_id 
        FROM "Delivery" d 
        INNER JOIN "Order" o ON d.order_id = o.order_id
        WHERE d.delivery_id = $1 AND d.current_status NOT IN ('delivered', 'cancelled')
      `;
      const deliveryResult = await client.query(checkDeliveryQuery, [deliveryId]);

      if (deliveryResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Delivery not found or cannot be reassigned'
        });
      }

      const delivery = deliveryResult.rows[0];

      // Check if new delivery boy exists and is available
      const checkDeliveryBoyQuery = `
        SELECT db.*, u.first_name, u.last_name, u.phone_number
        FROM "DeliveryBoy" db
        INNER JOIN "User" u ON db.user_id = u.user_id
        WHERE db.user_id = $1 AND db.availability_status = 'available'
      `;
      const deliveryBoyResult = await client.query(checkDeliveryBoyQuery, [newDeliveryBoyId]);

      if (deliveryBoyResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'New delivery boy not found or not available'
        });
      }

      const newDeliveryBoy = deliveryBoyResult.rows[0];

      // Update old delivery boy's load (decrease)
      await client.query(
        'UPDATE "DeliveryBoy" SET current_load = GREATEST(0, current_load - 1) WHERE user_id = $1',
        [delivery.delivery_boy_id]
      );

      // Update new delivery boy's load (increase)
      await client.query(
        'UPDATE "DeliveryBoy" SET current_load = current_load + 1 WHERE user_id = $1',
        [newDeliveryBoyId]
      );

      // Update delivery with new delivery boy and reset is_aborted flag
      let updateDeliveryQuery;
      let queryParams;

      if (newEstimatedTime && updateEstimatedTime) {
        updateDeliveryQuery = `
          UPDATE "Delivery" 
          SET 
            delivery_boy_id = $1,
            current_status = 'assigned',
            updated_at = NOW(),
            estimated_arrival = $3,
            is_aborted = false
          WHERE delivery_id = $2
          RETURNING *
        `;
        queryParams = [newDeliveryBoyId, deliveryId, newEstimatedTime];
      } else {
        updateDeliveryQuery = `
          UPDATE "Delivery" 
          SET 
            delivery_boy_id = $1,
            current_status = 'assigned',
            updated_at = NOW(),
            estimated_arrival = NOW() + INTERVAL '2 hours',
            is_aborted = false
          WHERE delivery_id = $2
          RETURNING *
        `;
        queryParams = [newDeliveryBoyId, deliveryId];
      }
      
      const updatedDelivery = await client.query(updateDeliveryQuery, queryParams);
      
      console.log('Delivery updated with is_aborted = false:', updatedDelivery.rows[0]);

      // Add status history
      const statusHistoryQuery = `
        INSERT INTO "StatusHistory" (entity_type, entity_id, status, notes)
        VALUES ('delivery', $1, 'reassigned', $2)
      `;
      
      await client.query(statusHistoryQuery, [
        deliveryId, 
        reason || `Reassigned to ${newDeliveryBoy.first_name} ${newDeliveryBoy.last_name} due to malfunction`
      ]);

      // Create notification for customer
      await client.query(`
        INSERT INTO "Notification" (
          user_id, notification_type, title, message, 
          reference_type, reference_id, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        delivery.customer_id,
        'delivery_update',
        'Delivery Reassigned',
        `Your delivery for order #${delivery.order_id} has been reassigned to a new delivery boy. Updated estimated arrival time will be provided shortly.`,
        'delivery',
        deliveryId,
        'medium'
      ]);

      // Create notification for new delivery boy
      await client.query(`
        INSERT INTO "Notification" (
          user_id, notification_type, title, message, 
          reference_type, reference_id, priority
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        newDeliveryBoyId,
        'delivery_update',
        'New Delivery Assignment',
        `You have been assigned a new delivery for order #${delivery.order_id}. Please check delivery details.`,
        'delivery',
        deliveryId,
        'high'
      ]);

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Delivery reassigned successfully',
        data: {
          deliveryId,
          newDeliveryBoy: {
            id: newDeliveryBoy.user_id,
            name: `${newDeliveryBoy.first_name} ${newDeliveryBoy.last_name}`,
            phone: newDeliveryBoy.phone_number
          }
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error reassigning delivery:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to reassign delivery',
        error: error.message
      });
    } finally {
      client.release();
    }
  },

  // Get available delivery boys for reassignment
  getAvailableDeliveryBoys: async (req, res) => {
    try {
      const query = `
        SELECT 
          db.user_id,
          u.first_name || ' ' || u.last_name as name,
          u.phone_number,
          db.current_load,
          db.availability_status,
          dr.name as region_name
        FROM "DeliveryBoy" db
        INNER JOIN "User" u ON db.user_id = u.user_id
        INNER JOIN "DeliveryRegion" dr ON db.delivery_region_id = dr.delivery_region_id
        WHERE db.availability_status = 'available'
        ORDER BY db.current_load ASC, u.first_name
      `;

      const result = await pool.query(query);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching available delivery boys:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available delivery boys',
        error: error.message
      });
    }
  }
};

export default malfunctionedDeliveryController;
