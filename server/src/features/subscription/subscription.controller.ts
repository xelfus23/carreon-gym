import type { Request, Response } from "express";
import { subscriptionService } from "../../services/subscription.service.ts";

/** Mobile only: get current user's subscription (read-only). */
export const getMySubscription = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const subscription = await subscriptionService.getSubscription(userId);

        return res.status(200).json({
            success: true,
            data: subscription,
        });
    } catch (err) {
        console.error("Get Subscription Error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch subscription",
        });
    }
};

