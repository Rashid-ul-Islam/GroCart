import express from "express";
import { addCategory, setCategories } from "../controllers/addCategoryController.js";
const router = express.Router();

router.post("/addCategory",addCategory);
router.get("/getCategories",setCategories); // Assuming you have a function to fetch categories

export default router;