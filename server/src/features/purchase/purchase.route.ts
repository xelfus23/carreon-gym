import { Router } from "express";
import { uploadPaymentReceipt } from "../../services/multerUpload.ts";
import {
  deleteTransaction,
  denyPurchase,
  getAllTransactions,
  requestPurchase,
  verifyPurchase,
} from "./purchase.controller.ts";
import { authMiddleware } from "../../middleware/authenticate.ts";
import { authorizeRoles } from "../../middleware/roleGuard.ts";

const purchaseRoutes = Router();

// --- Member Routes (Mobile) ---
// Members can request a purchase and view their own transaction history
purchaseRoutes.post(
  "/request",
  authMiddleware,
  uploadPaymentReceipt.single("receipt"),
  requestPurchase,
);

purchaseRoutes.get("/my-history", authMiddleware, getAllTransactions);

// --- Admin Routes (Web/Electron) ---
purchaseRoutes.get("", authMiddleware, getAllTransactions);

purchaseRoutes.patch("/verify/:paymentId", authMiddleware, authorizeRoles("admin"), verifyPurchase);
purchaseRoutes.patch("/deny/:paymentId", authMiddleware, authorizeRoles("admin"), denyPurchase);
purchaseRoutes.delete("/:paymentId", authMiddleware, authorizeRoles("admin"), deleteTransaction);

export default purchaseRoutes;
