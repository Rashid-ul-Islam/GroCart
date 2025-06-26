import pool from '../db.js';

// ==================== DIVISION OPERATIONS ====================

export const getDivisions = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Division" ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching divisions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDivisionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM "Division" WHERE division_id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Division not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching division:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createDivision = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Division name is required' });
    }

    // Check for duplicate
    const duplicateCheck = await pool.query(
      'SELECT division_id FROM "Division" WHERE LOWER(name) = LOWER($1)',
      [name]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Division already exists' });
    }

    const result = await pool.query(
      'INSERT INTO "Division" (name) VALUES ($1) RETURNING *',
      [name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating division:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateDivision = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Division name is required' });
    }

    const result = await pool.query(
      'UPDATE "Division" SET name = $1 WHERE division_id = $2 RETURNING *',
      [name, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Division not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Division name already exists' });
    }
    console.error('Error updating division:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteDivision = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if division has districts
    const districtCheck = await pool.query(
      'SELECT COUNT(*) FROM "District" WHERE division_id = $1',
      [id]
    );
    
    if (parseInt(districtCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete division with existing districts' 
      });
    }

    const result = await pool.query(
      'DELETE FROM "Division" WHERE division_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Division not found' });
    }
    
    res.json({ message: 'Division deleted successfully' });
  } catch (error) {
    console.error('Error deleting division:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==================== DISTRICT OPERATIONS ====================

export const getDistricts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, div.name as division_name 
      FROM "District" d 
      JOIN "Division" div ON d.division_id = div.division_id 
      ORDER BY div.name, d.name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDistrictsByDivision = async (req, res) => {
  try {
    const { division_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM "District" WHERE division_id = $1 ORDER BY name ASC',
      [division_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching districts by division:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDistrictById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT d.*, div.name as division_name 
      FROM "District" d 
      JOIN "Division" div ON d.division_id = div.division_id 
      WHERE d.district_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'District not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching district:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createDistrict = async (req, res) => {
  try {
    const { name, division_id } = req.body;
    if (!name || !division_id) {
      return res.status(400).json({
        error: 'District name and division_id are required'
      });
    }

    // Verify division exists
    const divisionCheck = await pool.query(
      'SELECT division_id FROM "Division" WHERE division_id = $1',
      [division_id]
    );
    if (divisionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Division not found' });
    }

    // Check for duplicate district in the same division
    const duplicateCheck = await pool.query(
      'SELECT district_id FROM "District" WHERE LOWER(name) = LOWER($1) AND division_id = $2',
      [name, division_id]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'District already exists in this division' });
    }

    const result = await pool.query(
      'INSERT INTO "District" (name, division_id) VALUES ($1, $2) RETURNING *',
      [name, division_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating district:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const updateDistrict = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, division_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'District name is required' });
    }

    let query = 'UPDATE "District" SET name = $1';
    let params = [name];
    
    if (division_id) {
      // Verify division exists
      const divisionCheck = await pool.query(
        'SELECT division_id FROM "Division" WHERE division_id = $1',
        [division_id]
      );
      
      if (divisionCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Division not found' });
      }
      
      query += ', division_id = $2 WHERE district_id = $3 RETURNING *';
      params = [name, division_id, id];
    } else {
      query += ' WHERE district_id = $2 RETURNING *';
      params = [name, id];
    }

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'District not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating district:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteDistrict = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if district has cities
    const cityCheck = await pool.query(
      'SELECT COUNT(*) FROM "City" WHERE district_id = $1',
      [id]
    );
    
    if (parseInt(cityCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete district with existing cities' 
      });
    }

    const result = await pool.query(
      'DELETE FROM "District" WHERE district_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'District not found' });
    }
    
    res.json({ message: 'District deleted successfully' });
  } catch (error) {
    console.error('Error deleting district:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==================== CITY OPERATIONS ====================

export const getCities = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, d.name as district_name, div.name as division_name 
      FROM "City" c 
      JOIN "District" d ON c.district_id = d.district_id 
      JOIN "Division" div ON d.division_id = div.division_id 
      ORDER BY div.name, d.name, c.name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCitiesByDistrict = async (req, res) => {
  try {
    const { district_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM "City" WHERE district_id = $1 ORDER BY name ASC',
      [district_id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cities by district:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCityById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT c.*, d.name as district_name, div.name as division_name 
      FROM "City" c 
      JOIN "District" d ON c.district_id = d.district_id 
      JOIN "Division" div ON d.division_id = div.division_id 
      WHERE c.city_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching city:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCity = async (req, res) => {
  try {
    const { name, district_id } = req.body;
    if (!name || !district_id) {
      return res.status(400).json({
        error: 'City name and district_id are required'
      });
    }

    // Verify district exists
    const districtCheck = await pool.query(
      'SELECT district_id FROM "District" WHERE district_id = $1',
      [district_id]
    );
    if (districtCheck.rows.length === 0) {
      return res.status(404).json({ error: 'District not found' });
    }

    // Check for duplicate city in the same district
    const duplicateCheck = await pool.query(
      'SELECT city_id FROM "City" WHERE LOWER(name) = LOWER($1) AND district_id = $2',
      [name, district_id]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'City already exists in this district' });
    }

    const result = await pool.query(
      'INSERT INTO "City" (name, district_id) VALUES ($1, $2) RETURNING *',
      [name, district_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating city:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, district_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'City name is required' });
    }

    let query = 'UPDATE "City" SET name = $1';
    let params = [name];
    
    if (district_id) {
      // Verify district exists
      const districtCheck = await pool.query(
        'SELECT district_id FROM "District" WHERE district_id = $1',
        [district_id]
      );
      
      if (districtCheck.rows.length === 0) {
        return res.status(404).json({ error: 'District not found' });
      }
      
      query += ', district_id = $2 WHERE city_id = $3 RETURNING *';
      params = [name, district_id, id];
    } else {
      query += ' WHERE city_id = $2 RETURNING *';
      params = [name, id];
    }

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating city:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if city has regions
    const regionCheck = await pool.query(
      'SELECT COUNT(*) FROM "Region" WHERE city_id = $1',
      [id]
    );
    
    if (parseInt(regionCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete city with existing regions' 
      });
    }

    const result = await pool.query(
      'DELETE FROM "City" WHERE city_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }
    
    res.json({ message: 'City deleted successfully' });
  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==================== DELIVERY REGION OPERATIONS ====================

export const getDeliveryRegions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM "DeliveryRegion" 
      ORDER BY name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching delivery regions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDeliveryRegionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM "DeliveryRegion" WHERE delivery_region_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery region not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching delivery region:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createDeliveryRegion = async (req, res) => {
  try {
    const { name, latitude, longitude, warehouse_id } = req.body;
    
    if (!name || !latitude || !longitude || !warehouse_id) {
      return res.status(400).json({ 
        error: 'Name, latitude, longitude, and warehouse_id are required' 
      });
    }

    const result = await pool.query(
      `INSERT INTO "DeliveryRegion" (name, latitude, longitude, warehouse_id, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      [name, latitude, longitude, warehouse_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating delivery region:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateDeliveryRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, warehouse_id } = req.body;
    
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }
    
    if (latitude) {
      updates.push(`latitude = $${paramCount}`);
      params.push(latitude);
      paramCount++;
    }
    
    if (longitude) {
      updates.push(`longitude = $${paramCount}`);
      params.push(longitude);
      paramCount++;
    }
    
    if (warehouse_id) {
      updates.push(`warehouse_id = $${paramCount}`);
      params.push(warehouse_id);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `UPDATE "DeliveryRegion" SET ${updates.join(', ')} WHERE delivery_region_id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery region not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating delivery region:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteDeliveryRegion = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if delivery region has regions
    const regionCheck = await pool.query(
      'SELECT COUNT(*) FROM "Region" WHERE delivery_region_id = $1',
      [id]
    );
    
    if (parseInt(regionCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete delivery region with existing regions' 
      });
    }

    const result = await pool.query(
      'DELETE FROM "DeliveryRegion" WHERE delivery_region_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Delivery region not found' });
    }
    
    res.json({ message: 'Delivery region deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery region:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==================== REGION OPERATIONS ====================

export const getRegions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, c.name as city_name, d.name as district_name, 
             div.name as division_name, dr.name as delivery_region_name
      FROM "Region" r 
      JOIN "City" c ON r.city_id = c.city_id 
      JOIN "District" d ON c.district_id = d.district_id 
      JOIN "Division" div ON d.division_id = div.division_id 
      LEFT JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
      ORDER BY div.name, d.name, c.name, r.name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRegionsByCity = async (req, res) => {
  try {
    const { city_id } = req.params;
    const result = await pool.query(`
      SELECT r.*, dr.name as delivery_region_name
      FROM "Region" r 
      LEFT JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
      WHERE r.city_id = $1 
      ORDER BY r.name ASC
    `, [city_id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching regions by city:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRegionsWithDeliveryInfo = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, c.name as city_name, d.name as district_name, 
             div.name as division_name, dr.name as delivery_region_name,
             dr.latitude, dr.longitude, dr.warehouse_id
      FROM "Region" r 
      JOIN "City" c ON r.city_id = c.city_id 
      JOIN "District" d ON c.district_id = d.district_id 
      JOIN "Division" div ON d.division_id = div.division_id 
      LEFT JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
      ORDER BY dr.name NULLS LAST, div.name, d.name, c.name, r.name ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching regions with delivery info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRegionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT r.*, c.name as city_name, d.name as district_name, 
             div.name as division_name, dr.name as delivery_region_name
      FROM "Region" r 
      JOIN "City" c ON r.city_id = c.city_id 
      JOIN "District" d ON c.district_id = d.district_id 
      JOIN "Division" div ON d.division_id = div.division_id 
      LEFT JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
      WHERE r.region_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Region not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching region:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createRegion = async (req, res) => {
  try {
    const { name, city_id, delivery_region_id } = req.body;
    if (!name || !city_id) {
      return res.status(400).json({
        error: 'Region name and city_id are required'
      });
    }

    // Verify city exists
    const cityCheck = await pool.query(
      'SELECT city_id FROM "City" WHERE city_id = $1',
      [city_id]
    );
    if (cityCheck.rows.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    // Verify delivery region exists if provided
    if (delivery_region_id) {
      const deliveryRegionCheck = await pool.query(
        'SELECT delivery_region_id FROM "DeliveryRegion" WHERE delivery_region_id = $1',
        [delivery_region_id]
      );
      if (deliveryRegionCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Delivery region not found' });
      }
    }

    // Check for duplicate region in the same city
    const duplicateCheck = await pool.query(
      'SELECT region_id FROM "Region" WHERE LOWER(name) = LOWER($1) AND city_id = $2',
      [name, city_id]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Region already exists in this city' });
    }

    const result = await pool.query(
      'INSERT INTO "Region" (name, city_id, delivery_region_id) VALUES ($1, $2, $3) RETURNING *',
      [name, city_id, delivery_region_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating region:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, city_id, delivery_region_id } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Region name is required' });
    }

    let query = 'UPDATE "Region" SET name = $1';
    let params = [name];
    let paramCount = 2;

    if (city_id) {
      // Verify city exists
      const cityCheck = await pool.query(
        'SELECT city_id FROM "City" WHERE city_id = $1',
        [city_id]
      );
      
      if (cityCheck.rows.length === 0) {
        return res.status(404).json({ error: 'City not found' });
      }
      
      query += `, city_id = $${paramCount}`;
      params.push(city_id);
      paramCount++;
    }

    if (delivery_region_id !== undefined) {
      if (delivery_region_id) {
        // Verify delivery region exists
        const deliveryRegionCheck = await pool.query(
          'SELECT delivery_region_id FROM "DeliveryRegion" WHERE delivery_region_id = $1',
          [delivery_region_id]
        );
        
        if (deliveryRegionCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Delivery region not found' });
        }
      }
      
      query += `, delivery_region_id = $${paramCount}`;
      params.push(delivery_region_id || null);
      paramCount++;
    }

    query += ` WHERE region_id = $${paramCount} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Region not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating region:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRegionDeliveryRegion = async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_region_id } = req.body;

    if (delivery_region_id) {
      // Verify delivery region exists
      const deliveryRegionCheck = await pool.query(
        'SELECT delivery_region_id FROM "DeliveryRegion" WHERE delivery_region_id = $1',
        [delivery_region_id]
      );
      
      if (deliveryRegionCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Delivery region not found' });
      }
    }

    const result = await pool.query(
      'UPDATE "Region" SET delivery_region_id = $1 WHERE region_id = $2 RETURNING *',
      [delivery_region_id || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Region not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating region delivery region:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteRegion = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM "Region" WHERE region_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Region not found' });
    }
    
    res.json({ message: 'Region deleted successfully' });
  } catch (error) {
    console.error('Error deleting region:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==================== SEARCH OPERATIONS ====================

export const searchDeliveryRegions = async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const result = await pool.query(`
      SELECT dr.*, 
             ARRAY_AGG(
               JSON_BUILD_OBJECT(
                 'region_id', r.region_id,
                 'region_name', r.name,
                 'city_name', c.name,
                 'district_name', d.name,
                 'division_name', div.name
               )
             ) FILTER (WHERE r.region_id IS NOT NULL) as regions
      FROM "DeliveryRegion" dr
      LEFT JOIN "Region" r ON dr.delivery_region_id = r.delivery_region_id
      LEFT JOIN "City" c ON r.city_id = c.city_id
      LEFT JOIN "District" d ON c.district_id = d.district_id
      LEFT JOIN "Division" div ON d.division_id = div.division_id
      WHERE dr.name ILIKE $1
      GROUP BY dr.delivery_region_id, dr.name, dr.latitude, dr.longitude, dr.warehouse_id, dr.created_at, dr.updated_at
      ORDER BY dr.name ASC
    `, [`%${term}%`]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching delivery regions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchRegions = async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const result = await pool.query(`
      SELECT r.*, c.name as city_name, d.name as district_name, 
             div.name as division_name, dr.name as delivery_region_name,
             dr.delivery_region_id, dr.latitude, dr.longitude, dr.warehouse_id
      FROM "Region" r 
      JOIN "City" c ON r.city_id = c.city_id 
      JOIN "District" d ON c.district_id = d.district_id 
      JOIN "Division" div ON d.division_id = div.division_id 
      LEFT JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
      WHERE r.name ILIKE $1 OR c.name ILIKE $1 OR d.name ILIKE $1 OR div.name ILIKE $1
      ORDER BY div.name, d.name, c.name, r.name ASC
    `, [`%${term}%`]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching regions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ==================== UTILITY OPERATIONS ====================

export const getAddressHierarchy = async (req, res) => {
  try {
    const { region_id } = req.params;
    
    const result = await pool.query(`
      SELECT r.region_id, r.name as region_name,
             c.city_id, c.name as city_name,
             d.district_id, d.name as district_name,
             div.division_id, div.name as division_name,
             dr.delivery_region_id, dr.name as delivery_region_name,
             dr.latitude, dr.longitude, dr.warehouse_id
      FROM "Region" r 
      JOIN "City" c ON r.city_id = c.city_id 
      JOIN "District" d ON c.district_id = d.district_id 
      JOIN "Division" div ON d.division_id = div.division_id 
      LEFT JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
      WHERE r.region_id = $1
    `, [region_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Region not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching address hierarchy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add this new function to your addressController.js
export const getWarehouses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        warehouse_id,
        name,
        location,
        contact_info,
        latitude,
        longitude,
        created_at
      FROM "Warehouse"
      ORDER BY name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

