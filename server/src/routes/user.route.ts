import { Router } from "express";
import createUser from "../controller/userController/createUser.controller.ts";

const userRouter = Router();

userRouter.post("/", createUser);


export default userRouter