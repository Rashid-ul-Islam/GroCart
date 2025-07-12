import pool from '../db.js';

export const getInventory = async (req, res) => {
  try {
    const {
      warehouse_id = '',
      product_id = '',
      low_stock = false,
      page = 1,
      limit = 10
    } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        i.inventory_id,
        i.product_id,
        i.warehouse_id,
        i.quantity_in_stock,
        i.reorder_level,
        i.last_restock_date,
        p.name as product_name,
        p.price,
        p.unit_measure,
        w.name as warehouse_name,
        w.location as warehouse_location
      FROM "Inventory" i
      JOIN "Product" p ON i.product_id = p.product_id
      JOIN "Warehouse" w ON i.warehouse_id = w.warehouse_id
    `;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (warehouse_id) {
      paramCount++;
      whereConditions.push(`i.warehouse_id = $${paramCount}`);
      queryParams.push(warehouse_id);
    }

    if (product_id) {
      paramCount++;
      whereConditions.push(`i.product_id = $${paramCount}`);
      queryParams.push(product_id);
    }

    if (low_stock === 'true') {
      whereConditions.push(`i.quantity_in_stock <= i.reorder_level`);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    query += ` ORDER BY i.last_restock_date DESC NULLS LAST`;

    // Add pagination
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(limit);

    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(offset);

    // Count query
    let countQuery = `
      SELECT COUNT(*) as total
      FROM "Inventory" i
      JOIN "Product" p ON i.product_id = p.product_id
      JOIN "Warehouse" w ON i.warehouse_id = w.warehouse_id
    `;

    if (whereConditions.length > 0) {
      countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    const [inventoryResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      inventory: inventoryResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory'
    });
  }
};

export const getInventoryStats = async (req, res) => {
  try {
    const query = `
      SELECT
        (SELECT COUNT(*) FROM "Product") AS totalProducts,
        (SELECT COUNT(*) FROM "Warehouse") AS totalWarehouses,
        (SELECT COUNT(*) FROM "Inventory" i
         WHERE i.quantity_in_stock <= i.reorder_level) AS lowStockCount,
        (SELECT COUNT(*) FROM "Inventory") AS totalInventoryCount,
        (SELECT COALESCE(SUM(p.price * i.quantity_in_stock), 0)
         FROM "Inventory" i
         JOIN "Product" p ON i.product_id = p.product_id) AS totalValue;
    `;

    const result = await pool.query(query);

    res.status(200).json({
      success: true,
      stats: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory statistics'
    });
  }
};


export const getProductInventory = async (req, res) => {
  try {
    const { product_id } = req.params;

    const query = `
      SELECT
        i.inventory_id,
        i.product_id,
        i.warehouse_id,
        i.quantity_in_stock,
        i.reorder_level,
        i.last_restock_date,
        w.name as warehouse_name,
        w.location as warehouse_location,
        p.name as product_name,
        p.unit_measure,
        p.quantity as product_unit_quantity
      FROM "Inventory" i
      JOIN "Warehouse" w ON i.warehouse_id = w.warehouse_id
      JOIN "Product" p ON i.product_id = p.product_id
      WHERE i.product_id = $1
      ORDER BY w.name
    `;

    const result = await pool.query(query, [product_id]);

    // Add color coding for quantity_in_stock (actual stock levels)
    const inventory = result.rows.map(row => {
      let quantityColor = 'green';
      if (row.quantity_in_stock < 20) {
        quantityColor = 'red';
      } else if (row.quantity_in_stock < 100) {
        quantityColor = 'yellow';
      }

      return {
        ...row,
        quantityColor
      };
    });

    res.status(200).json({
      success: true,
      inventory
    });

  } catch (error) {
    console.error('Error fetching product inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product inventory'
    });
  }
};

export const getInventoryTransferLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      order_id = '', 
      product_id = '', 
      warehouse_id = '' 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    let queryParams = [limit, offset];
    let paramCount = 2;
    
    // Add filters if provided
    if (order_id) {
      paramCount++;
      whereConditions.push(`itl.order_id = $${paramCount}`);
      queryParams.push(order_id);
    }
    
    if (product_id) {
      paramCount++;
      whereConditions.push(`itl.product_id = $${paramCount}`);
      queryParams.push(product_id);
    }
    
    if (warehouse_id) {
      paramCount++;
      whereConditions.push(`(itl.source_warehouse_id = $${paramCount} OR itl.target_warehouse_id = $${paramCount})`);
      queryParams.push(warehouse_id);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const query = `
      SELECT
        itl.transfer_id,
        itl.order_id,
        itl.order_item_id,
        itl.product_id,
        p.name as product_name,
        p.unit_measure,
        itl.source_warehouse_id,
        sw.name as source_warehouse_name,
        itl.target_warehouse_id,
        tw.name as target_warehouse_name,
        itl.quantity_transferred,
        itl.source_stock_before,
        itl.source_stock_after,
        itl.target_stock_before,
        itl.target_stock_after,
        itl.transfer_reason,
        itl.transfer_date,
        itl.distance_km,
        itl.created_at
      FROM "InventoryTransferLog" itl
      JOIN "Product" p ON itl.product_id = p.product_id
      JOIN "Warehouse" sw ON itl.source_warehouse_id = sw.warehouse_id
      JOIN "Warehouse" tw ON itl.target_warehouse_id = tw.warehouse_id
      ${whereClause}
      ORDER BY itl.transfer_date DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM "InventoryTransferLog" itl
      JOIN "Product" p ON itl.product_id = p.product_id
      JOIN "Warehouse" sw ON itl.source_warehouse_id = sw.warehouse_id
      JOIN "Warehouse" tw ON itl.target_warehouse_id = tw.warehouse_id
      ${whereClause}
    `;

    const [logsResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(2)) // Remove limit and offset for count
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      logs: logsResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching inventory transfer logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory transfer logs',
    });
  }
};


export const getWarehouseInventory = async (req, res) => {
  try {
    const { warehouse_id } = req.params; // This now matches the route
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT
        i.*,
        p.name as product_name,
        p.price,
        p.unit_measure,
        c.name as category_name
      FROM "Inventory" i
      JOIN "Product" p ON i.product_id = p.product_id
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      WHERE i.warehouse_id = $1
      ORDER BY p.name
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM "Inventory" i
      WHERE i.warehouse_id = $1
    `;

    const [inventoryResult, countResult] = await Promise.all([
      pool.query(query, [warehouse_id, limit, offset]),
      pool.query(countQuery, [warehouse_id])
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      inventory: inventoryResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching warehouse inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouse inventory'
    });
  }
};

