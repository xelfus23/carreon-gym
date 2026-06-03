import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  uploadProductImage,
  updateProduct,
} from "./product.controller.ts";
import { uploadProductImages } from "../../services/multerUpload.ts";
import { authMiddleware } from "../../middleware/authenticate.ts";
import { authorizeRoles } from "../../middleware/roleGuard.ts";

const productRoutes = Router();


productRoutes.post(
  "/upload",
  authMiddleware,
  authorizeRoles("admin"),
  uploadProductImages.single("image"),
  uploadProductImage,
);

productRoutes.get("", authMiddleware, getAllProducts);

productRoutes.post("", authMiddleware, authorizeRoles("admin"), createProduct);
productRoutes.patch("/:id", authMiddleware, authorizeRoles("admin"), updateProduct);
productRoutes.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteProduct);

export default productRoutes;
