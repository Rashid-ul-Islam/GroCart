import express from "express";
import { addCategory, getCategories } from "../controllers/addCategoryController.js";
import { getCategoriesHierarchy } from "../controllers/addProductController.js";
const router = express.Router();

router.post("/addCategory",addCategory);
router.get("/getCategories",getCategories);
router.get("/getCategoriesHierarchy", getCategoriesHierarchy);

export default router;