export const updateReorderLevel = async (req, res) => {
  try {
    const { inventory_id } = req.params; // This now matches the route
    const { reorder_level } = req.body;

    if (reorder_level === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Reorder level is required'
      });
    }

    const query = `
      UPDATE "Inventory"
      SET reorder_level = $1
      WHERE inventory_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [reorder_level, inventory_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      inventory: result.rows[0],
      message: 'Reorder level updated successfully'
    });
  } catch (error) {
    console.error('Error updating reorder level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reorder level'
    });
  }
};

export const upsertInventory = async (req, res) => {
  try {
    const { product_id, warehouse_id, quantity_in_stock, reorder_level } = req.body;

    if (!product_id || !warehouse_id || quantity_in_stock === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, warehouse ID, and quantity are required'
      });
    }

    const query = `
      INSERT INTO "Inventory" (product_id, warehouse_id, quantity_in_stock, reorder_level, last_restock_date)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (product_id, warehouse_id)
      DO UPDATE SET
        quantity_in_stock = "Inventory".quantity_in_stock + EXCLUDED.quantity_in_stock,
        reorder_level = COALESCE(EXCLUDED.reorder_level, "Inventory".reorder_level),
        last_restock_date = NOW()
      RETURNING *
    `;

    const values = [product_id, warehouse_id, quantity_in_stock, reorder_level || 0];

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      inventory: result.rows[0],
      message: 'Inventory updated successfully'
    });
  } catch (error) {
    console.error('Error upserting inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory'
    });
  }
};



export const restockInventory = async (req, res) => {
  try {
    const { inventory_id } = req.params; // This now matches the route
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update inventory
      const inventoryQuery = `
        UPDATE "Inventory"
        SET quantity_in_stock = quantity_in_stock + $1, last_restock_date = NOW()
        WHERE inventory_id = $2
        RETURNING *,
        (SELECT product_id FROM "Inventory" WHERE inventory_id = $2) as product_id
      `;

      const inventoryResult = await client.query(inventoryQuery, [quantity, inventory_id]);

      if (inventoryResult.rows.length === 0) {
        throw new Error('Inventory item not found');
      }

      // Update product total quantity
      const productQuery = `
        UPDATE "Product"
        SET quantity = quantity + $1, updated_at = NOW()
        WHERE product_id = $2
        RETURNING *
      `;

      await client.query(productQuery, [quantity, inventoryResult.rows[0].product_id]);

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        inventory: inventoryResult.rows[0],
        message: 'Inventory restocked successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error restocking inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restock inventory'
    });
  }
};

export const deleteInventoryItem = async (req, res) => {
  try {
    const { inventory_id } = req.params; // This now matches the route

    const query = 'DELETE FROM "Inventory" WHERE inventory_id = $1 RETURNING *';
    const result = await pool.query(query, [inventory_id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item'
    });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category_id = '',
      min_price = '',
      max_price = '',
      origin = '',
      is_refundable = '',
      is_available = '',
      start_date = '',
      end_date = ''
    } = req.query;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Search
    if (search) {
      whereConditions.push(`p.name ILIKE $${paramIndex}`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Category filter
    if (category_id) {
      whereConditions.push(`p.category_id = $${paramIndex}`);
      queryParams.push(category_id);
      paramIndex++;
    }

    // Price filters
    if (min_price) {
      whereConditions.push(`p.price >= $${paramIndex}`);
      queryParams.push(parseFloat(min_price));
      paramIndex++;
    }
    if (max_price) {
      whereConditions.push(`p.price <= $${paramIndex}`);
      queryParams.push(parseFloat(max_price));
      paramIndex++;
    }

    // Origin filter
    if (origin) {
      whereConditions.push(`p.origin ILIKE $${paramIndex}`);
      queryParams.push(`%${origin}%`);
      paramIndex++;
    }

    // Refundable filter
    if (is_refundable !== '') {
      whereConditions.push(`p.is_refundable = $${paramIndex}`);
      queryParams.push(is_refundable === 'true');
      paramIndex++;
    }

    // Availability filter
    if (is_available !== '') {
      whereConditions.push(`p.is_available = $${paramIndex}`);
      queryParams.push(is_available === 'true');
      paramIndex++;
    }

    // Date filters
    if (start_date) {
      whereConditions.push(`p.created_at >= $${paramIndex}`);
      queryParams.push(start_date);
      paramIndex++;
    }
    if (end_date) {
      whereConditions.push(`p.created_at <= $${paramIndex}`);
      queryParams.push(end_date);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "Product" p
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, queryParams);
    const totalProducts = parseInt(countResult.rows[0].total);

    const offset = (page - 1) * limit;

    // Main query with total_stock
    const productsQuery = `
      SELECT
        p.product_id,
        p.name,
        p.category_id,
        c.name as category_name,
        p.price,
        p.unit_measure,
        p.origin,
        p.description,
        p.is_refundable,
        p.is_available,
        p.created_at,
        p.updated_at,
        COALESCE(SUM(i.quantity_in_stock), 0) as total_stock
      FROM "Product" p
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      LEFT JOIN "Inventory" i ON p.product_id = i.product_id
      ${whereClause}
      GROUP BY p.product_id, c.name, c.category_id
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(parseInt(limit), offset);

    const productsResult = await pool.query(productsQuery, queryParams);

    res.status(200).json({
      products: productsResult.rows,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: parseInt(page),
      hasNextPage: page * limit < totalProducts,
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};




