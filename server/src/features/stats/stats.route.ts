import { Router } from "express";
import { getStatsController } from "./stats.controller.ts";
import { authMiddleware } from "../../middleware/authenticate.ts";
import { authorizeRoles } from "../../middleware/roleGuard.ts";

const statsRoutes = Router();

statsRoutes.get("", authMiddleware, authorizeRoles("admin"), getStatsController);

export default statsRoutes;
