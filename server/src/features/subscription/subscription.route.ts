import { Router } from "express";
import {
  getSubscriptionPlans,
} from "./subscription.controller.ts";
import { getUserSubscription } from "../userSubscription/userSubscription.controller.ts";
import { authMiddleware } from "../../middleware/authenticate.ts";

const subscriptionRoutes = Router();

subscriptionRoutes.get("/me", authMiddleware, getUserSubscription);
subscriptionRoutes.get("/plans", authMiddleware, getSubscriptionPlans);

export default subscriptionRoutes;
