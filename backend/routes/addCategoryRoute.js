import express from "express";
import { addCategory, getCategories } from "../controllers/addCategoryController.js";
const router = express.Router();

router.post("/addCategory",addCategory);
router.get("/getCategories",getCategories);

export default router;