import multer from "multer";
import multerS3 from "multer-s3";
import { s3 } from "../config/s3.ts";
import { env } from "../config/env.ts";

export const uploadProfilePicture = multer({
  storage: multerS3({
    s3,
    bucket: env.AWS_S3_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileName = `public/profiles/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
});

export const uploadAssetImages = multer({
  storage: multerS3({
    s3,
    bucket: env.AWS_S3_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileName = `public/assets/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
})

export const uploadProductImages = multer({
  storage: multerS3({
    s3,
    bucket: env.AWS_S3_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileName = `public/products/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
})

export const uploadPaymentReceipt = multer({
  storage: multerS3({
    s3,
    bucket: env.AWS_S3_BUCKET_NAME!,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const fileName = `private/payments/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
});
