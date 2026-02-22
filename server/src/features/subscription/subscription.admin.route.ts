import { Router } from "express";
import {
    cancelForMember,
    createForMember,
    getForMember,
} from "./subscription.admin.controller.ts";
import { webAuthMiddleware } from "../../middleware/authenticate.ts";
import { protectAdmin } from "../../middleware/protectAdmin.ts";

const subscriptionAdminRoutes = Router();

subscriptionAdminRoutes.use(webAuthMiddleware);
subscriptionAdminRoutes.use(protectAdmin);

subscriptionAdminRoutes.post("/", createForMember);
subscriptionAdminRoutes.post("/cancel", cancelForMember);
subscriptionAdminRoutes.get("/:userId", getForMember);

export default subscriptionAdminRoutes;
