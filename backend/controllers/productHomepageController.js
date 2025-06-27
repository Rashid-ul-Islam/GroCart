import pool from '../db.js';

const getProductsWithDetails = async (query, params = []) => {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export const getProductsForHomepage = async (req, res) => {
  try {
    // Base query to get products with category info, primary image, and review stats
    const baseQuery = `
      SELECT DISTINCT
        p.product_id,
        p.name AS product_name,
        p.price,
        p.unit_measure,
        p.origin,
        p.description,
        p.is_available,
        p.is_refundable,
        c.name AS category_name,
        pi.image_url,
        COALESCE(AVG(r.rating), 4.0) AS avg_rating,
        COUNT(r.review_id) AS review_count,
        p.created_at
      FROM "Product" p
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
      LEFT JOIN "Review" r ON p.product_id = r.product_id AND r.review_status = 'approved'
      WHERE p.is_available = true
      GROUP BY p.product_id, p.name, p.price, p.unit_measure, p.origin, 
               p.description, p.is_available, p.is_refundable, c.name, pi.image_url, p.created_at
    `;

    // Get most popular products (based on review count and rating)
    const mostPopularQuery = `
      ${baseQuery}
      ORDER BY COALESCE(AVG(r.rating), 4.0) DESC, COUNT(r.review_id) DESC
      LIMIT 8
    `;

    // Get fresh vegetables (Fresh From Farm section)
    const freshFromFarmQuery = `
      ${baseQuery}
      HAVING LOWER(c.name) LIKE '%vegetable%' OR LOWER(c.name) LIKE '%fresh%' OR LOWER(c.name) LIKE '%organic%'
      ORDER BY p.created_at DESC
      LIMIT 8
    `;

    // Get fruits (Trending Now section) - using a subquery approach for randomization
    const trendingNowQuery = `
      SELECT 
        product_id,
        product_name,
        price,
        unit_measure,
        origin,
        description,
        is_available,
        is_refundable,
        category_name,
        image_url,
        avg_rating,
        review_count
      FROM (
        ${baseQuery}
        HAVING LOWER(c.name) LIKE '%fruit%' OR LOWER(c.name) LIKE '%berry%'
      ) AS fruits_subquery
      ORDER BY RANDOM()
      LIMIT 8
    `;

    // Get dairy and milk products
    const dairyAndMeatQuery = `
      ${baseQuery}
      HAVING LOWER(c.name) LIKE '%dairy%' OR LOWER(c.name) LIKE '%milk%' OR 
             LOWER(c.name) LIKE '%cheese%' OR LOWER(c.name) LIKE '%yogurt%'
      ORDER BY price ASC
      LIMIT 8
    `;

    // Get meat products for deals section
    const dealsCantMissQuery = `
      ${baseQuery}
      HAVING LOWER(c.name) LIKE '%meat%' OR LOWER(c.name) LIKE '%chicken%' OR 
             LOWER(c.name) LIKE '%beef%' OR LOWER(c.name) LIKE '%fish%' OR
             LOWER(c.name) LIKE '%seafood%'
      ORDER BY price DESC
      LIMIT 8
    `;

    // Get beverages
    const beveragesQuery = `
      ${baseQuery}
      HAVING LOWER(c.name) LIKE '%beverage%' OR LOWER(c.name) LIKE '%drink%' OR 
             LOWER(c.name) LIKE '%juice%' OR LOWER(c.name) LIKE '%water%'
      ORDER BY COALESCE(AVG(r.rating), 4.0) DESC
      LIMIT 8
    `;

    // Execute all queries
    const [
      mostPopular,
      freshFromFarm,
      trendingNow,
      dairyAndMeatProducts,
      dealsCantMiss,
      beverages
    ] = await Promise.all([
      getProductsWithDetails(mostPopularQuery),
      getProductsWithDetails(freshFromFarmQuery),
      getProductsWithDetails(trendingNowQuery),
      getProductsWithDetails(dairyAndMeatQuery),
      getProductsWithDetails(dealsCantMissQuery),
      getProductsWithDetails(beveragesQuery)
    ]);

    // If any section is empty, fill with general products
    const fallbackQuery = `
      SELECT 
        product_id,
        product_name,
        price,
        unit_measure,
        origin,
        description,
        is_available,
        is_refundable,
        category_name,
        image_url,
        avg_rating,
        review_count
      FROM (
        ${baseQuery}
      ) AS fallback_subquery
      ORDER BY RANDOM()
      LIMIT 8
    `;
    
    const fallbackProducts = await getProductsWithDetails(fallbackQuery);

    // Prepare response data - remove created_at from final response
    const cleanupProducts = (products) => 
      products.map(({ created_at, ...product }) => product);

    const homepageData = {
      mostPopular: cleanupProducts(mostPopular.length > 0 ? mostPopular : fallbackProducts.slice(0, 8)),
      freshFromFarm: cleanupProducts(freshFromFarm.length > 0 ? freshFromFarm : fallbackProducts.slice(0, 8)),
      trendingNow: cleanupProducts(trendingNow.length > 0 ? trendingNow : fallbackProducts.slice(0, 8)),
      dairyAndMeatProducts: cleanupProducts(dairyAndMeatProducts.length > 0 ? dairyAndMeatProducts : fallbackProducts.slice(0, 8)),
      dealsCantMiss: cleanupProducts(dealsCantMiss.length > 0 ? dealsCantMiss : fallbackProducts.slice(0, 8)),
      beverages: cleanupProducts(beverages.length > 0 ? beverages : fallbackProducts.slice(0, 8))
    };

    res.status(200).json({
      success: true,
      message: 'Homepage products fetched successfully',
      data: homepageData
    });

  } catch (error) {
    console.error('Error fetching homepage products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch homepage products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};