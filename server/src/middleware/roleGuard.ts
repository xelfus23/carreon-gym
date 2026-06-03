import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/index.ts";
import { AppError } from "../utils/appError.ts";

export const authorizeRoles = (...allowedRoles: Array<"member" | "trainer" | "admin">) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new AppError(
        "You do not have permission to access this resource.",
        403,
        "FORBIDDEN"
      );
    }
    next();
  };
};