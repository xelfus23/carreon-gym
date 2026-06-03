import { Router } from "express";
import {
  cancelUserSubscription,
  createUserSubscription,
  getUserSubscription,
  resetUserSubscription,
} from "./userSubscription.controller.ts";
import { authMiddleware } from "../../middleware/authenticate.ts";
import { authorizeRoles } from "../../middleware/roleGuard.ts";

const userSubscriptionRoutes = Router();

userSubscriptionRoutes.post("/", authMiddleware, createUserSubscription);
userSubscriptionRoutes.post("/cancel", authMiddleware, authorizeRoles("admin"), cancelUserSubscription);
userSubscriptionRoutes.post("/reset", authMiddleware, authorizeRoles("admin"), resetUserSubscription);
userSubscriptionRoutes.get("/:userId", authMiddleware, getUserSubscription);

export default userSubscriptionRoutes;
