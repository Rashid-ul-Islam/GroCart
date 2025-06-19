import pool from "../db.js";

export const addCategory = async (req, res) => {
    const input = req.body;
    console.log("Received input:", input);

    try {
        const query = `
      INSERT INTO "Category"
        (category_id, name, parent_id, description, cat_image)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

        const values = [
            input.categoryId,
            input.name,
            input.parent_id || null, 
            input.description || null,
            input.cat_image || null,
        ];

        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding category:", error);
        res.status(500).json({ message: "Failed to add category" });
    }
};
