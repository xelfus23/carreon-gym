import { Router } from "express";
import {
  deleteTransaction,
  denyPurchase,
  getAllTransactions,
  manualLogPurchase,
  requestPurchase,
  updateReceiptProof,
  verifyPurchase,
} from "./purchase.controller.ts";
import { authMiddleware } from "../../middleware/authenticate.ts";
import { authorizeRoles } from "../../middleware/roleGuard.ts";

const purchaseRoutes = Router();

purchaseRoutes.get("/my-history", authMiddleware, getAllTransactions);

purchaseRoutes.get("", authMiddleware, getAllTransactions);

purchaseRoutes.post("", authMiddleware, requestPurchase);

purchaseRoutes.patch(
  "/:paymentId/proof",
  authMiddleware,
  updateReceiptProof
);

purchaseRoutes.post(
  "/manual-log",
  authMiddleware,
  authorizeRoles("admin"),
  manualLogPurchase,
);

purchaseRoutes.patch(
  "/verify/:paymentId",
  authMiddleware,
  authorizeRoles("admin"),
  verifyPurchase,
);

purchaseRoutes.patch(
  "/deny/:paymentId",
  authMiddleware,
  authorizeRoles("admin"),
  denyPurchase,
);

purchaseRoutes.delete(
  "/:paymentId",
  authMiddleware,
  authorizeRoles("admin"),
  deleteTransaction,
);

export default purchaseRoutes;
