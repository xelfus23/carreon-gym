import { Router } from "express";
import {
    mobileAuthMiddleware,
    webAuthMiddleware,
} from "../../middleware/authenticate.ts";
import {
    getAllTransactions,
    requestPurchase,
    verifyPurchase,
} from "./purchase.controller.ts";

const purchaseRoutes = Router();

// --- Member Routes (Mobile) ---
// Members can request a purchase and view their own transaction history
purchaseRoutes.post("/request", mobileAuthMiddleware, requestPurchase);
purchaseRoutes.get("/my-history", mobileAuthMiddleware, getAllTransactions);

// --- Admin Routes (Web/Electron) ---
// Admins can view all transactions and verify pending payments
purchaseRoutes.get("", webAuthMiddleware, getAllTransactions);
purchaseRoutes.patch("/verify/:paymentId", webAuthMiddleware, verifyPurchase);

export default purchaseRoutes;