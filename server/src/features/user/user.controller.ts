import type { Request, Response } from "express";
import { meDomain } from "../../domain/user/me.ts";
import { createUserDomain } from "../../domain/user/createUser.ts";
import { generateTokens } from "../../utils/generateTokens.ts";
import { sendEmail } from "../../services/email/emailer.ts";
import { welcomeEmail } from "../../services/email/emailTemplates/welcome.ts";
import { hashToken } from "../../utils/hashToken.ts";
import { saveSessionToDB } from "../../services/saveSession.ts";

export const webMeController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const data = await meDomain({ userId });

        // Return full user data for web admin
        return res.status(200).json({
            success: true,
            message: "User Retrieved",
            data: {
                user: {
                    id: data.id,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    username: data.username,
                    email: data.email,
                    role: data.role,
                    verified: data.verified,
                    phoneNumber: data.phoneNumber,
                    createdAt: data.createdAt,
                    lastLogin: data.lastLogin,
                    accountStatus: data.accountStatus,
                },
            },
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error("Web Me Error:", err.message);
            return res.status(500).json({
                success: false,
                message: "Server Error",
            });
        }
    }
};

// Mobile Gym App - Full profile including fitness data
export const mobileMeController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const data = await meDomain({ userId });

        // Return complete profile data for mobile app
        return res.status(200).json({
            success: true,
            message: "Profile Retrieved",
            data: {
                user: {
                    id: data.id,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    username: data.username,
                    email: data.email,
                    role: data.role,
                    verified: data.verified,
                    phoneNumber: data.phoneNumber,
                    profileImageUrl: data.profileImageUrl,
                    createdAt: data.createdAt,
                    profile: data.profile
                        ? {
                              heightCm: data.profile.heightCm,
                              gender: data.profile.gender,
                              birthDate: data.profile.birthDate,
                              goal: data.profile.goal,
                              activityLevel: data.profile.activityLevel,
                          }
                        : null,
                    currentStats: data.currentStats
                        ? {
                              weightKg: data.currentStats.weightKg,
                              bodyFatPercent: data.currentStats.bodyFatPercent,
                              muscleMassKg: data.currentStats.muscleMassKg,
                              lastRecorded: data.currentStats.lastRecorded,
                          }
                        : null,
                    subscription: data.subscription
                        ? {
                              status: data.subscription.status,
                              planName: data.subscription.planName,
                              startDate: data.subscription.startDate,
                              expiryDate: data.subscription.expiryDate,
                          }
                        : null,
                },
            },
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error("Mobile Me Error:", err.message);
            return res.status(500).json({
                success: false,
                message: "Server Error",
            });
        }
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, password, email, phoneNumber, username } =
            req.body;

        // Create user
        const user = await createUserDomain({
            firstName,
            lastName,
            password,
            email,
            phoneNumber,
            username,
        });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens({
            sub: user.id,
            role: user.role,
        });

        const refreshTokenHash = hashToken(refreshToken);

        // Save session to database
        await saveSessionToDB({
            userId: user.id,
            tokenHash: refreshTokenHash,
            deviceInfo: req.headers["user-agent"] ?? null,
            ip: req.ip || null,
        });

        // Send welcome email (non-blocking)
        sendEmail({
            to: user.email,
            subject: "Welcome to Careon Gym 👋",
            html: welcomeEmail(user.firstName),
        }).catch((err) => {
            console.error("Failed to send welcome email:", err);
            // Don't fail the registration if email fails
        });

        return res.status(201).json({
            success: true,
            message: "Registration Complete",
            data: {
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    role: user.role,
                    verified: user.verified,
                    createdAt: user.createdAt,
                },
                accessToken,
                refreshToken,
            },
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error("User creation error:", err.message);

            // Handle specific error cases
            if (err.message.includes("already exists")) {
                return res.status(409).json({
                    success: false,
                    message: err.message,
                });
            }

            if (
                err.message.includes("Missing") ||
                err.message.includes("Invalid")
            ) {
                return res.status(400).json({
                    success: false,
                    message: err.message,
                });
            }

            if (err.message.includes("8 characters")) {
                return res.status(400).json({
                    success: false,
                    message: err.message,
                });
            }

            return res.status(500).json({
                success: false,
                message: "Registration failed. Please try again.",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server Error",
        });
    }
};

export const uploadPicture = async (req: Request, res: Response) => {
    try {
        return res
            .status(200)
            .json({ success: true, message: "Upload Success" });
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            return res.status(500).json({
                success: false,
                message: "Server Error",
            });
        }
    }
};

