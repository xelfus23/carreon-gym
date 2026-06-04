import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  updateProduct,
} from "./product.controller.ts";
import { authMiddleware } from "../../middleware/authenticate.ts";
import { authorizeRoles } from "../../middleware/roleGuard.ts";

const productRoutes = Router();

productRoutes.get("", authMiddleware, getAllProducts);
productRoutes.post("", authMiddleware, authorizeRoles("admin"), createProduct);
productRoutes.patch("/:id", authMiddleware, authorizeRoles("admin"), updateProduct);
productRoutes.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteProduct);

export default productRoutes;
