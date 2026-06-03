import { Router } from "express";
import {
  createUser,
  meController,
  updateProfile,
  updateStats,
  uploadPicture,
} from "./user.controller.ts";
import { uploadProfilePicture } from "../../services/multerUpload.ts";
import { authMiddleware } from "../../middleware/authenticate.ts";

const userRoutes = Router();

userRoutes.get("/me", authMiddleware, meController);


userRoutes.patch("/profiles", authMiddleware, updateProfile);
userRoutes.patch("/stats", authMiddleware, updateStats);

userRoutes.post("/upload", uploadProfilePicture.single("image"), uploadPicture);
userRoutes.post("/register", createUser);

export default userRoutes;
