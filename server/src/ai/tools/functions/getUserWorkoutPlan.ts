import { WebSocket } from "ws";
import type { ToolCall } from "../../../types/index.ts";
import { getWorkoutPlansDomain } from "../../../domain/workout/getWorkoutPlan.ts";

export const getUserWorkoutPlan = async (
    ws: WebSocket,
    args: any,
    userId: number,
) => {
    return await getWorkoutPlansDomain({ userId });
};
