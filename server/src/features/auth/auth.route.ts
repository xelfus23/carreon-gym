import { Router } from "express";
import { loginController } from "./auth.controller.ts";

const authRoutes = Router();

authRoutes.post("/", loginController);

export default authRoutes;
