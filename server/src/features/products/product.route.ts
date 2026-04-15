import { Router } from "express";
import {
    mobileAuthMiddleware,
    webAuthMiddleware,
} from "../../middleware/authenticate.ts";
import {
    createProduct,
    deleteProduct,
    getAllProducts,
    updateProduct,
} from "./product.controller.ts";

const productRoutes = Router();

productRoutes.get("", webAuthMiddleware, getAllProducts);
productRoutes.get("/mobile", mobileAuthMiddleware, getAllProducts);

productRoutes.post("", webAuthMiddleware, createProduct);
productRoutes.patch("/:id", webAuthMiddleware, updateProduct);
productRoutes.delete("/id", webAuthMiddleware, deleteProduct);

export default productRoutes;
