import pool from "../db.js";

// Get total count of products
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

// Get total count of users (assuming you have a User table)
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

// Get dashboard stats (combined endpoint for better performance)
export const getDashboardStats = async (req, res) => {
  try {
    const productCountQuery = `SELECT COUNT(*) as total FROM "Product"`;
    const userCountQuery = `SELECT COUNT(*) as total FROM "User"`;
    const salesQuery = `SELECT SUM(total_amount) as total FROM "Order" WHERE status = 'completed'`;
    const [productResult, userResult, salesResult] = await Promise.all([
      pool.query(productCountQuery),
      pool.query(userCountQuery),
      pool.query(salesQuery)
    ]);

    res.status(200).json({
      totalProducts: parseInt(productResult.rows[0].total),
      totalUsers: parseInt(userResult.rows[0].total),
      totalSales: parseFloat(salesResult.rows[0].total)
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
};
