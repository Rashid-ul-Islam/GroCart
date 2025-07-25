import express from "express";
import { addProduct,getRootCategories, getChildCategories,hasChildCategories,getCategoryBreadcrumb,getLeafCategories, getAllWarehouses, uploadSingleImage } from "../controllers/addProductController.js";
import { uploadProductImages, handleMulterError, uploadSingleProductImage } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/addProduct", uploadProductImages, handleMulterError, addProduct);
router.post("/upload-image", uploadSingleProductImage, handleMulterError, uploadSingleImage);
router.get("/getRootCategories", getRootCategories); 
router.get("/getChildCategories/:parentId", getChildCategories); 
router.get("/hasChildCategories/:categoryId", hasChildCategories); 
router.get("/getCategoryBreadcrumb/:categoryId", getCategoryBreadcrumb);
router.get("/getLeafCategories", getLeafCategories);
router.get("/getAllWarehouses", getAllWarehouses);

export default router;