import { Router } from "express";
import { webAuthMiddleware } from "../../middleware/authenticate.ts";
import { getStatsController } from "./stats.controller.ts";

const statsRoutes = Router();

statsRoutes.use(webAuthMiddleware);

statsRoutes.get("", getStatsController);

export default statsRoutes;
