// src/controllers/workout.controller.ts
import type { Request, Response } from "express";
import { getWorkoutPlansDomain } from "../../domain/workout/getWorkoutPlan.ts";

export const getWorkoutPlan = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const plans = await getWorkoutPlansDomain(userId);

        return res.status(200).json({
            success: true,
            data: plans,
            message: "Fetch success",
        });
    } catch (err) {
        console.error("Get Plan Error:", err);
        return res.status(500).json({
            error: "Failed to fetch workout plans",
        });
    }
};
