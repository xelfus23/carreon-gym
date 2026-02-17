import { Router } from "express";
import {
    createUser,
    mobileMeController,
    uploadPicture,
    webMeController,
} from "./user.controller.ts";
import { upload } from "../../services/multerUpload.ts";
import {
    mobileAuthMiddleware,
    webAuthMiddleware,
} from "../../middleware/authenticate.ts";

const userRoutes = Router();

userRoutes.get("/mobile/me", mobileAuthMiddleware, mobileMeController);
userRoutes.get("/web/me", webAuthMiddleware, webMeController);

userRoutes.post("/register", createUser);
userRoutes.post("/upload", upload.single("image"), uploadPicture);

export default userRoutes;
