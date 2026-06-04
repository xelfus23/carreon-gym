import type { Request, Response } from "express";
import { meDomain } from "../../domain/user/me.ts";
import { createUserDomain } from "../../domain/user/createUser.ts";
import { generateTokens } from "../../utils/generateTokens.ts";
import { sendEmail } from "../../services/email/emailer.ts";
import { welcomeEmail } from "../../services/email/emailTemplates/welcome.ts";
import { hashToken } from "../../utils/hashToken.ts";
import { saveSessionToDB } from "../../services/saveSession.ts";
import { catchAsync } from "../../utils/catchAsync.ts";
import { AppError } from "../../utils/appError.ts";
import { mapUserData } from "../../utils/map.ts";
import {
  addBodyMetricQuery,
  updateProfileQuery,
} from "../../repositories/user.repository.ts";


export const meController = catchAsync(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) throw new AppError("Invalid User ID", 401, "INVALID_URSER_ID");

    const data = await meDomain({ userId });

    return res.status(200).json({
      success: true,
      message: "Profile Retrieved",
      data: {
        user: mapUserData(data),
      },
    });
  },
);

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const { firstName, lastName, password, email, phoneNumber } = req.body;

  const user = await createUserDomain({
    firstName,
    lastName,
    password,
    email,
    phoneNumber,
  });

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

  sendEmail({
    to: user.email,
    subject: "Welcome to Careon Gym 👋",
    html: welcomeEmail(user.firstName),
  }).catch((err) => {
    console.error("Failed to send welcome email:", err);
  });

  return res.status(201).json({
    success: true,
    message: "Registration Complete",
    data: {
      user: { ...mapUserData(user), phoneNumber: user.phoneNumber },
      accessToken,
      refreshToken,
    },
  });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const updates = req.body;
  const userId = Number(req.user?.id);

  const updatedProfile = await updateProfileQuery(userId!, updates);

  return res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
    data: updatedProfile,
  });
});

export const updateStats = catchAsync(async (req: Request, res: Response) => {
  const updates = req.body;
  const userId = Number(req.user?.id);

  const updatedStats = await addBodyMetricQuery(userId!, updates);

  return res.status(200).json({
    success: true,
    message: "Stats Updated Successfully",
    data: updatedStats,
  });
});
