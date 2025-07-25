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
import approvalsRoute from "./routes/approvalsRoute.js";
// New consolidated routes
import statusTrackingRoute from "./routes/statusTrackingRoute.js";
import enhancedDeliveryRoute from "./routes/enhancedDeliveryRoute.js";
import warehouseInventoryRoute from "./routes/warehouseInventoryRoute.js";
import userProfileRoute from "./routes/userProfileRoute.js";
import reviewRoute from "./routes/reviewRoute.js";
import stockRoute from "./routes/stockRoute.js";
import adminReturnRoute from "./routes/adminReturnRoute.js";
import walletRoute from "./routes/walletRoute.js";
import deliveryAnalyticsRoute from "./routes/deliveryAnalyticsRoute.js";
import couponRoute from "./routes/couponRoute.js";
import statsRoute from "./routes/statsRoute.js";

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

app.use("/api/products", addProductRoute);
app.use("/api/productsByCat", productsByCat);
app.use("/api/categories", addCategoryRoute);
app.use("/api/adminDashboard", adminPanelRoute);
app.use("/api/address", addressRoute);
app.use("/api/auth", userRegRoute);
app.use("/api/search", searchRoute);
app.use("/api/home", productHomepageRoute);
app.use("/api/wh", warehouseRoute);
app.use("/api/inventory", inventoryRoute);
app.use("/api/delivery", deliveryOverview);
app.use("/api/delivery", activeDeliveryRoute);
app.use("/api/delivery", deliveryBoyManagementRoute);
app.use("/api/cart", cartRoute);
app.use("/api/delivery", assignDeliveryRoute);
app.use("/api/favorites", favoritesRoute);
app.use("/api/order", orderRoute);
app.use("/api/admin", approvalsRoute);
app.use("/api/admin", adminReturnRoute);
// New consolidated routes
app.use("/api/status", statusTrackingRoute);
app.use("/api/delivery", enhancedDeliveryRoute);
app.use("/api/warehouse", warehouseInventoryRoute);
app.use("/api/user", userProfileRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/stock", stockRoute);
app.use("/api/wallet", walletRoute);
app.use("/api/delivery-analytics", deliveryAnalyticsRoute);
app.use("/api/coupons", couponRoute);
app.use("/api/stats", statsRoute);

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});