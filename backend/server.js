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
import addressRoute from "./routes/addressRoute.js";
import userRegRoute from "./routes/userRegRoute.js";
import productsByCat from "./routes/productsByCatRoute.js";
import searchRoute from "./routes/searchRoute.js";
import productHomepageRoute from "./routes/productHomepageRoute.js";
import warehouseRoute from "./routes/warehouseRoute.js";
import inventoryRoute from "./routes/inventoryRoute.js";
import deliveryOverview from "./routes/deliveryOverviewRoute.js";
import activeDeliveryRoute from "./routes/ActiveDeliveryRoute.js";
import deliveryBoyManagementRoute from "./routes/deliveryBoyManagementRoute.js";
import cartRoute from "./routes/cartRoute.js";
import assignDeliveryRoute from "./routes/assignedDeliveryRoute.js";
import favoritesRoute from "./routes/favoritesRoute.js";
import orderRoute from "./routes/orderRoute.js";

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
app.use("/api/productsByCat", productsByCat);
app.use("/api/categories", addCategoryRoute);
app.use("/api/adminDashboard",adminPanelRoute);
app.use("/api/address", addressRoute);
app.use("/api/auth", userRegRoute);
app.use("/api/search", searchRoute);
app.use("/api/home",productHomepageRoute);
app.use("/api/wh", warehouseRoute);
app.use("/api/inventory", inventoryRoute);
app.use("/api/delivery", deliveryOverview);
app.use("/api/delivery", activeDeliveryRoute);
app.use("/api/delivery", deliveryBoyManagementRoute);
app.use("/api/cart", cartRoute);
app.use("/api/delivery", assignDeliveryRoute);
app.use("/api/favorites",favoritesRoute);
app.use("/api/order", orderRoute);

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});