import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import pool from "./db.js";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import addProductRoute from "./routes/addProductRoute.js";
import addCategoryRoute from "./routes/addCategoryRoute.js";
import adminPanelRoute from "./routes/adminPanelRoute.js";


const app = express();
app.use(cors());
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
); // helmet is a security middleware that helps you protect your app by setting various HTTP headers
app.use(morgan("dev")); // log the requests
dotenv.config();

const port = process.env.PORT || 3000;


app.use("/api/products",addProductRoute);
app.use("/api/categories", addCategoryRoute);
app.use("/api/adminDashboard",adminPanelRoute);

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});