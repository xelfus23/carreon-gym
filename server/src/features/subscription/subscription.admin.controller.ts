import type { Request, Response } from "express";
import { subscriptionService } from "../../services/subscriptionService.ts";

const PLAN_TYPE_TO_DAYS: Record<string, number> = {
    "1_day": 1,
    "1-week": 7,
    "1_week": 7,
    "1-month": 30,
    "1_month": 30,
    day: 1,
    week: 7,
    month: 30,
};

function buildPlanName(durationDays: number, explicitName?: string): string {
    if (explicitName?.trim()) return explicitName.trim();
    if (durationDays === 1) return "1 Day Plan";
    if (durationDays === 7) return "1 Week Plan";
    if (durationDays === 30) return "1 Month Plan";
    return `${durationDays}-Day Plan`;
}

/** Admin: create or update subscription for a member (user_id in body). */
export const createForMember = async (req: Request, res: Response) => {
    try {
        const { user_id, planType, durationDays, planName } = req.body as {
            user_id?: number;
            planType?: string;
            durationDays?: number;
            planName?: string;
        };

        if (user_id == null || typeof user_id !== "number" || !Number.isInteger(user_id)) {
            return res.status(400).json({
                success: false,
                message: "user_id (number) is required",
            });
        }

        let finalDurationDays: number | undefined;
        if (planType) {
            const normalized = String(planType).toLowerCase();
            if (normalized in PLAN_TYPE_TO_DAYS) {
                finalDurationDays = PLAN_TYPE_TO_DAYS[normalized];
            }
        }
        if (finalDurationDays == null) {
            if (
                typeof durationDays !== "number" ||
                !Number.isFinite(durationDays) ||
                durationDays <= 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid duration. Provide planType (1_day, 1_week, 1_month) or a positive durationDays.",
                });
            }
            finalDurationDays = Math.floor(durationDays);
        }

        const effectivePlanName = buildPlanName(finalDurationDays, planName);
        const subscription = await subscriptionService.createSubscription(
            user_id,
            effectivePlanName,
            finalDurationDays,
        );

        return res.status(200).json({
            success: true,
            message: "Subscription created/updated successfully",
            data: subscription,
        });
    } catch (err) {
        console.error("Admin create subscription error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to create or update subscription",
        });
    }
};

/** Admin: cancel subscription for a member (user_id in body). */
export const cancelForMember = async (req: Request, res: Response) => {
    try {
        const { user_id } = req.body as { user_id?: number };

        if (user_id == null || typeof user_id !== "number" || !Number.isInteger(user_id)) {
            return res.status(400).json({
                success: false,
                message: "user_id (number) is required",
            });
        }

        const subscription = await subscriptionService.cancelSubscription(user_id);
        return res.status(200).json({
            success: true,
            message: "Subscription cancelled",
            data: subscription,
        });
    } catch (err) {
        console.error("Admin cancel subscription error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel subscription",
        });
    }
};

/** Admin: get subscription for a member by user id. */
export const getForMember = async (req: Request, res: Response) => {
    try {
        const userId = Number(req.params.userId);
        if (!Number.isInteger(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user id",
            });
        }

        const subscription = await subscriptionService.getSubscription(userId);
        return res.status(200).json({
            success: true,
            data: subscription,
        });
    } catch (err) {
        console.error("Admin get subscription error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch subscription",
        });
    }
};
