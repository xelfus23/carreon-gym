import { addWorkoutDayDomain } from "../../../domain/workout/addWorkoutDay.ts";
import { WebSocket } from "ws";
import { deleteWorkoutPlanDomain } from "../../../domain/workout/deleteWorkoutPlan.ts";
import type { ToolCall } from "../../../types/index.ts";

export const addWorkoutDay = async (
    ws: WebSocket,
    args: any,
    userId: number,
) => {
    return await addWorkoutDayDomain({ args, userId });
};
