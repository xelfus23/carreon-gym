import { Router } from "express";
import {
    mobileLoginController,
    mobileLogoutController,
    webLoginController,
    webLogoutController,
} from "./auth.controller.ts";
import { mobileRefresh, webRefresh } from "../../middleware/refresh.ts";

const authRoutes = Router();

authRoutes.post("/web", webLoginController);
authRoutes.post("/web/logout", webLogoutController);
authRoutes.post("/web/refresh", webRefresh);

// Mobile routes (use body/tokens)
authRoutes.post("/mobile", mobileLoginController);
authRoutes.post("/mobile/logout", mobileLogoutController);
authRoutes.post("/mobile/refresh", mobileRefresh);

export default authRoutes;
