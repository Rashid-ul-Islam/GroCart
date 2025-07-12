import pool from "../db.js";

export const searchProducts = async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const rawSearchTerm = q.trim().toLowerCase();
    const searchTermWithWildcards = `%${rawSearchTerm}%`;
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);

    console.log("=== SEARCH DEBUG ===");
    console.log("Original query:", q);
    console.log("Raw search term:", rawSearchTerm);
    console.log("Search term with wildcards:", searchTermWithWildcards);
    console.log("Limit:", limitNum, "Offset:", offsetNum);

    // Enhanced search query with category hierarchy traversal
    const query = `
      WITH RECURSIVE category_hierarchy AS (
        -- Base case: all categories
        SELECT 
          category_id,
          name,
          description,
          parent_id,
          name as category_path,
          0 as depth
        FROM "Category"
        
        UNION ALL
        
        -- Recursive case: build category paths
        SELECT 
          c.category_id,
          c.name,
          c.description,
          c.parent_id,
          CASE 
            WHEN ch.category_path IS NULL THEN c.name
            ELSE ch.category_path || ' > ' || c.name
          END as category_path,
          ch.depth + 1 as depth
        FROM "Category" c
        JOIN category_hierarchy ch ON c.parent_id = ch.category_id
        WHERE ch.depth < 10 -- Prevent infinite recursion
      ),
      
      -- Get all category matches (including parent categories)
      matching_categories AS (
        SELECT DISTINCT category_id
        FROM category_hierarchy
        WHERE 
          LOWER(name) LIKE $2 OR 
          LOWER(COALESCE(description, '')) LIKE $2 OR
          LOWER(category_path) LIKE $2
      )
      
      SELECT DISTINCT
        p.product_id AS id,
        p.name,
        p.price,
        p.unit_measure,
        p.description,
        p.origin,
        p.is_available,
        
        -- Get the most specific category for display
        COALESCE(
          direct_cat.category_id,
          pc_cat.category_id
        ) AS category_id,
        
        COALESCE(
          direct_cat.name,
          pc_cat.name
        ) AS category_name,
        
        COALESCE(
          direct_cat.description,
          pc_cat.description
        ) AS category_description,
        
        -- Get category hierarchy path for display
        COALESCE(
          direct_hierarchy.category_path,
          pc_hierarchy.category_path
        ) AS category_path,
        
        pi.image_url,
        
        -- Enhanced relevance scoring
        CASE 
          -- Exact product name match gets highest score
          WHEN LOWER(p.name) = $1 THEN 100
          -- Product name starts with search term
          WHEN LOWER(p.name) LIKE $1 || '%' THEN 90
          -- Product name contains search term
          WHEN LOWER(p.name) LIKE $2 THEN 80
          
          -- Direct category exact match
          WHEN LOWER(COALESCE(direct_cat.name, '')) = $1 THEN 75
          -- Direct category starts with search term
          WHEN LOWER(COALESCE(direct_cat.name, '')) LIKE $1 || '%' THEN 70
          -- Direct category contains search term
          WHEN LOWER(COALESCE(direct_cat.name, '')) LIKE $2 THEN 65
          
          -- Many-to-many category exact match
          WHEN LOWER(COALESCE(pc_cat.name, '')) = $1 THEN 60
          -- Many-to-many category starts with search term
          WHEN LOWER(COALESCE(pc_cat.name, '')) LIKE $1 || '%' THEN 55
          -- Many-to-many category contains search term
          WHEN LOWER(COALESCE(pc_cat.name, '')) LIKE $2 THEN 50
          
          -- Parent category matches (through hierarchy)
          WHEN EXISTS (
            SELECT 1 FROM matching_categories mc 
            WHERE mc.category_id = COALESCE(p.category_id, pc.category_id)
          ) THEN 45
          
          -- Product description matches with multiple patterns
          -- Exact match in description
          WHEN LOWER(COALESCE(p.description, '')) = $1 THEN 42
          -- Description starts with search term
          WHEN LOWER(COALESCE(p.description, '')) LIKE $1 || '%' THEN 40
          -- Description contains search term (general)
          WHEN LOWER(COALESCE(p.description, '')) LIKE $2 THEN 35
          -- Word boundary matching for descriptions (PostgreSQL format)
          WHEN LOWER(COALESCE(p.description, '')) ~* ('\\m' || $1 || '\\M') THEN 30
          
          -- Category description matches
          WHEN LOWER(COALESCE(direct_cat.description, '')) LIKE $2 THEN 30
          WHEN LOWER(COALESCE(pc_cat.description, '')) LIKE $2 THEN 25
          
          -- Origin matches
          WHEN LOWER(COALESCE(p.origin, '')) LIKE $2 THEN 20
          
          ELSE 10
        END AS relevance_score
        
      FROM "Product" p
      
      -- Direct category relationship
      LEFT JOIN "Category" direct_cat ON p.category_id = direct_cat.category_id
      LEFT JOIN category_hierarchy direct_hierarchy ON direct_cat.category_id = direct_hierarchy.category_id
      
      -- Many-to-many category relationship
      LEFT JOIN "ProductCategory" pc ON p.product_id = pc.product_id
      LEFT JOIN "Category" pc_cat ON pc.category_id = pc_cat.category_id
      LEFT JOIN category_hierarchy pc_hierarchy ON pc_cat.category_id = pc_hierarchy.category_id
      
      -- Primary image
      LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
      
      WHERE p.is_available = true AND (
        -- Product name/description matches
        LOWER(p.name) LIKE $2 OR
        LOWER(COALESCE(p.description, '')) LIKE $2 OR
        LOWER(COALESCE(p.origin, '')) LIKE $2 OR
        LOWER(COALESCE(p.unit_measure, '')) LIKE $2 OR
        
        -- Exact term matching for descriptions
        LOWER(COALESCE(p.description, '')) = $1 OR
        LOWER(COALESCE(p.description, '')) LIKE $1 || '%' OR
        
        -- Word boundary matching for descriptions
        LOWER(COALESCE(p.description, '')) ~* ('\\m' || $1 || '\\M') OR
        
        -- Direct category matches
        LOWER(COALESCE(direct_cat.name, '')) LIKE $2 OR
        LOWER(COALESCE(direct_cat.description, '')) LIKE $2 OR
        
        -- Many-to-many category matches
        LOWER(COALESCE(pc_cat.name, '')) LIKE $2 OR
        LOWER(COALESCE(pc_cat.description, '')) LIKE $2 OR
        
        -- Hierarchy path matches
        LOWER(COALESCE(direct_hierarchy.category_path, '')) LIKE $2 OR
        LOWER(COALESCE(pc_hierarchy.category_path, '')) LIKE $2 OR
        
        -- Category hierarchy matches (including parent categories)
        EXISTS (
          SELECT 1 FROM matching_categories mc 
          WHERE mc.category_id = COALESCE(p.category_id, pc.category_id)
        )
      )
      
      ORDER BY relevance_score DESC, p.name ASC
      LIMIT $3 OFFSET $4
    `;

    // Enhanced count query
    const countQuery = `
      WITH RECURSIVE category_hierarchy AS (
        SELECT 
          category_id,
          name,
          description,
          parent_id,
          name as category_path,
          0 as depth
        FROM "Category"
        
        UNION ALL
        
        SELECT 
          c.category_id,
          c.name,
          c.description,
          c.parent_id,
          CASE 
            WHEN ch.category_path IS NULL THEN c.name
            ELSE ch.category_path || ' > ' || c.name
          END as category_path,
          ch.depth + 1 as depth
        FROM "Category" c
        JOIN category_hierarchy ch ON c.parent_id = ch.category_id
        WHERE ch.depth < 10
      ),
      
      matching_categories AS (
        SELECT DISTINCT category_id
        FROM category_hierarchy
        WHERE 
          LOWER(name) LIKE $2 OR 
          LOWER(COALESCE(description, '')) LIKE $2 OR
          LOWER(category_path) LIKE $2
      )
      
      SELECT COUNT(DISTINCT p.product_id) as total
      FROM "Product" p
      LEFT JOIN "Category" direct_cat ON p.category_id = direct_cat.category_id
      LEFT JOIN category_hierarchy direct_hierarchy ON direct_cat.category_id = direct_hierarchy.category_id
      LEFT JOIN "ProductCategory" pc ON p.product_id = pc.product_id
      LEFT JOIN "Category" pc_cat ON pc.category_id = pc_cat.category_id
      LEFT JOIN category_hierarchy pc_hierarchy ON pc_cat.category_id = pc_hierarchy.category_id
      
      WHERE p.is_available = true AND (
        -- Product fields
        LOWER(p.name) LIKE $2 OR
        LOWER(COALESCE(p.description, '')) LIKE $2 OR
        LOWER(COALESCE(p.origin, '')) LIKE $2 OR
        LOWER(COALESCE(p.unit_measure, '')) LIKE $2 OR
        
        -- Exact term matching for descriptions
        LOWER(COALESCE(p.description, '')) = $1 OR
        LOWER(COALESCE(p.description, '')) LIKE $1 || '%' OR
        
        -- Word boundary matching for descriptions
        LOWER(COALESCE(p.description, '')) ~* ('\\m' || $1 || '\\M') OR
        
        -- Direct category matches
        LOWER(COALESCE(direct_cat.name, '')) LIKE $2 OR
        LOWER(COALESCE(direct_cat.description, '')) LIKE $2 OR
        
        -- Many-to-many category matches
        LOWER(COALESCE(pc_cat.name, '')) LIKE $2 OR
        LOWER(COALESCE(pc_cat.description, '')) LIKE $2 OR
        
        -- Hierarchy path matches
        LOWER(COALESCE(direct_hierarchy.category_path, '')) LIKE $2 OR
        LOWER(COALESCE(pc_hierarchy.category_path, '')) LIKE $2 OR
        
        -- Category hierarchy matches (including parent categories)
        EXISTS (
          SELECT 1 FROM matching_categories mc 
          WHERE mc.category_id = COALESCE(p.category_id, pc.category_id)
        )
      )
    `;

    console.log("Executing enhanced search query...");
    const start = Date.now();
    
    const [productsResult, countResult] = await Promise.all([
      pool.query(query, [rawSearchTerm, searchTermWithWildcards, limitNum, offsetNum]),
      pool.query(countQuery, [rawSearchTerm, searchTermWithWildcards])
    ]);

    const queryTime = Date.now() - start;
    console.log(`Query executed in ${queryTime}ms`);

    const products = productsResult.rows;
    const total = parseInt(countResult.rows[0].total);

    console.log("Results found:", products.length);
    console.log("Total matches:", total);
    
    if (products.length > 0) {
      console.log("Sample result:", {
        name: products[0].name,
        category: products[0].category_name,
        category_path: products[0].category_path,
        relevance_score: products[0].relevance_score,
        description: products[0].description?.substring(0, 100)
      });
      
      // Debug: Check if any products have descriptions
      const productsWithDescriptions = products.filter(p => p.description && p.description.trim() !== '');
      console.log(`Products with descriptions: ${productsWithDescriptions.length}/${products.length}`);
      
      if (productsWithDescriptions.length > 0) {
        console.log("Sample description:", productsWithDescriptions[0].description.substring(0, 200));
        
        // Debug: Test description matching
        const testDesc = productsWithDescriptions[0].description.toLowerCase();
        console.log("Testing description matching:");
        console.log("- Contains term (general):", testDesc.includes(rawSearchTerm));
        console.log("- LIKE with wildcards:", testDesc.indexOf(rawSearchTerm) >= 0);
        console.log("- Word boundary test:", new RegExp(`\\b${rawSearchTerm}\\b`, 'i').test(testDesc));
      }
    }

    // Save search history if user is logged in
    if (req.user && req.user.user_id) {
      try {
        await pool.query(
          'INSERT INTO "SearchHistory" (user_id, search_query) VALUES ($1, $2)',
          [req.user.user_id, q.trim()]
        );
      } catch (historyError) {
        console.error('Error saving search history:', historyError);
      }
    }

    res.status(200).json({
      success: true,
      products,
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + limitNum < total
      },
      searchTerm: q.trim(),
      debug: {
        queryTime,
        rawSearchTerm,
        searchPattern: searchTermWithWildcards,
        descriptionMatches: products.filter(p => 
          p.description && p.description.toLowerCase().includes(rawSearchTerm)
        ).length
      }
    });

  } catch (error) {
    console.error('Error searching products:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Rest of the functions remain the same...
export const quickSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.status(200).json({ success: true, suggestions: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    console.log("=== QUICK SEARCH DEBUG ===");
    console.log("Original query:", q);
    console.log("Search term:", searchTerm);

    const query = `
      SELECT DISTINCT
        p.product_id as id,
        p.name,
        p.price,
        c.name AS category_name,
        pi.image_url,
        CASE 
          WHEN LOWER(p.name) = LOWER($2) THEN 1
          WHEN LOWER(p.name) LIKE LOWER($2) || '%' THEN 2
          ELSE 3
        END as sort_priority
      FROM "Product" p
      LEFT JOIN "Category" c ON p.category_id = c.category_id
      LEFT JOIN "ProductImage" pi ON p.product_id = pi.product_id AND pi.is_primary = true
      WHERE
        p.is_available = true AND
        (
          p.name ILIKE $1 OR 
          COALESCE(c.name, '') ILIKE $1 OR
          COALESCE(p.description, '') ILIKE $1
        )
      ORDER BY 
        sort_priority,
        p.name ASC
      LIMIT 8
    `;

    const { rows } = await pool.query(query, [searchTerm, q.trim()]);

    console.log(`Quick search found ${rows.length} results`);
    if (rows.length > 0) {
      console.log("Sample result:", rows[0].name);
    }

    res.status(200).json({
      success: true,
      suggestions: rows
    });

  } catch (error) {
    console.error('Error in quick search:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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
      INSERT INTO "SearchHistory"(user_id, search_query)
    VALUES($1, $2)
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
  quickSearch,
  saveSearchHistory,
  getUserSearchHistory
};