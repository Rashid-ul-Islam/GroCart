import pool from "../db.js";

export const searchProducts = async (req, res) => {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    if (!query || query.trim() === '') {
        return res.status(400).json({ message: "Search query is required" });
    }

    try {
        const searchQuery = `
      SELECT DISTINCT ON (p.product_id)
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
  c.name AS category_name
FROM "Product" p
LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
LEFT JOIN "Category" c ON p.category_id = c.category_id
WHERE p.is_available = true
  AND (p.name ILIKE $1 OR COALESCE(p.description, '') ILIKE $1 OR COALESCE(p.origin, '') ILIKE $1)
ORDER BY
  p.product_id,  -- required for DISTINCT ON
  CASE
    WHEN p.name ILIKE $2 THEN 1
    WHEN p.name ILIKE $1 THEN 2
    ELSE 3
  END,
  p.name ASC
LIMIT $3 OFFSET $4;

    `;

        const searchPattern = `%${query}%`;
        const exactPattern = `${query}%`;

        const { rows } = await pool.query(searchQuery, [searchPattern, exactPattern, limit, offset]);

        const countQuery = `
      SELECT COUNT(DISTINCT p.product_id) as total
      FROM "Product" p
      WHERE p.is_available = true
        AND (p.name ILIKE $1 OR COALESCE(p.description, '') ILIKE $1 OR COALESCE(p.origin, '') ILIKE $1)
    `;

        const countResult = await pool.query(countQuery, [searchPattern]);
        const totalResults = parseInt(countResult.rows[0].total);

        res.status(200).json({
            products: rows,
            totalResults,
            currentPage: page,
            totalPages: Math.ceil(totalResults / limit),
            hasNext: page * limit < totalResults,
            hasPrev: page > 1
        });
    } catch (error) {
        console.error("Error searching products:", error);
        res.status(500).json({
            message: "Failed to search products",
            error: error.message
        });
    }
};

export const saveSearchHistory = async (req, res) => {
  const { user_id, search_query } = req.body;

  if (!search_query || search_query.trim() === '') {
    return res.status(400).json({ message: "Search query is required" });
  }

  try {
    const insertQuery = `
      INSERT INTO "SearchHistory" (user_id, search_query)
      VALUES ($1, $2)
      RETURNING *;
    `;

    const trimmedQuery = search_query.trim();
    const { rows } = await pool.query(insertQuery, [user_id || null, trimmedQuery]);

    res.status(201).json({
      message: "Search history saved successfully",
      searchHistory: rows[0]
    });
  } catch (error) {
    console.error("Error saving search history:", error);
    res.status(500).json({ 
      message: "Failed to save search history",
      error: error.message 
    });
  }
};
export const getUserSearchHistory = async (req, res) => {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    try {
        const query = `
      SELECT search_id, search_query, search_date
      FROM "SearchHistory"
      WHERE user_id = $1
      ORDER BY search_date DESC
      LIMIT $2;
    `;

        const { rows } = await pool.query(query, [userId, limit]);

        res.status(200).json(rows);
    } catch (error) {
        console.error("Error fetching search history:", error);
        res.status(500).json({ message: "Failed to fetch search history" });
    }
}; 

export default {
    searchProducts,
    saveSearchHistory,
    getUserSearchHistory
};
