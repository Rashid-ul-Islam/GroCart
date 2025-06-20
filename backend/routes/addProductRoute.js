import express from "express";
import { addProduct,getRootCategories, getChildCategories,hasChildCategories,getCategoryBreadcrumb,getLeafCategories } from "../controllers/addProductController.js";
const router = express.Router();

router.post("/addProduct",addProduct);
router.get("/getRootCategories", getRootCategories); 
router.get("/getChildCategories/:parentId", getChildCategories); 
router.get("/hasChildCategories/:categoryId", hasChildCategories); 
router.get("/getCategoryBreadcrumb/:categoryId", getCategoryBreadcrumb);
router.get("/getLeafCategories", getLeafCategories);




export default router;