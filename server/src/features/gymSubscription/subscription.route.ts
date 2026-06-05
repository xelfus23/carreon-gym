import { Router } from "express";
import {
  createSubscriptionPlan,
  getSubscriptionPlans,
  updateSubscriptionPlan,
} from "./subscription.controller.ts";
import { getUserSubscription } from "../userSubscription/userSubscription.controller.ts";
import { authMiddleware } from "../../middleware/authenticate.ts";
import { authorizeRoles } from "../../middleware/roleGuard.ts";

const subscriptionRoutes = Router();

subscriptionRoutes.post(
  "",
  authMiddleware,
  authorizeRoles("admin"),
  createSubscriptionPlan,
);

subscriptionRoutes.patch("/:id", authMiddleware, updateSubscriptionPlan);
subscriptionRoutes.get("/me", authMiddleware, getUserSubscription);
subscriptionRoutes.get("", authMiddleware, getSubscriptionPlans);

export default subscriptionRoutes;
