import type { Request, Response } from "express";
import { loginDomain } from "../../domain/auth/login.ts";
import { generateTokens } from "../../utils/generateTokens.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pool from "../../config/pool.ts";
import { hashToken } from "../../utils/hashToken.ts";
import { saveSessionToDB } from "../../services/saveSession.ts";
import { catchAsync } from "../../utils/catchAsync.ts";
import { AppError } from "../../utils/appError.ts";

export const webLoginController = catchAsync(
    async (req: Request, res: Response) => {
        const user = await loginDomain(req.body);

        if (user.role === "member") {
            throw new AppError(
                "Access denied. Only staff and admins can log in here.",
                403,
                "AUTH_FORBIDDEN_ROLE",
            );
        }

        const { accessToken, refreshToken } = generateTokens({
            sub: user.id,
            role: user.role,
        });
        const refreshTokenHash = hashToken(refreshToken);

        await saveSessionToDB({
            userId: user.id,
            tokenHash: refreshTokenHash,
            deviceInfo: req.headers["user-agent"] ?? null,
            ip: req.ip || null,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 15 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    },
);

//====================================================
//====================================================
//====================================================

export const mobileLoginController = catchAsync(
    async (req: Request, res: Response) => {
        const user = await loginDomain(req.body);

        const { accessToken, refreshToken } = generateTokens({
            sub: user.id,
            role: user.role,
        });

        const refreshTokenHash = hashToken(refreshToken);

        await saveSessionToDB({
            userId: user.id,
            tokenHash: refreshTokenHash,
            deviceInfo: req.headers["user-agent"] ?? null,
            ip: req.ip || null,
        });

        return res.status(200).json({
            success: true,
            message: "Login Success",
            data: {
                user: user,
                accessToken: accessToken,
                refreshToken: refreshToken,
            },
        });
    },
);

//====================================================
//====================================================
//====================================================

export const webLogoutController = catchAsync(
    async (req: Request, res: Response) => {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            throw new AppError(
                "No active session",
                400,
                "MISSING_REFRESH_TOKEN",
            );
        }

        let decoded: any;

        try {
            decoded = jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET!,
            );
        } catch {
            // Clear cookies even if token is invalid
            res.clearCookie("accessToken");
            res.clearCookie("refreshToken");

            throw new AppError(
                "Invalid Refresh Token",
                401,
                "INVALID_REFRESH_TOKEN",
            );
        }

        const userId = decoded.sub;

        const { rows } = await pool.query(
            "SELECT id, refresh_token_hash FROM user_sessions WHERE user_id = $1",
            [userId],
        );

        let sessionId: number | null = null;

        for (const session of rows) {
            const match = await bcrypt.compare(
                refreshToken,
                session.refresh_token_hash,
            );

            if (match) {
                sessionId = session.id;
                break;
            }
        }

        if (sessionId) {
            await pool.query("DELETE FROM user_sessions WHERE id = $1", [
                sessionId,
            ]);
        }

        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        return res.json({
            success: true,
            message: "Logged out successfully",
        });
    },
);

//====================================================
//====================================================
//====================================================

export const mobileLogoutController = catchAsync(
    async (req: Request, res: Response) => {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw new AppError(
                "No active session",
                400,
                "MISSING_REFRESH_TOKEN",
            );
        }

        let decoded: any;

        try {
            decoded = jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET!,
            );
        } catch {
            throw new AppError(
                "Invalid Refresh Token",
                401,
                "INVALID_REFRESH_TOKEN",
            );
        }

        const userId = decoded.id;

        const { rows } = await pool.query(
            "SELECT id, refresh_token_hash FROM user_sessions WHERE user_id = $1",
            [userId],
        );

        // Find matching hash
        let sessionId: number | null = null;

        for (const session of rows) {
            const match = await bcrypt.compare(
                refreshToken,
                session.refresh_token_hash,
            );

            if (match) {
                sessionId = session.id;
                break;
            }
        }

        if (!sessionId) {
            return res.status(404).json({
                success: false,
                message: "Session not found",
            });
        }

        // Delete that session only (single device logout)
        await pool.query("DELETE FROM user_sessions WHERE id = $1", [
            sessionId,
        ]);

        return res.json({
            success: true,
            message: "Logged out successfully",
        });
    },
);
