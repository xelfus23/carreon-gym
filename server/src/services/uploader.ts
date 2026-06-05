import multer from "multer";
import multerS3 from "multer-s3";
import { s3 } from "../config/s3.ts";
import { env } from "../config/env.ts";
import type { Request } from "express";

export type ImageUploadType = "products" | "subscriptions" | "equipments" | "profiles" | "payments"


const UPLOAD_FOLDER_MAP: Record<ImageUploadType, string> = {
  profiles: "public/profiles",
  equipments: "public/equipments",
  products: "public/products",
  subscriptions: "public/subscriptions",
  payments: "private/payments"
};

export const uploader = multer({
  storage: multerS3({
    s3,
    bucket: env.AWS_S3_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req: Request, file, cb) => {


      const uploadType = (req.headers["x-upload-type"] as ImageUploadType);

      console.log(uploadType)

      const folder = UPLOAD_FOLDER_MAP[uploadType] || "public/misc";

      const fileName = `${folder}/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
});

// TODO: UPLOADERS