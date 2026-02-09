import { WebSocket } from "ws";
import type { ToolCall } from "../../../types/index.ts";
import { deleteWorkoutDayDomain } from "../../../domain/workout/deleteWorkoutDay.ts";

export const deleteWorkoutDay = async (
    ws: WebSocket,
    toolCall: ToolCall,
    userId: number,
) => {
    ws.send(
        JSON.stringify({
            type: "state",
            state: "deleting workout day",
        }),
    );

    const parsedArgs = JSON.parse(toolCall.arguments);

    const result = await deleteWorkoutDayDomain({
        toolCall: parsedArgs,
        userId: userId,
    });

    console.log("✅ delete_workout_day result:", result);
    return result;
};
