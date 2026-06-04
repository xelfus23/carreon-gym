import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { hashToken } from "../utils/hashToken.ts";
import pool from "../config/pool.ts";
import { env } from "../config/env.ts";
import { generateTokens } from "../utils/generateTokens.ts";

export const refreshController = async (req: Request, res: Response) => {
  // 1. Extract the token from either Web cookies or Mobile request body
  const refreshToken =
    req.cookies?.refreshToken ?? req.body?.refreshToken;

  // Determine client type based on request delivery style
  const isMobileClient =
    req.headers["x-client-platform"] === "mobile" ||
    !!req.body?.refreshToken;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ success: false, message: "No refresh token provided" });
  }

  try {
    // 2. Verify the token signature and integrity
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;

    // Safety check for mixed payload properties across old logic iterations
    const userId = payload.sub || payload.id;
    const userRole = payload.role;

    // 3. Database session lookup via hashed token string
    const hashed = hashToken(refreshToken);
    const session = await pool.query(
      `SELECT id FROM user_sessions WHERE user_id = $1 AND refresh_token_hash = $2`,
      [userId, hashed],
    );

    // If the token is valid but doesn't exist in our DB, it could be reused/compromised
    if (session.rowCount === 0) {
      if (!isMobileClient) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
      }
      return res
        .status(403)
        .json({ success: false, message: "Session invalid or expired" });
    }

    // 4. Generate the rotated token pair
    const { accessToken, refreshToken: newRefreshToken } = generateTokens({
      sub: userId,
      role: userRole,
    });
    const newHashed = hashToken(newRefreshToken);

    // 5. Update the session table (Token Rotation Principle)
    await pool.query(
      `UPDATE user_sessions 
       SET refresh_token_hash = $1,
           last_used_at = NOW(),
           expires_at = NOW() + INTERVAL '7 days'
       WHERE user_id = $2 AND refresh_token_hash = $3`,
      [newHashed, userId, hashed],
    );

    // 6. Return response based on client storage strategy
    if (!isMobileClient) {
      // Browser / Electron Admin Dashboard
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 mins
      });

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.json({ success: true, message: "Token refreshed successfully" });
    }

    // Expo Mobile Client
    return res.json({
      success: true,
      message: "Token Generated",
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });

  } catch (error) {
    // Catch block handles token expiration signatures or structure failures
    if (!isMobileClient) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
    }

    return res
      .status(403)
      .json({ success: false, message: "Refresh Error: Invalid Token" });
  }
};