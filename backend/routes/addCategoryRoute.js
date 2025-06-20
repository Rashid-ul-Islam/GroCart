import express from "express";
import { addCategory, getCategories } from "../controllers/addCategoryController.js";
const router = express.Router();

router.post("/addCategory",addCategory);
router.get("/getCategories",getCategories); // Assuming you have a function to fetch categories

export default router;