import { Router } from "express";
import loginController from "../controller/authController/login.controller.ts";

const authRouter = Router();

authRouter.post("/", loginController);

export default authRouter;
