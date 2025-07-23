import pool from "../db.js";

export const getProductsByCategory = async (req, res) => {
  const { categoryId } = req.params;

  try {
    const query = `
      SELECT DISTINCT
        p.product_id, 
        p.name AS product_name, 
        p.price, 
        p.quantity, 
        p.unit_measure, 
        p.origin, 
        p.description, 
        p.is_refundable, 
        p.is_available, 
        p.created_at, 
        p.updated_at,
        c.name AS category_name,
        COALESCE(AVG(r.rating), 0.0) AS avg_rating,
        COALESCE(COUNT(r.review_id), 0) AS review_count
      FROM "Product" p
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      LEFT JOIN "Review" r ON p.product_id = r.product_id
      WHERE p.category_id = $1 AND p.is_available = true
      GROUP BY p.product_id, p.name, p.price, p.quantity, p.unit_measure, 
               p.origin, p.description, p.is_refundable, p.is_available, 
               p.created_at, p.updated_at, c.name
      ORDER BY p.name ASC;
    `;

    const { rows } = await pool.query(query, [categoryId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching products by category:", error);
    res.status(500).json({ message: "Failed to fetch products by category" });
  }
};


// Fetch products by category including all child categories (recursive)
export const getProductsByCategoryRecursive = async (req, res) => {
  const { categoryId } = req.params;

  try {
    // Recursive query to get all child categories and their products
    const query = `
      WITH RECURSIVE category_tree AS (
        -- Base case: start with the selected category
        SELECT category_id, parent_id, name
        FROM "Category"
        WHERE category_id = $1
        
        UNION ALL
        
        -- Recursive case: get all child categories
        SELECT c.category_id, c.parent_id, c.name
        FROM "Category" c
        JOIN category_tree ct ON c.parent_id = ct.category_id
      )
      SELECT DISTINCT
        p.product_id, 
        p.name AS product_name, 
        p.price, 
        p.quantity, 
        p.unit_measure, 
        p.origin, 
        p.description, 
        p.is_refundable, 
        p.is_available, 
        p.created_at, 
        p.updated_at,
        pi.image_url, 
        pi.is_primary,
        c.name AS category_name,
        COALESCE(AVG(r.rating), 0.0) AS avg_rating,
        COALESCE(COUNT(r.review_id), 0) AS review_count
      FROM "Product" p
      JOIN "ProductCategory" pc ON p.product_id = pc.product_id
      JOIN category_tree ct ON pc.category_id = ct.category_id
      LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
      LEFT JOIN "Category" c ON pc.category_id = c.category_id
      LEFT JOIN "Review" r ON p.product_id = r.product_id
      WHERE p.is_available = true
      GROUP BY p.product_id, p.name, p.price, p.quantity, p.unit_measure, 
               p.origin, p.description, p.is_refundable, p.is_available, 
               p.created_at, p.updated_at, pi.image_url, pi.is_primary, c.name
      ORDER BY p.name ASC;
    `;

    const { rows } = await pool.query(query, [categoryId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching products by category (recursive):", error);
    res.status(500).json({ message: "Failed to fetch products by category" });
  }
};

export const getAllProducts = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const query = `
      SELECT DISTINCT
        p.product_id, 
        p.name AS product_name, 
        p.price, 
        p.quantity, 
        p.unit_measure, 
        p.origin, 
        p.description, 
        p.is_refundable, 
        p.is_available, 
        p.created_at, 
        p.updated_at,
        pi.image_url, 
        pi.is_primary,
        COALESCE(AVG(r.rating), 0.0) AS avg_rating,
        COALESCE(COUNT(r.review_id), 0) AS review_count
      FROM "Product" p
      LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
      LEFT JOIN "Review" r ON p.product_id = r.product_id
      WHERE p.is_available = true
      GROUP BY p.product_id, p.name, p.price, p.quantity, p.unit_measure, 
               p.origin, p.description, p.is_refundable, p.is_available, 
               p.created_at, p.updated_at, pi.image_url, pi.is_primary
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2;
    `;

    const { rows } = await pool.query(query, [limit, offset]);


    const countQuery = `SELECT COUNT(*) FROM "Product" WHERE is_available = true`;
    const countResult = await pool.query(countQuery);
    const totalProducts = parseInt(countResult.rows[0].count);

    res.status(200).json({
      products: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        hasNext: page * limit < totalProducts,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching all products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

export const getProductById = async (req, res) => {
  const { productId } = req.params;

  try {
    const query = `
      SELECT 
        p.product_id, 
        p.name AS product_name, 
        p.price, 
        p.quantity, 
        p.unit_measure, 
        p.origin, 
        p.description, 
        p.is_refundable, 
        p.is_available, 
        p.created_at, 
        p.updated_at,
        COALESCE(AVG(r.rating), 0.0) AS avg_rating,
        COALESCE(COUNT(r.review_id), 0) AS review_count,
        json_agg(
          json_build_object(
            'image_id', pi.image_id,
            'image_url', pi.image_url,
            'is_primary', pi.is_primary,
            'display_order', pi.display_order
          ) ORDER BY pi.display_order, pi.is_primary DESC
        ) FILTER (WHERE pi.image_id IS NOT NULL) AS images,
        json_agg(
          json_build_object(
            'category_id', c.category_id,
            'category_name', c.name
          )
        ) FILTER (WHERE c.category_id IS NOT NULL) AS categories
      FROM "Product" p
      LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id
      LEFT JOIN "ProductCategory" pc ON p.product_id = pc.product_id
      LEFT JOIN "Category" c ON pc.category_id = c.category_id
      LEFT JOIN "Review" r ON p.product_id = r.product_id
      WHERE p.product_id = $1
      GROUP BY p.product_id, p.name, p.price, p.quantity, p.unit_measure, 
               p.origin, p.description, p.is_refundable, p.is_available, 
               p.created_at, p.updated_at;
    `;

    const { rows } = await pool.query(query, [productId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Error fetching product by ID:", error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

export const searchProducts = async (req, res) => {
  const { query: searchQuery, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const query = `
      SELECT DISTINCT
        p.product_id, 
        p.name AS product_name, 
        p.price, 
        p.quantity, 
        p.unit_measure, 
        p.origin, 
        p.description, 
        p.is_refundable, 
        p.is_available, 
        p.created_at, 
        p.updated_at,
        pi.image_url, 
        pi.is_primary,
        COALESCE(AVG(r.rating), 0.0) AS avg_rating,
        COALESCE(COUNT(r.review_id), 0) AS review_count
      FROM "Product" p
      LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
      LEFT JOIN "Review" r ON p.product_id = r.product_id
      WHERE p.is_available = true 
        AND (p.name ILIKE $1 OR p.description ILIKE $1)
      GROUP BY p.product_id, p.name, p.price, p.quantity, p.unit_measure, 
               p.origin, p.description, p.is_refundable, p.is_available, 
               p.created_at, p.updated_at, pi.image_url, pi.is_primary
      ORDER BY p.name ASC
      LIMIT $2 OFFSET $3;
    `;

    const searchPattern = `%${searchQuery}%`;
    const { rows } = await pool.query(query, [searchPattern, limit, offset]);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ message: "Failed to search products" });
  }
};

export default {
  getProductsByCategory,
  getProductsByCategoryRecursive,
  getAllProducts,
  getProductById,
  searchProducts
};
