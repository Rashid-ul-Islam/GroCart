import pool from '../db.js';

export const getWarehouses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT warehouse_id, name, location, contact_info, latitude, longitude, created_at
      FROM "Warehouse"
    `;
    let countQuery = `SELECT COUNT(*) FROM "Warehouse"`;
    let queryParams = [];
    let countParams = [];

    if (search) {
      query += ` WHERE name ILIKE $1 OR location ILIKE $1`;
      countQuery += ` WHERE name ILIKE $1 OR location ILIKE $1`;
      queryParams.push(`%${search}%`);
      countParams.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(limit, offset);

    const [warehousesResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams)
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      warehouses: warehousesResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouses'
    });
  }
};

export const getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT warehouse_id, name, location, contact_info, latitude, longitude, created_at
      FROM "Warehouse"
      WHERE warehouse_id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }
    
    res.status(200).json({
      success: true,
      warehouse: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouse'
    });
  }
};

export const createWarehouse = async (req, res) => {
  try {
    const { name, location, contact_info, latitude, longitude } = req.body;
    
    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Name and location are required'
      });
    }
    
    const query = `
      INSERT INTO "Warehouse" (name, location, contact_info, latitude, longitude, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING warehouse_id, name, location, contact_info, latitude, longitude, created_at
    `;
    
    const values = [
      name,
      location,
      contact_info || null,
      latitude || 0,
      longitude || 0
    ];
    
    const result = await pool.query(query, values);
    
    res.status(201).json({
      success: true,
      warehouse: result.rows[0],
      message: 'Warehouse created successfully'
    });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create warehouse'
    });
  }
};

export const updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, contact_info, latitude, longitude } = req.body;
    
    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Name and location are required'
      });
    }
    
    const query = `
      UPDATE "Warehouse"
      SET name = $1, location = $2, contact_info = $3, latitude = $4, longitude = $5
      WHERE warehouse_id = $6
      RETURNING warehouse_id, name, location, contact_info, latitude, longitude, created_at
    `;
    
    const values = [name, location, contact_info || null, latitude || 0, longitude || 0, id];
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }
    
    res.status(200).json({
      success: true,
      warehouse: result.rows[0],
      message: 'Warehouse updated successfully'
    });
  } catch (error) {
    console.error('Error updating warehouse:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update warehouse'
    });
  }
};

export const deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if warehouse has inventory
    const inventoryCheck = await pool.query(
      'SELECT COUNT(*) FROM "Inventory" WHERE warehouse_id = $1',
      [id]
    );
    
    if (parseInt(inventoryCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete warehouse with existing inventory'
      });
    }
    
    const query = 'DELETE FROM "Warehouse" WHERE warehouse_id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete warehouse'
    });
  }
};

export const getWarehouseStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        COUNT(DISTINCT i.product_id) as total_products,
        COALESCE(SUM(i.quantity_in_stock), 0) as total_items,
        COUNT(CASE WHEN i.quantity_in_stock <= i.reorder_level THEN 1 END) as low_stock_items,
        COALESCE(SUM(p.price * i.quantity_in_stock), 0) as total_value
      FROM "Inventory" i
      LEFT JOIN "Product" p ON i.product_id = p.product_id
      WHERE i.warehouse_id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    res.status(200).json({
      success: true,
      stats: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching warehouse stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch warehouse statistics'
    });
  }
};
