import pool from "../db.js";

export const addCategory = async (req, res) => {
    const input = req.body;
    console.log("Received input:", input);

    try {
        const checkQuery = `SELECT 1 FROM "Category" WHERE name = $1 LIMIT 1;`;
        const checkResult = await pool.query(checkQuery, [input.name]);
        if (checkResult.rows.length > 0) {
            return res.status(409).json({
                field: "name",
                message: "Category with this name already exists."
            });
        }
        const query = `
            INSERT INTO "Category"
            (name, parent_id, description, cat_image)
            VALUES
            ($1, $2, $3, $4)
            RETURNING *;
        `;
        const values = [
            input.name,
            input.parent_id || null,
            input.description || null,
            input.cat_image || null,
        ];
        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding category:", error);
        if (error.code === '23505') {
            return res.status(409).json({
                field: "name",
                message: "Category with this name already exists."
            });
        }
        res.status(500).json({ message: "Failed to add category" });
    }
};

export const getCategories = async (req, res) => {
    try {
        const query = `
            SELECT category_id, name
            FROM "Category"
            ORDER BY name ASC;
        `;
        const result = await pool.query(query);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ message: "Failed to fetch categories" });
    }
};
