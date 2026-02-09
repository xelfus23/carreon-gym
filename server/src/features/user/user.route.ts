import { Router } from "express";
import { authentication } from "../../middleware/authenticate.ts";
import { createUser, meController, uploadPicture } from "./user.controller.ts";
import { upload } from "../../services/multerUpload.ts";

const userRoutes = Router();

userRoutes.get("/me", authentication, meController);
userRoutes.post("/", createUser);
userRoutes.post("/upload", upload.single("image"), uploadPicture);

export default userRoutes;
