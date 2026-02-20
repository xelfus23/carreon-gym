// middleware/authMiddleware.ts
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";

// Web Admin - Cookie-based auth
export const webAuthMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: "No access token provided",
            });
        }

        const decoded = jwt.verify(
            accessToken,
            env.JWT_ACCESS_SECRET,
        ) as unknown as {
            sub: number;
            role: string;
        };

        // Attach user info to request
        (req as any).user = {
            id: decoded.sub,
            role: decoded.role,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: "Access token expired",
                code: "TOKEN_EXPIRED",
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid access token",
        });
    }
};

export const mobileAuthMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No access token provided",
            });
        }

        const accessToken = authHeader.split(" ")[1];

        if (!accessToken)
            return res.status(401).json({
                success: false,
                message: "Malformed token",
            });

        const decoded = jwt.verify(
            accessToken,
            env.JWT_ACCESS_SECRET,
        ) as unknown as { sub: number; role: string };

        (req as any).user = {
            id: decoded.sub,
            role: decoded.role,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                success: false,
                message: "Access token expired",
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid access token",
        });
    }
};