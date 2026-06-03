import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";
import { catchAsync } from "../utils/catchAsync.ts";
import { AppError } from "../utils/appError.ts";
import type { AuthRequest } from "../types/index.ts";

export const authMiddleware = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    let accessToken: string | undefined = undefined;

    // 1. Try extracting from cookies (Web App)
    if (req.cookies?.accessToken) {
      accessToken = req.cookies.accessToken;
    }
    // 2. Fallback to extracting from Authorization Header (Mobile App)
    else if (req.headers.authorization?.startsWith("Bearer ")) {
      accessToken = req.headers.authorization.split(" ")[1];
    }

    // 3. If neither provided a token, block the request
    if (!accessToken) {
      throw new AppError(
        "Authentication required. No access token provided.",
        401,
        "AUTH_REQUIRED"
      );
    }

    // 4. Verify token signatures identically
    const decoded = jwt.verify(
      accessToken,
      env.JWT_ACCESS_SECRET,
    ) as unknown as {
      sub: number;
      role: "member" | "trainer" | "admin";
    };

    // 5. Inject payload into user object context safely
    const authReq = req as AuthRequest;
    authReq.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  },
);