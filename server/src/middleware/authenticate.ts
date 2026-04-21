// middleware/authMiddleware.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";
import { catchAsync } from "../utils/catchAsync.ts";
import { AppError } from "../utils/appError.ts";
import type { AuthRequest } from "../types/index.ts";

export const webAuthMiddleware = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      throw new AppError(
        "No access token provided",
        400,
        "MISSING_ACCESS_TOKEN",
      );
    }

    const decoded = jwt.verify(
      accessToken,
      env.JWT_ACCESS_SECRET,
    ) as unknown as {
      sub: number;
      role: "member" | "trainer" | "admin";
    };

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  },
);

export const mobileAuthMiddleware = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        "Please log in to access this resource.",
        401,
        "AUTH_REQUIRED",
      );
    }

    const accessToken = authHeader.split(" ")[1];

    if (!accessToken) {
      throw new AppError(
        "No access token provided",
        400,
        "MISSING_ACCESS_TOKEN",
      );
    }

    const decoded = jwt.verify(
      accessToken,
      env.JWT_ACCESS_SECRET,
    ) as unknown as {
      sub: number;
      role: "member" | "trainer" | "admin";
    };

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  },
);
