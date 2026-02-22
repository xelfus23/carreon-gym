import { Router } from "express";
import { getMySubscription } from "./subscription.controller.ts";
import { mobileAuthMiddleware } from "../../middleware/authenticate.ts";

const subscriptionRoutes = Router();

// Mobile: read-only — create/cancel are admin-only (see subscription.admin.route.ts)
subscriptionRoutes.get("/me", mobileAuthMiddleware, getMySubscription);

export default subscriptionRoutes;
