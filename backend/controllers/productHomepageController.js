import express from 'express';
import pool from '../db.js'; 

const router = express.Router();

export const getProductsForHomepage = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12; // Default to 12 products
    
    const query = `
      SELECT 
        p.product_id,
        p.name,
        p.price,
        p.description,
        p.is_available,
        c.name as category_name,
        pi.image_url as primary_image,
        COALESCE(order_stats.total_ordered, 0) as total_ordered,
        COALESCE(review_stats.avg_rating, 0) as avg_rating,
        COALESCE(review_stats.review_count, 0) as review_count
      FROM "Product" p
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
      LEFT JOIN (
        SELECT 
          oi.product_id,
          SUM(oi.quantity) as total_ordered,
          COUNT(DISTINCT oi.order_id) as order_count
        FROM "OrderItem" oi
        JOIN "Order" o ON oi.order_id = o.order_id
        WHERE o.payment_status = 'completed'
        GROUP BY oi.product_id
      ) order_stats ON p.product_id = order_stats.product_id
      LEFT JOIN (
        SELECT 
          r.product_id,
          AVG(r.rating) as avg_rating,
          COUNT(r.review_id) as review_count
        FROM "Review" r
        WHERE r.review_status = 'approved'
        GROUP BY r.product_id
      ) review_stats ON p.product_id = review_stats.product_id
      WHERE p.is_available = true
      ORDER BY 
        COALESCE(order_stats.total_ordered, 0) DESC,
        COALESCE(review_stats.avg_rating, 0) DESC,
        p.created_at DESC
      LIMIT $1;
    `;

    const result = await pool.query(query, [limit]);
    
    const products = result.rows.map(row => ({
      product_id: row.product_id,
      product_name: row.name, 
      name: row.name, 
      price: parseFloat(row.price),
      description: row.description,
      category_name: row.category_name,
      image_url: row.primary_image, 
      primary_image: row.primary_image, 
      total_ordered: parseInt(row.total_ordered),
      avg_rating: parseFloat(row.avg_rating).toFixed(1),
      review_count: parseInt(row.review_count),
      is_available: row.is_available,
      unit_measure: 'kg', 
      origin: 'Local', 
      is_refundable: true 
    }));

    const categorizedProducts = {
      mostPopular: products.slice(0, 5), 
      freshVegetables: products.filter(p => 
        p.category_name && p.category_name.toLowerCase().includes('vegetable')
      ).slice(0, 5),
      freshFruits: products.filter(p => 
        p.category_name && p.category_name.toLowerCase().includes('fruit')
      ).slice(0, 5),
      dairyProducts: products.filter(p => 
        p.category_name && (
          p.category_name.toLowerCase().includes('dairy') ||
          p.category_name.toLowerCase().includes('milk') ||
          p.category_name.toLowerCase().includes('cheese')
        )
      ).slice(0, 5),
      meatProducts: products.filter(p => 
        p.category_name && (
          p.category_name.toLowerCase().includes('meat') ||
          p.category_name.toLowerCase().includes('chicken') ||
          p.category_name.toLowerCase().includes('beef') ||
          p.category_name.toLowerCase().includes('fish')
        )
      ).slice(0, 5),
      beverages: products.filter(p => 
        p.category_name && (
          p.category_name.toLowerCase().includes('beverage') ||
          p.category_name.toLowerCase().includes('drink') ||
          p.category_name.toLowerCase().includes('juice')
        )
      ).slice(0, 5)
    };

    Object.keys(categorizedProducts).forEach(key => {
      if (key !== 'mostPopular' && categorizedProducts[key].length === 0) {
        categorizedProducts[key] = products.slice(0, 5);
      }
    });

    res.json({
      success: true,
      data: categorizedProducts, 
      allProducts: products, 
      count: products.length
    });

  } catch (error) {
    console.error('Error fetching popular products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export default router;