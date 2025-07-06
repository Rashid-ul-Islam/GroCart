// favoritesController.js
import pool from '../db.js'; // Adjust path as needed

// Validation helper function
const validateIds = (user_id, product_id) => {
  const userIdNum = parseInt(user_id);
  const productIdNum = parseInt(product_id);
  
  if (isNaN(userIdNum) || userIdNum <= 0) {
    throw new Error('Invalid user_id');
  }
  
  if (isNaN(productIdNum) || productIdNum <= 0) {
    throw new Error('Invalid product_id');
  }
  
  return { userIdNum, productIdNum };
};

// Add product to favorites
export const addFavorite = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    
    // Validate input
    if (!user_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id and product_id are required'
      });
    }

    const { userIdNum, productIdNum } = validateIds(user_id, product_id);

    // Check if the combination already exists
    const checkQuery = `
      SELECT * FROM "FavoriteProducts" 
      WHERE user_id = $1 AND product_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [userIdNum, productIdNum]);

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Product is already in favorites'
      });
    }

    // Insert new favorite
    const insertQuery = `
      INSERT INTO "FavoriteProducts" (user_id, product_id, added_at)
      VALUES ($1, $2, NOW())
      RETURNING *
    `;
    const result = await pool.query(insertQuery, [userIdNum, productIdNum]);

    res.status(201).json({
      success: true,
      message: 'Product added to favorites successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    
    if (error.message === 'Invalid user_id' || error.message === 'Invalid product_id') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Remove product from favorites
export const removeFavorite = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    
    // Validate input
    if (!user_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id and product_id are required'
      });
    }

    const { userIdNum, productIdNum } = validateIds(user_id, product_id);

    const deleteQuery = `
      DELETE FROM "FavoriteProducts" 
      WHERE user_id = $1 AND product_id = $2
      RETURNING *
    `;
    const result = await pool.query(deleteQuery, [userIdNum, productIdNum]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product removed from favorites successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    
    if (error.message === 'Invalid user_id' || error.message === 'Invalid product_id') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all favorite products for a user
export const getUserFavorites = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }

    const userIdNum = parseInt(user_id);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user_id'
      });
    }

    // Check if ProductImages table exists first
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ProductImages'
      );
    `;
    const tableExists = await pool.query(checkTableQuery);
    const hasProductImages = tableExists.rows[0].exists;

    let query;
    if (hasProductImages) {
      // Query with ProductImages table
      query = `
        SELECT 
          fp.user_id,
          fp.product_id,
          fp.added_at,
          p.name as product_name,
          p.price,
          p.quantity,
          p.unit_measure,
          p.origin,
          p.description,
          p.is_available,
          p.is_refundable,
          pi.image_url,
          c.name,
          COALESCE(AVG(pr.rating), 0) as avg_rating,
          COUNT(pr.review_id) as review_count
        FROM "FavoriteProducts" fp
        JOIN "Product" p ON fp.product_id = p.product_id
        LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
        LEFT JOIN "Category" c ON p.category_id = c.category_id
        LEFT JOIN "Review" pr ON p.product_id = pr.product_id
        WHERE fp.user_id = $1
        GROUP BY 
          fp.user_id, fp.product_id, fp.added_at, p.product_id, 
          p.name, p.price, p.unit_measure,p.quantity, p.origin, p.description,
          p.is_available, p.is_refundable, pi.image_url, c.name
        ORDER BY fp.added_at DESC
      `;
    } else {
      // Query without ProductImages table (using image_url from Product table if it exists)
      query = `
        SELECT 
          fp.user_id,
          fp.product_id,
          fp.added_at,
          p.name as product_name,
          p.price,
          p.quantity,
          p.unit_measure,
          p.origin,
          p.description,
          p.is_available,
          p.is_refundable,
          pi.image_url,
          c.name,
          COALESCE(AVG(pr.rating), 0) as avg_rating,
          COUNT(pr.review_id) as review_count
        FROM "FavoriteProducts" fp
        JOIN "Product" p ON fp.product_id = p.product_id
        LEFT JOIN "Category" c ON p.category_id = c.category_id
        LEFT JOIN "Review" pr ON p.product_id = pr.product_id
        LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
        WHERE fp.user_id = $1
        GROUP BY 
          fp.user_id, fp.product_id, fp.added_at, p.product_id, 
          p.name, p.price,p.quantity, p.unit_measure, p.origin, p.description,
          p.is_available, p.is_refundable, pi.image_url, c.name
        ORDER BY fp.added_at DESC
      `;
    }

    const result = await pool.query(query, [userIdNum]);

    // Transform the data to match frontend expectations
    const favorites = result.rows.map(row => ({
      id: row.product_id,
      name: row.product_name,
      price: row.price,
      quantity: row.quantity || 1,
      unit: row.unit_measure || 'kg',
      origin: row.origin || 'Local',
      description: row.description,
      image: row.image_url || 'https://via.placeholder.com/300x200',
      isAvailable: row.is_available,
      isRefundable: row.is_refundable,
      rating: parseFloat(row.avg_rating) || 4,
      reviews: parseInt(row.review_count) || 0,
      category: row.category_name,
      addedAt: row.added_at
    }));

    res.status(200).json({
      success: true,
      message: 'Favorites retrieved successfully',
      data: favorites
    });
  } catch (error) {
    console.error('Error getting user favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Check if a product is in user's favorites
export const checkFavorite = async (req, res) => {
  try {
    const { user_id, product_id } = req.params;
    
    // Validate input
    if (!user_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id and product_id are required'
      });
    }

    // Check for undefined values specifically
    if (user_id === 'undefined' || product_id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'user_id and product_id cannot be undefined'
      });
    }

    const { userIdNum, productIdNum } = validateIds(user_id, product_id);

    const query = `
      SELECT * FROM "FavoriteProducts" 
      WHERE user_id = $1 AND product_id = $2
    `;
    const result = await pool.query(query, [userIdNum, productIdNum]);

    res.status(200).json({
      success: true,
      isFavorite: result.rows.length > 0,
      data: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error checking favorite:', error);
    
    if (error.message === 'Invalid user_id' || error.message === 'Invalid product_id') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get favorite products count for a user
export const getFavoritesCount = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }

    const userIdNum = parseInt(user_id);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user_id'
      });
    }

    const query = `
      SELECT COUNT(*) as count 
      FROM "FavoriteProducts" 
      WHERE user_id = $1
    `;
    const result = await pool.query(query, [userIdNum]);

    res.status(200).json({
      success: true,
      count: parseInt(result.rows[0].count) || 0
    });
  } catch (error) {
    console.error('Error getting favorites count:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Toggle favorite status (add if not exists, remove if exists)
export const toggleFavorite = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;
    
    // Validate input
    if (!user_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id and product_id are required'
      });
    }

    const { userIdNum, productIdNum } = validateIds(user_id, product_id);

    // Check if the combination already exists
    const checkQuery = `
      SELECT * FROM "FavoriteProducts" 
      WHERE user_id = $1 AND product_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [userIdNum, productIdNum]);

    if (checkResult.rows.length > 0) {
      // Remove from favorites
      const deleteQuery = `
        DELETE FROM "FavoriteProducts" 
        WHERE user_id = $1 AND product_id = $2
        RETURNING *
      `;
      const deleteResult = await pool.query(deleteQuery, [userIdNum, productIdNum]);

      res.status(200).json({
        success: true,
        message: 'Product removed from favorites',
        action: 'removed',
        isFavorite: false,
        data: deleteResult.rows[0]
      });
    } else {
      // Add to favorites
      const insertQuery = `
        INSERT INTO "FavoriteProducts" (user_id, product_id, added_at)
        VALUES ($1, $2, NOW())
        RETURNING *
      `;
      const insertResult = await pool.query(insertQuery, [userIdNum, productIdNum]);

      res.status(201).json({
        success: true,
        message: 'Product added to favorites',
        action: 'added',
        isFavorite: true,
        data: insertResult.rows[0]
      });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    
    if (error.message === 'Invalid user_id' || error.message === 'Invalid product_id') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};