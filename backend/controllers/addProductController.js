import pool from "../db.js";

export const addProduct = async (req, res) => {
    const input = req.body;
    console.log("Received input:", input);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Insert product without is_available field
        const productQuery = `
      INSERT INTO "Product"
      (name, category_id, price, quantity, unit_measure, origin, description, is_refundable, created_at, updated_at)
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *;
    `;

        const productValues = [
            input.productName,
            input.categoryId,
            input.price,
            input.quantity,
            input.unitMeasure || null,
            input.origin || null,
            input.description || null,
            input.isRefundable
            // Removed input.isAvailable
        ];

        const productResult = await client.query(productQuery, productValues);
        const newProduct = productResult.rows[0];

        // Handle warehouse distribution if provided
        if (input.warehouseDistribution) {
            const inventoryInserts = [];

            for (const [warehouseId, distribution] of Object.entries(input.warehouseDistribution)) {
                if (distribution.quantity > 0) {
                    const inventoryQuery = `
            INSERT INTO "Inventory"
            (product_id, warehouse_id, quantity_in_stock, reorder_level, last_restock_date)
            VALUES ($1, $2, $3, $4, NOW());
          `;

                    const inventoryValues = [
                        newProduct.product_id,
                        parseInt(warehouseId),
                        distribution.quantity,
                        distribution.reorderLevel || 0
                    ];

                    inventoryInserts.push(client.query(inventoryQuery, inventoryValues));
                }
            }

            // Execute all inventory inserts
            if (inventoryInserts.length > 0) {
                await Promise.all(inventoryInserts);
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            product: newProduct,
            message: "Product added successfully with warehouse distribution"
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error adding product:", error);
        res.status(500).json({ message: "Failed to add product" });
    } finally {
        client.release();
    }
};

export const getCategoriesHierarchy = async (req, res) => {
    try {
        const query = `
            WITH RECURSIVE category_tree AS (
                -- Base case: get all parent categories (no parent_id)
                SELECT 
                    category_id,
                    parent_id,
                    name,
                    description,
                    cat_image,
                    created_at,
                    0 as level,
                    ARRAY[name] as path,
                    category_id::text as path_ids
                FROM "Category"
                WHERE parent_id IS NULL
                
                UNION ALL
                
                -- Recursive case: get children
                SELECT 
                    c.category_id,
                    c.parent_id,
                    c.name,
                    c.description,
                    c.cat_image,
                    c.created_at,
                    ct.level + 1,
                    ct.path || c.name,
                    ct.path_ids || ',' || c.category_id::text
                FROM "Category" c
                JOIN category_tree ct ON c.parent_id = ct.category_id
            )
            SELECT * FROM category_tree
            ORDER BY level, name ASC;
        `;

        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching category hierarchy:", error);
        res.status(500).json({ message: "Failed to fetch category hierarchy" });
    }
};
export const getRootCategories = async (req, res) => {
    try {
        const query = `
            SELECT category_id, name, description, cat_image
            FROM "Category"
            WHERE parent_id IS NULL
            ORDER BY name ASC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching root categories:", error);
        res.status(500).json({ message: "Failed to fetch root categories" });
    }
};
export const getChildCategories = async (req, res) => {
    try {
        const { parentId } = req.params;

        const query = `
            SELECT category_id, name, description, cat_image, parent_id
            FROM "Category"
            WHERE parent_id = $1
            ORDER BY name ASC;
        `;
        const result = await pool.query(query, [parentId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching child categories:", error);
        res.status(500).json({ message: "Failed to fetch child categories" });
    }
};
export const hasChildCategories = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const query = `
            SELECT COUNT(*) > 0 as has_children
            FROM "Category"
            WHERE parent_id = $1;
        `;
        const result = await pool.query(query, [categoryId]);
        res.status(200).json({ hasChildren: result.rows[0].has_children });
    } catch (error) {
        console.error("Error checking child categories:", error);
        res.status(500).json({ message: "Failed to check child categories" });
    }
};

export const getCategoryBreadcrumb = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const query = `
            WITH RECURSIVE category_path AS (
                -- Base case: start with the selected category
                SELECT 
                    category_id,
                    parent_id,
                    name,
                    0 as level
                FROM "Category"
                WHERE category_id = $1
                
                UNION ALL
                
                -- Recursive case: get parents
                SELECT 
                    c.category_id,
                    c.parent_id,
                    c.name,
                    cp.level + 1
                FROM "Category" c
                JOIN category_path cp ON c.category_id = cp.parent_id
            )
            SELECT category_id, name, level
            FROM category_path
            ORDER BY level DESC;
        `;

        const result = await pool.query(query, [categoryId]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching category breadcrumb:", error);
        res.status(500).json({ message: "Failed to fetch category breadcrumb" });
    }
};
export const getLeafCategories = async (req, res) => {
    try {
        const query = `
            SELECT c1.category_id, c1.name, c1.description, c1.parent_id
            FROM "Category" c1
            LEFT JOIN "Category" c2 ON c1.category_id = c2.parent_id
            WHERE c2.category_id IS NULL
            ORDER BY c1.name ASC;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching leaf categories:", error);
        res.status(500).json({ message: "Failed to fetch leaf categories" });
    }
};

// Add this new function to fetch all warehouses
export const getAllWarehouses = async (req, res) => {
    try {
        const query = `
      SELECT warehouse_id, name, location, contact_info
      FROM "Warehouse"
      ORDER BY name ASC;
    `;

        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching warehouses:", error);
        res.status(500).json({ message: "Failed to fetch warehouses" });
    }
};
