import type { Request, Response } from "express";
import { loginDomain } from "../../domain/auth/login.ts";
import { generateTokens } from "../../utils/generateTokens.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import pool from "../../config/pool.ts";

//====================================================
//====================================================
//====================================================

export const webLoginController = async (req: Request, res: Response) => {
    try {
        console.log(req.body);

        const user = await loginDomain(req.body);

        const { accessToken, refreshToken } = generateTokens({
            sub: user.id,
            role: user.role,
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

        // Return success response with user data
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
    } catch (err) {
        if (err instanceof Error) {
            return res.status(401).json({
                // Use 401 for auth failures
                success: false,
                message: err.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

//====================================================
//====================================================
//====================================================

export const mobileLoginController = async (req: Request, res: Response) => {
    try {
        console.log(req.body);

        const user = await loginDomain(req.body);

        const { accessToken, refreshToken } = generateTokens({
            sub: user.id,
            role: user.role,
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
    } catch (err) {
        if (err instanceof Error) {
            return res.status(500).json({
                success: false,
                message: err.message,
            });
        }
    }
};


//====================================================
//====================================================
//====================================================


export const webLogoutController = async (req: Request, res: Response) => {
    try {
        // Get refresh token from cookie instead of body
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "No active session",
            });
        }

        // Verify token signature first
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
            return res.status(401).json({
                success: false,
                message: "Invalid session",
            });
        }

        const userId = decoded.sub; // You used 'sub' in generateTokens

        // Get all sessions of user
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

        if (sessionId) {
            // Delete that session only (single device logout)
            await pool.query("DELETE FROM user_sessions WHERE id = $1", [
                sessionId,
            ]);
        }

        // Clear cookies
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
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

//====================================================
//====================================================
//====================================================

export const mobileLogoutController = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token required",
            });
        }

        // Verify token signature first
        let decoded: any;
        try {
            decoded = jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET!,
            );
        } catch {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token",
            });
        }

        const userId = decoded.id;

        // Get all sessions of user
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
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};



