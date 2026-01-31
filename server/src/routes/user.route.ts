import { Router } from "express";
import createUser from "../controller/userController/createUser.controller.ts";
import uploadPicture from "../controller/userController/uploadPicture.controller.ts";
import { upload } from "../services/Upload.ts";
import meController from "../controller/userController/me.controller.ts";
import { authMiddleware } from "../middleware/AuthMiddleware.ts";

const userRouter = Router();

userRouter.get("/me", authMiddleware, meController);
userRouter.post("/", createUser);
userRouter.post("/upload", upload.single("image"), uploadPicture);

export default userRouter;
