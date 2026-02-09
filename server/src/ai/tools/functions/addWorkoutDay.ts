import { addWorkoutDayDomain } from "../../../domain/workout/addWorkoutDay.ts";
import { WebSocket } from "ws";
import { deleteWorkoutPlanDomain } from "../../../domain/workout/deleteWorkoutPlan.ts";
import type { ToolCall } from "../../../types/index.ts";

export const addWorkoutDay = async (
    ws: WebSocket,
    toolCall: ToolCall,
    userId: number,
) => {
    ws.send(
        JSON.stringify({
            type: "state",
            state: "adding workout day",
        }),
    );

    const parsedArgs = JSON.parse(toolCall.arguments);
    const result = await addWorkoutDayDomain({ toolCall: parsedArgs, userId });
    console.log("✅ add_workout_day result:", result);
    return result;
};
