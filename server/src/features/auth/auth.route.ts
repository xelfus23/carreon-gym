import { Router } from "express";

import { refreshController } from "../../middleware/refresh.ts";
import { loginController, logoutController } from "./auth.controller.ts";

const authRoutes = Router();

authRoutes.post("/", loginController);
authRoutes.post("/logout", logoutController);
authRoutes.post("/refresh", refreshController);

export default authRoutes;
