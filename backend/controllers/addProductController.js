import pool from "../db.js";

export const addProduct = async (req, res) => {
    const input = req.body;
    console.log("Received input:", input);

    try {
        const query = `
      INSERT INTO "Product"
        (name, category_id, price, quantity, unit_measure, origin, description, is_refundable, is_available)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

        const values = [
            input.productName,             // name
            input.categoryId,              // category_id
            input.price,                   // price
            input.quantity,                // quantity
            input.unitMeasure || null,     // unit_measure (nullable)
            input.origin || null,          // origin (nullable)
            input.description || null,     // description (nullable)
            input.isRefundable,            // is_refundable (boolean)
            input.isAvailable              // is_available (boolean)
        ];

        const result = await pool.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ message: "Failed to add product" });
    }
};
