import { Router } from "express";
import { authMiddleware } from "../../middleware/authenticate.ts";
import { uploader } from "../../services/uploader.ts";
import { uploadImage } from "./imageUpload.controller.ts";

const ImageRoutes = Router()

ImageRoutes.post(
  "",
  authMiddleware,
  uploader.single("image"),
  uploadImage,
);

export default ImageRoutes