import pool from "../db.js";


export const getProductCount = async (req, res) => {
    try {
        const query = `SELECT COUNT(*) as total FROM "Product"`;
        const result = await pool.query(query);
        res.status(200).json({ totalProducts: parseInt(result.rows[0].total) });
    } catch (error) {
        console.error("Error fetching product count:", error);
        res.status(500).json({ message: "Failed to fetch product count" });
    }
};


export const getUserCount = async (req, res) => {
    try {
        const query = `SELECT COUNT(*) as total FROM "User"`;
        const result = await pool.query(query);
        res.status(200).json({ totalUsers: parseInt(result.rows[0].total) });
    } catch (error) {
        console.error("Error fetching user count:", error);
        res.status(500).json({ message: "Failed to fetch user count" });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const productCountQuery = `SELECT COUNT(*) as total FROM "Product"`;
        const userCountQuery = `SELECT COUNT(*) as total FROM "User"`;
        const salesQuery = `SELECT SUM(total_amount) as total FROM "Order" WHERE payment_status = 'completed'`;
        
        const [productResult, userResult, salesResult] = await Promise.all([
            pool.query(productCountQuery),
            pool.query(userCountQuery),
            pool.query(salesQuery)
        ]);

        res.status(200).json({
            totalProducts: parseInt(productResult.rows[0].total),
            totalUsers: parseInt(userResult.rows[0].total),
            totalSales: parseFloat(salesResult.rows[0].total) || 0
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
};

const getDescendantCategoryIds = async (categoryId) => {
    try {
        const query = `
            WITH RECURSIVE category_tree AS (
                -- Base case: start with the selected category
                SELECT category_id, parent_id
                FROM "Category"
                WHERE category_id = $1
                
                UNION ALL
                
                -- Recursive case: find all children
                SELECT c.category_id, c.parent_id
                FROM "Category" c
                INNER JOIN category_tree ct ON c.parent_id = ct.category_id
            )
            SELECT category_id FROM category_tree;
        `;
        
        const result = await pool.query(query, [categoryId]);
        return result.rows.map(row => row.category_id);
    } catch (error) {
        console.error("Error fetching descendant categories:", error);
        return [categoryId];
    }
};

export const getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            category_id = '',
            min_price = '',
            max_price = '',
            origin = '',
            is_refundable = '',
            is_available = '',
            start_date = '',
            end_date = ''
        } = req.query;

        let whereConditions = [];
        let queryParams = [];
        let paramIndex = 1;

        if (search) {
            whereConditions.push(`p.name ILIKE $${paramIndex}`);
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        // Filter by category (including child categories)
        if (category_id) {
            const categoryIds = await getDescendantCategoryIds(parseInt(category_id));
            
            if (categoryIds.length === 1) {
                whereConditions.push(`p.category_id = $${paramIndex}`);
                queryParams.push(categoryIds[0]);
                paramIndex++;
            } else {
                const placeholders = categoryIds.map(() => `$${paramIndex++}`).join(',');
                whereConditions.push(`p.category_id IN (${placeholders})`);
                queryParams.push(...categoryIds);
            }
        }

        if (min_price) {
            whereConditions.push(`p.price >= $${paramIndex}`);
            queryParams.push(parseFloat(min_price));
            paramIndex++;
        }
        if (max_price) {
            whereConditions.push(`p.price <= $${paramIndex}`);
            queryParams.push(parseFloat(max_price));
            paramIndex++;
        }

        if (origin) {
            whereConditions.push(`p.origin ILIKE $${paramIndex}`);
            queryParams.push(`%${origin}%`);
            paramIndex++;
        }
        if (is_refundable !== '') {
            whereConditions.push(`p.is_refundable = $${paramIndex}`);
            queryParams.push(is_refundable === 'true');
            paramIndex++;
        }

        if (is_available !== '') {
            whereConditions.push(`p.is_available = $${paramIndex}`);
            queryParams.push(is_available === 'true');
            paramIndex++;
        }

        if (start_date) {
            whereConditions.push(`p.created_at >= $${paramIndex}`);
            queryParams.push(start_date);
            paramIndex++;
        }
        if (end_date) {
            whereConditions.push(`p.created_at <= $${paramIndex}`);
            queryParams.push(end_date);
            paramIndex++;
        }

        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM "Product" p 
            LEFT JOIN "Category" c ON p.category_id = c.category_id 
            ${whereClause}
        `;
        const countResult = await pool.query(countQuery, queryParams);
        const totalProducts = parseInt(countResult.rows[0].total);

        const offset = (page - 1) * limit;
        const productsQuery = `
            SELECT 
                p.product_id,
                p.name,
                p.category_id,
                c.name as category_name,
                p.price,
                p.quantity,
                p.unit_measure,
                p.origin,
                p.description,
                p.is_refundable,
                p.is_available,
                p.created_at,
                p.updated_at
            FROM "Product" p
            LEFT JOIN "Category" c ON p.category_id = c.category_id
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(parseInt(limit), offset);
        const productsResult = await pool.query(productsQuery, queryParams);

        res.status(200).json({
            products: productsResult.rows,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: parseInt(page),
            hasNextPage: page * limit < totalProducts,
            hasPrevPage: page > 1
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Failed to fetch products" });
    }
};

export const getCategories = async (req, res) => {
    try {
        const query = `SELECT category_id, name FROM "Category" ORDER BY name`;
        const result = await pool.query(query);
        res.status(200).json({ categories: result.rows });
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Failed to fetch categories" });
    }
};

export const searchProducts = async (req, res) => {
    try {
        const { search } = req.query;

        if (!search || search.trim() === '') {
            return res.status(400).json({ message: "Search term is required" });
        }

        const query = `
            SELECT 
                p.product_id,
                p.name,
                p.category_id,
                c.name as category_name,
                p.price,
                p.quantity,
                p.unit_measure,
                p.origin,
                p.description,
                p.is_refundable,
                p.is_available,
                p.created_at
            FROM "Product" p
            LEFT JOIN "Category" c ON p.category_id = c.category_id
            WHERE p.name ILIKE $1 OR p.description ILIKE $1 OR p.origin ILIKE $1
            ORDER BY p.name
            LIMIT 20
        `;

        const result = await pool.query(query, [`%${search}%`]);
        res.status(200).json({ products: result.rows });

    } catch (error) {
        console.error("Error searching products:", error);
        res.status(500).json({ message: "Failed to search products" });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `DELETE FROM "Product" WHERE product_id = $1 RETURNING *`;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({
            message: "Product deleted successfully",
            deletedProduct: result.rows[0]
        });

    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Failed to delete product" });
    }
};