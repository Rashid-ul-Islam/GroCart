import pool from '../db.js';

// Get inventory for a specific warehouse
const getWarehouseInventory = async (req, res) => {
    try {
        const { warehouseId } = req.params;
        const client = await pool.connect();

        const query = `
      SELECT 
        i.inventory_id,
        i.product_id,
        p.name as product_name,
        i.quantity_in_stock,
        i.reorder_level,
        i.last_restock_date,
        p.unit_measure,
        pi.image_url
      FROM "Inventory" i
      JOIN "Product" p ON i.product_id = p.product_id
      LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
      WHERE i.warehouse_id = $1 AND i.quantity_in_stock > 0
      ORDER BY p.name
    `;

        const result = await client.query(query, [warehouseId]);
        client.release();

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching warehouse inventory:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch warehouse inventory'
        });
    }
};

// Get delivery boy's assigned warehouse
const getDeliveryBoyWarehouse = async (req, res) => {
    try {
        const { deliveryBoyId } = req.params;
        const client = await pool.connect();

        const query = `
      SELECT 
        w.warehouse_id,
        w.name as warehouse_name,
        w.location,
        w.contact_info,
        dr.name as delivery_region_name
      FROM "DeliveryBoy" db
      JOIN "DeliveryRegion" dr ON db.delivery_region_id = dr.delivery_region_id
      JOIN "Warehouse" w ON dr.warehouse_id = w.warehouse_id
      WHERE db.user_id = $1
    `;

        const result = await client.query(query, [deliveryBoyId]);
        client.release();

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Delivery boy warehouse assignment not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching delivery boy warehouse:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch warehouse assignment'
        });
    }
};

// Check product availability in warehouse for specific delivery
const checkDeliveryProductAvailability = async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const client = await pool.connect();

        const query = `
      SELECT 
        oi.product_id,
        p.name as product_name,
        oi.quantity as required_quantity,
        i.quantity_in_stock,
        (i.quantity_in_stock >= oi.quantity) as is_available,
        p.unit_measure,
        pi.image_url
      FROM "Delivery" d
      JOIN "Order" o ON d.order_id = o.order_id
      JOIN "OrderItem" oi ON o.order_id = oi.order_id
      JOIN "Product" p ON oi.product_id = p.product_id
      JOIN "DeliveryBoy" db ON d.delivery_boy_id = db.user_id
      JOIN "DeliveryRegion" dr ON db.delivery_region_id = dr.delivery_region_id
      LEFT JOIN "Inventory" i ON p.product_id = i.product_id AND i.warehouse_id = dr.warehouse_id
      LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
      WHERE d.delivery_id = $1
      ORDER BY p.name
    `;

        const result = await client.query(query, [deliveryId]);
        client.release();

        const allAvailable = result.rows.every(item => item.is_available);

        res.json({
            success: true,
            data: {
                items: result.rows,
                allAvailable,
                unavailableCount: result.rows.filter(item => !item.is_available).length
            }
        });
    } catch (error) {
        console.error('Error checking product availability:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check product availability'
        });
    }
};

export {
    getWarehouseInventory,
    getDeliveryBoyWarehouse,
    checkDeliveryProductAvailability
};
