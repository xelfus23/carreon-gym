import { AppError } from "../../utils/appError.ts";
import { catchAsync } from "../../utils/catchAsync.ts";
import type { Request, Response } from "express";

export const uploadImage = catchAsync(async (req: Request, res: Response) => {
  const file = (req as any).file;

  if (!file) throw new AppError("No file uploaded", 400);

  const url = file.location as string | undefined;

  if (!url) throw new AppError("Upload failed", 500);

  return res.status(200).json({ success: true, message: "Upload Success", data: { url } });
});