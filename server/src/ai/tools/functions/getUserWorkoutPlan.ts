import { WebSocket } from "ws";
import type { ToolCall } from "../../../types/index.ts";
import { getWorkoutPlansDomain } from "../../../domain/workout/getWorkoutPlan.ts";

export const getUserWorkoutPlan = async (
    ws: WebSocket,
    toolCall: ToolCall,
    userId: number,
) => {
    ws.send(
        JSON.stringify({
            type: "state",
            state: "checking user plan",
        }),
    );

    console.log("📋 Executing get_user_workout_plans...");

    const result = await getWorkoutPlansDomain({ userId: userId });

    console.log("✅ get_user_workout_plans result:", result);
    return result;
};
