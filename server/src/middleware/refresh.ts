import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { hashToken } from "../utils/hashToken.ts";
import pool from "../config/pool.ts";
import { env } from "../config/env.ts";

export const webRefresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: "No refresh token",
        });
    }

    try {
        const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;

        const hashed = hashToken(refreshToken);

        const session = await pool.query(
            `SELECT * FROM user_sessions 
             WHERE user_id = $1 
             AND refresh_token_hash = $2`,
            [payload.sub, hashed],
        );

        if (session.rowCount === 0) {
            // Clear invalid cookies
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");
            return res.status(403).json({
                success: false,
                message: "Invalid session",
            });
        }

        const accessToken = jwt.sign(
            { sub: payload.sub, role: payload.role },
            env.JWT_ACCESS_SECRET,
            { expiresIn: "15m" },
        );

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
        });

        return res.json({
            success: true,
            message: "Token refreshed",
        });
    } catch (error) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");

        return res.status(403).json({
            success: false,
            message: "Refresh Error: Invalid Token",
        });
    }
};

// Mobile refresh - uses request body (keep your existing logic)
export const mobileRefresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({
            success: false,
            message: "No refresh token",
        });
    }

    try {
        const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;

        const hashed = hashToken(refreshToken);

        const session = await pool.query(
            `SELECT * FROM user_sessions 
             WHERE user_id = $1 
             AND refresh_token_hash = $2`,
            [payload.sub, hashed],
        );

        if (session.rowCount === 0) {
            return res.status(403).json({
                success: false,
                message: "Invalid session",
            });
        }

        const accessToken = jwt.sign(
            { sub: payload.sub, role: payload.role },
            env.JWT_ACCESS_SECRET,
            { expiresIn: "15m" },
        );

        return res.json({
            success: true,
            message: "Token Generated",
            data: { accessToken: accessToken },
        });
    } catch {
        return res.status(403).json({
            success: false,
            message: "Refresh Error: Invalid Token",
        });
    }
};
