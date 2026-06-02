import { Router } from "express";
import {
  mobileAuthMiddleware,
  webAuthMiddleware,
} from "../../middleware/authenticate.ts";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  uploadProductImage,
  updateProduct,
} from "./product.controller.ts";
import { uploadProductImages } from "../../services/multerUpload.ts";

const productRoutes = Router();

productRoutes.get("", webAuthMiddleware, getAllProducts);
productRoutes.get("/mobile", mobileAuthMiddleware, getAllProducts);
productRoutes.post("", webAuthMiddleware, createProduct);

productRoutes.post(
  "/upload",
  webAuthMiddleware,
  uploadProductImages.single("image"),
  uploadProductImage,
);

productRoutes.patch("/:id", webAuthMiddleware, updateProduct);
productRoutes.delete("/:id", webAuthMiddleware, deleteProduct);

export default productRoutes;
