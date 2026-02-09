import { WebSocket } from "ws";
import { deleteWorkoutPlanDomain } from "../../../domain/workout/deleteWorkoutPlan.ts";
import type { ToolCall } from "../../../types/index.ts";

export const deleteWorkoutPlan = async (
    ws: WebSocket,
    toolCall: ToolCall,
    userId: number,
) => {
    ws.send(
        JSON.stringify({
            type: "state",
            state: "deleting workout plan",
        }),
    );

    const parsedArgs = JSON.parse(toolCall.arguments);

    const result = await deleteWorkoutPlanDomain({
        toolCall: parsedArgs,
        userId: userId,
    });

    console.log("✅ delete_workout_plan result:", result);
    return result;
};
