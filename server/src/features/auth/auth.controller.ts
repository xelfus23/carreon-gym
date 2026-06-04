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
import { env } from "../../config/env.ts";

export const loginController = catchAsync(async (req: Request, res: Response) => {
  const user = await loginDomain(req.body);

  const isMobileClient = req.body.platform === "mobile";

  // 2. Enforce Role Guards for Admin Panel Web Access
  if (!isMobileClient && user.role === "member") {
    throw new AppError(
      "Access denied. Only staff and admins can log in here.",
      403,
      "AUTH_FORBIDDEN_ROLE",
    );
  }

  // 3. Token & Session Generation
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

  // 4. Send Response based on Platform Strategy
  if (!isMobileClient) {
    // Web / Electron: Store tokens securely in secure HttpOnly cookies
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000, // 15 mins
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
  }

  // Mobile (Expo React Native): Return tokens explicitly in JSON payload for AsyncStorage/SecureStore
  return res.status(200).json({
    success: true,
    message: "Login Success",
    data: {
      user: user,
      accessToken: accessToken,
      refreshToken: refreshToken,
    },
  });
});

//====================================================

export const logoutController = catchAsync(async (req: Request, res: Response) => {
  // 1. Unified Token Extraction (Check cookies first, then check fallback request body)
  const refreshToken =
    req.cookies?.refreshToken ?? req.body?.refreshToken;

  if (!refreshToken) {
    throw new AppError(
      "No active session",
      400,
      "MISSING_REFRESH_TOKEN",
    );
  }

  // 2. Validate Token Signature
  let decoded: any;
  try {
    decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch (err) {
    // Security fallback: clear browser cookies even if the signature expired
    res.clearCookie("accessToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
    res.clearCookie("refreshToken", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });

    throw new AppError(
      "Invalid Refresh Token",
      401,
      "INVALID_REFRESH_TOKEN",
    );
  }

  // 🌟 FIXED BUG: Your web used decoded.sub while mobile used decoded.id
  // Unified to check both or default to standard 'sub' claim
  const userId = decoded.sub || decoded.id;

  // 3. Database Session Revocation (Lookup and delete single device target)
  const { rows } = await pool.query(
    "SELECT id, refresh_token_hash FROM user_sessions WHERE user_id = $1",
    [userId],
  );

  let sessionId: number | null = null;
  for (const session of rows) {
    const match = await bcrypt.compare(refreshToken, session.refresh_token_hash);
    if (match) {
      sessionId = session.id;
      break;
    }
  }

  if (sessionId) {
    await pool.query("DELETE FROM user_sessions WHERE id = $1", [sessionId]);
  } else if (req.body?.refreshToken) {
    // If mobile app sends an explicit token but it's completely missing from DB session tables
    throw new AppError("Session not found", 404, "SESSION_NOT_FOUND");
  }

  // 4. Clear Cookies for Web Clients
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
});