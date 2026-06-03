import type { Request, Response } from "express";
import { createProductDomain } from "../../domain/products/createProductDomain.ts";
import { catchAsync } from "../../utils/catchAsync.ts";
import { getProductsDomain } from "../../domain/products/getProductsDomain.ts";
import { updateProductDomain } from "../../domain/products/updateProductDomain.ts";
import { deleteProductDomain } from "../../domain/products/deleteProductDomain.ts";
import { AppError } from "../../utils/appError.ts";

export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const data = await createProductDomain(req.body);
  res.status(201).json({ success: true, message: "Product Created", data });
});

export const getAllProducts = catchAsync(
  async (_req: Request, res: Response) => {
    const data = await getProductsDomain();
    res.status(200).json({ success: true, data });
  },
);

export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = await updateProductDomain(Number(id), req.body);
  res.status(200).json({ success: true, message: "Product Updated", data });
});

export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await deleteProductDomain(Number(id));
  res.status(200).json({ success: true, message: "Product Deleted" });
});

export const uploadProductImage = catchAsync(async (req: Request, res: Response) => {
  const file = (req as any).file;

  if (!file) throw new AppError("No file uploaded", 400);

  const url = file.location as string | undefined;

  if (!url) throw new AppError("Upload failed", 500);

  return res.status(200).json({ success: true, message: "Upload Success", data: { url } });
});
