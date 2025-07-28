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
        p.quantity,
        p.unit_measure,
        p.origin,
        p.description,
        p.is_available,
        p.is_refundable,
        c.name AS category_name,
        pi.image_url,
        COALESCE(AVG(r.rating), 4.0) AS avg_rating,
        COALESCE(COUNT(r.review_id), 0) AS review_count,
        p.created_at
      FROM "Product" p
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
      LEFT JOIN "Review" r ON p.product_id = r.product_id
      WHERE p.is_available = true
      GROUP BY p.product_id, p.name, p.price, p.quantity, p.unit_measure, p.origin, 
               p.description, p.is_available, p.is_refundable, c.name, pi.image_url, p.created_at
    `;

    // Get most popular products (based on review count and rating)
    const mostPopularQuery = `
      ${baseQuery}
      ORDER BY COALESCE(AVG(r.rating), 4.0) DESC, COALESCE(COUNT(r.review_id), 0) DESC
    `;

    // Get fresh vegetables (Fresh From Farm section)
    const freshFromFarmQuery = `
      ${baseQuery}
      HAVING LOWER(c.name) LIKE '%vegetable%' OR LOWER(c.name) LIKE '%fresh%' OR LOWER(c.name) LIKE '%organic%'
      ORDER BY p.created_at DESC
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
    `;

    // Get dairy and milk products
    const dairyAndMeatQuery = `
      ${baseQuery}
      HAVING LOWER(c.name) LIKE '%dairy%' OR LOWER(c.name) LIKE '%milk%' OR 
             LOWER(c.name) LIKE '%cheese%' OR LOWER(c.name) LIKE '%yogurt%'
      ORDER BY price ASC
    `;

    // Get meat products for deals section
    const dealsCantMissQuery = `
      ${baseQuery}
      HAVING LOWER(c.name) LIKE '%meat%' OR LOWER(c.name) LIKE '%chicken%' OR 
             LOWER(c.name) LIKE '%beef%' OR LOWER(c.name) LIKE '%fish%' OR
             LOWER(c.name) LIKE '%seafood%'
      ORDER BY price DESC
    `;

    // Get beverages
    const beveragesQuery = `
      ${baseQuery}
      HAVING LOWER(c.name) LIKE '%beverage%' OR LOWER(c.name) LIKE '%drink%' OR 
             LOWER(c.name) LIKE '%juice%' OR LOWER(c.name) LIKE '%water%'
      ORDER BY COALESCE(AVG(r.rating), 4.0) DESC
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
        quantity,
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
    `;

    const fallbackProducts = await getProductsWithDetails(fallbackQuery);

    // Prepare response data - remove created_at and transform review data for consistency
    const cleanupProducts = (products) =>
      products.map(({ created_at, avg_rating, review_count, ...product }) => ({
        ...product,
        // Transform for ProductCard compatibility
        id: product.product_id,
        name: product.product_name,
        unit: product.unit_measure,
        image: product.image_url, // For backward compatibility
        // Transform review data to match ProductCard expectations
        rating: parseFloat(avg_rating) || 0,
        reviews: parseInt(review_count) || 0,
        // Keep original fields for backward compatibility
        avg_rating: parseFloat(avg_rating) || 0,
        review_count: parseInt(review_count) || 0
      }));

    const homepageData = {
      mostPopular: cleanupProducts(mostPopular.length > 0 ? mostPopular : fallbackProducts.slice(0, 20)),
      freshFromFarm: cleanupProducts(freshFromFarm.length > 0 ? freshFromFarm : fallbackProducts.slice(0, 20)),
      trendingNow: cleanupProducts(trendingNow.length > 0 ? trendingNow : fallbackProducts.slice(0, 20)),
      dairyAndMeatProducts: cleanupProducts(dairyAndMeatProducts.length > 0 ? dairyAndMeatProducts : fallbackProducts.slice(0, 20)),
      dealsCantMiss: cleanupProducts(dealsCantMiss.length > 0 ? dealsCantMiss : fallbackProducts.slice(0, 20)),
      beverages: cleanupProducts(beverages.length > 0 ? beverages : fallbackProducts.slice(0, 20))
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

// Get products by section/category with pagination and filtering
export const getProductsBySection = async (req, res) => {
  try {
    const {
      section,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'ASC',
      minPrice,
      maxPrice,
      category,
      search
    } = req.query;

    const offset = (page - 1) * limit;

    // Validate sort parameters
    const validSortFields = ['name', 'price', 'rating', 'created_at'];
    const validSortOrders = ['ASC', 'DESC'];

    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const sortDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';

    // Base query
    let baseQuery = `
      SELECT DISTINCT
        p.product_id,
        p.name AS product_name,
        p.price,
        p.quantity,
        p.unit_measure,
        p.origin,
        p.description,
        p.is_available,
        p.is_refundable,
        c.name AS category_name,
        pi.image_url,
        COALESCE(AVG(r.rating), 4.0) AS avg_rating,
        COALESCE(COUNT(r.review_id), 0) AS review_count
      FROM "Product" p
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
      LEFT JOIN "Review" r ON p.product_id = r.product_id
      WHERE p.is_available = true
    `;

    let havingClause = '';
    const queryParams = [];
    let paramIndex = 1;

    // Add section-specific filters
    if (section) {
      switch (section.toLowerCase()) {
        case 'mostpopular':
          havingClause = '';
          break;
        case 'freshfromfarm':
          havingClause = `HAVING LOWER(c.name) LIKE '%vegetable%' OR LOWER(c.name) LIKE '%fresh%' OR LOWER(c.name) LIKE '%organic%'`;
          break;
        case 'trendingnow':
          havingClause = `HAVING LOWER(c.name) LIKE '%fruit%' OR LOWER(c.name) LIKE '%berry%'`;
          break;
        case 'dairyandmeatproducts':
          havingClause = `HAVING LOWER(c.name) LIKE '%dairy%' OR LOWER(c.name) LIKE '%milk%' OR LOWER(c.name) LIKE '%cheese%' OR LOWER(c.name) LIKE '%yogurt%'`;
          break;
        case 'dealscantmiss':
          havingClause = `HAVING LOWER(c.name) LIKE '%meat%' OR LOWER(c.name) LIKE '%chicken%' OR LOWER(c.name) LIKE '%beef%' OR LOWER(c.name) LIKE '%fish%' OR LOWER(c.name) LIKE '%seafood%'`;
          break;
        case 'beverages':
          havingClause = `HAVING LOWER(c.name) LIKE '%beverage%' OR LOWER(c.name) LIKE '%drink%' OR LOWER(c.name) LIKE '%juice%' OR LOWER(c.name) LIKE '%water%'`;
          break;
      }
    }

    // Add search filter
    if (search) {
      baseQuery += ` AND (LOWER(p.name) LIKE $${paramIndex} OR LOWER(p.description) LIKE $${paramIndex})`;
      queryParams.push(`%${search.toLowerCase()}%`);
      paramIndex++;
    }

    // Add category filter
    if (category) {
      baseQuery += ` AND LOWER(c.name) = $${paramIndex}`;
      queryParams.push(category.toLowerCase());
      paramIndex++;
    }

    // Add price range filters
    if (minPrice) {
      baseQuery += ` AND p.price >= $${paramIndex}`;
      queryParams.push(parseFloat(minPrice));
      paramIndex++;
    }

    if (maxPrice) {
      baseQuery += ` AND p.price <= $${paramIndex}`;
      queryParams.push(parseFloat(maxPrice));
      paramIndex++;
    }

    // Complete the query
    baseQuery += `
      GROUP BY p.product_id, p.name, p.price, p.quantity, p.unit_measure, p.origin, 
               p.description, p.is_available, p.is_refundable, c.name, pi.image_url
      ${havingClause}
    `;

    // Add sorting
    let orderByClause = '';
    switch (sortField) {
      case 'price':
        orderByClause = `ORDER BY p.price ${sortDirection}`;
        break;
      case 'rating':
        orderByClause = `ORDER BY COALESCE(AVG(r.rating), 4.0) ${sortDirection}`;
        break;
      case 'created_at':
        orderByClause = `ORDER BY p.created_at ${sortDirection}`;
        break;
      default:
        orderByClause = `ORDER BY p.name ${sortDirection}`;
    }

    baseQuery += ` ${orderByClause}`;

    // Add pagination
    baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(DISTINCT p.product_id) as total
      FROM "Product" p
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      LEFT JOIN "Review" r ON p.product_id = r.product_id
      WHERE p.is_available = true
    `;

    let countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (LOWER(p.name) LIKE $${countParamIndex} OR LOWER(p.description) LIKE $${countParamIndex})`;
      countParams.push(`%${search.toLowerCase()}%`);
      countParamIndex++;
    }

    if (category) {
      countQuery += ` AND LOWER(c.name) = $${countParamIndex}`;
      countParams.push(category.toLowerCase());
      countParamIndex++;
    }

    if (minPrice) {
      countQuery += ` AND p.price >= $${countParamIndex}`;
      countParams.push(parseFloat(minPrice));
      countParamIndex++;
    }

    if (maxPrice) {
      countQuery += ` AND p.price <= $${countParamIndex}`;
      countParams.push(parseFloat(maxPrice));
      countParamIndex++;
    }

    // Execute queries
    const [products, countResult] = await Promise.all([
      getProductsWithDetails(baseQuery, queryParams),
      getProductsWithDetails(countQuery, countParams)
    ]);

    // Transform products for consistency
    const transformedProducts = products.map(({ avg_rating, review_count, ...product }) => ({
      ...product,
      // Transform review data to match ProductCard expectations
      rating: parseFloat(avg_rating) || 0,
      reviews: parseInt(review_count) || 0,
      // Keep original fields for backward compatibility
      avg_rating: parseFloat(avg_rating) || 0,
      review_count: parseInt(review_count) || 0
    }));

    const total = parseInt(countResult[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      data: {
        products: transformedProducts,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        filters: {
          section,
          sortBy: sortField,
          sortOrder: sortDirection,
          minPrice,
          maxPrice,
          category,
          search
        }
      }
    });

  } catch (error) {
    console.error('Error fetching products by section:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get all available categories
export const getCategories = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT
        c.category_id,
        c.name AS category_name,
        c.description,
        COUNT(p.product_id) as product_count
      FROM "Category" c
      LEFT JOIN "Product" p ON c.category_id = p.category_id AND p.is_available = true
      GROUP BY c.category_id, c.name, c.description
      HAVING COUNT(p.product_id) > 0
      ORDER BY c.name ASC
    `;

    const categories = await getProductsWithDetails(query);

    res.status(200).json({
      success: true,
      message: 'Categories fetched successfully',
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get product details by ID
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const query = `
      SELECT DISTINCT
        p.product_id,
        p.name AS product_name,
        p.price,
        p.quantity,
        p.unit_measure,
        p.origin,
        p.description,
        p.is_available,
        p.is_refundable,
        c.name AS category_name,
        c.category_id,
        COALESCE(AVG(r.rating), 4.0) AS avg_rating,
        COALESCE(COUNT(r.review_id), 0) AS review_count,
        p.created_at,
        p.total_available_stock
      FROM "Product" p
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      LEFT JOIN "Review" r ON p.product_id = r.product_id
      WHERE p.product_id = $1 AND p.is_available = true
      GROUP BY p.product_id, p.name, p.price, p.quantity, p.unit_measure, p.origin, 
               p.description, p.is_available, p.is_refundable, c.name, c.category_id, p.created_at, p.total_available_stock
    `;

    const products = await getProductsWithDetails(query, [productId]);

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get all images for this product
    const imageQuery = `
      SELECT image_url, is_primary
      FROM "ProductImage"
      WHERE product_id = $1
      ORDER BY is_primary DESC, image_id ASC
    `;

    const images = await getProductsWithDetails(imageQuery, [productId]);

    // Get recent reviews
    const reviewQuery = `
      SELECT 
        r.review_id as id,
        r.rating,
        r.comment,
        r.review_date as date,
        u.username AS user_name,
        true as verified
      FROM "Review" r
      LEFT JOIN "User" u ON r.user_id = u.user_id
      WHERE r.product_id = $1
      ORDER BY r.review_date DESC
      LIMIT 10
    `;

    const reviews = await getProductsWithDetails(reviewQuery, [productId]);

    const product = products[0];
    const { created_at, ...productData } = product;

    res.status(200).json({
      success: true,
      message: 'Product details fetched successfully',
      data: {
        ...productData,
        images,
        reviews
      }
    });

  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const {
      q: searchTerm,
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      category,
      minPrice,
      maxPrice
    } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Search term is required'
      });
    }

    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT DISTINCT
        p.product_id,
        p.name AS product_name,
        p.price,
        p.quantity,
        p.unit_measure,
        p.origin,
        p.description,
        p.is_available,
        p.is_refundable,
        c.name AS category_name,
        pi.image_url,
        COALESCE(AVG(r.rating), 4.0) AS avg_rating,
        COALESCE(COUNT(r.review_id), 0) AS review_count,
        -- Calculate relevance score
        CASE 
          WHEN LOWER(p.name) LIKE $1 THEN 100
          WHEN LOWER(p.name) LIKE $2 THEN 75
          WHEN LOWER(p.description) LIKE $2 THEN 50
          WHEN LOWER(c.name) LIKE $2 THEN 25
          ELSE 10
        END AS relevance_score
      FROM "Product" p
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
      LEFT JOIN "Review" r ON p.product_id = r.product_id
      WHERE p.is_available = true
      AND (
        LOWER(p.name) LIKE $2 OR 
        LOWER(p.description) LIKE $2 OR 
        LOWER(c.name) LIKE $2
      )
    `;

    const queryParams = [`%${searchTerm.toLowerCase()}%`, `%${searchTerm.toLowerCase()}%`];
    let paramIndex = 3;

    // Add filters
    if (category) {
      baseQuery += ` AND LOWER(c.name) = $${paramIndex}`;
      queryParams.push(category.toLowerCase());
      paramIndex++;
    }

    if (minPrice) {
      baseQuery += ` AND p.price >= $${paramIndex}`;
      queryParams.push(parseFloat(minPrice));
      paramIndex++;
    }

    if (maxPrice) {
      baseQuery += ` AND p.price <= $${paramIndex}`;
      queryParams.push(parseFloat(maxPrice));
      paramIndex++;
    }

    baseQuery += `
      GROUP BY p.product_id, p.name, p.price, p.quantity, p.unit_measure, p.origin, 
               p.description, p.is_available, p.is_refundable, c.name, pi.image_url
    `;

    // Add sorting
    let orderByClause = '';
    switch (sortBy) {
      case 'price_low':
        orderByClause = 'ORDER BY p.price ASC';
        break;
      case 'price_high':
        orderByClause = 'ORDER BY p.price DESC';
        break;
      case 'rating':
        orderByClause = 'ORDER BY COALESCE(AVG(r.rating), 4.0) DESC';
        break;
      case 'newest':
        orderByClause = 'ORDER BY p.created_at DESC';
        break;
      default:
        orderByClause = 'ORDER BY relevance_score DESC, COALESCE(AVG(r.rating), 4.0) DESC';
    }

    baseQuery += ` ${orderByClause}`;
    baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT p.product_id) as total
      FROM "Product" p
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      WHERE p.is_available = true
      AND (
        LOWER(p.name) LIKE $1 OR 
        LOWER(p.description) LIKE $1 OR 
        LOWER(c.name) LIKE $1
      )
    `;

    let countParams = [`%${searchTerm.toLowerCase()}%`];
    let countParamIndex = 2;

    if (category) {
      countQuery += ` AND LOWER(c.name) = $${countParamIndex}`;
      countParams.push(category.toLowerCase());
      countParamIndex++;
    }

    if (minPrice) {
      countQuery += ` AND p.price >= $${countParamIndex}`;
      countParams.push(parseFloat(minPrice));
      countParamIndex++;
    }

    if (maxPrice) {
      countQuery += ` AND p.price <= $${countParamIndex}`;
      countParams.push(parseFloat(maxPrice));
      countParamIndex++;
    }

    // Execute queries
    const [products, countResult] = await Promise.all([
      getProductsWithDetails(baseQuery, queryParams),
      getProductsWithDetails(countQuery, countParams)
    ]);

    const total = parseInt(countResult[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: 'Search results fetched successfully',
      data: {
        products: products.map(({ relevance_score, ...product }) => product),
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        },
        searchTerm,
        filters: {
          sortBy,
          category,
          minPrice,
          maxPrice
        }
      }
    });

  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};