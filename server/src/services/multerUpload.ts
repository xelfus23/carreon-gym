import multer from "multer";
import multerS3 from "multer-s3";
import { s3 } from "../config/s3.ts";
import { configDotenv } from "dotenv";
import { env } from "../config/env.ts";

export const upload = multer({
    storage: multerS3({
        s3,
        bucket: env.AWS_S3_BUCKET!,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        key: (req, file, cb) => {
            const fileName = `users/${Date.now()}-${file.originalname}`;
            cb(null, fileName);
        },
    }),
});
