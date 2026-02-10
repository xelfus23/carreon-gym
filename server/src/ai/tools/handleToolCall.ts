import { WebSocket } from "ws";
import type { ToolCall } from "../../types/index.ts";
import { saveWorkoutPlan } from "./functions/saveWorkoutPlan.ts";
import { deleteWorkoutDay } from "./functions/deleteWorkoutDay.ts";
import { addWorkoutDay } from "./functions/addWorkoutDay.ts";
import { getUserWorkoutPlan } from "./functions/getUserWorkoutPlan.ts";

type ToolHandler = (
    ws: WebSocket,
    toolCall: ToolCall,
    userId: number,
) => Promise<any>;

const toolHandlers: Record<string, ToolHandler> = {
    save_workout_plan: saveWorkoutPlan,
    delete_workout_plan: saveWorkoutPlan,
    delete_workout_day: deleteWorkoutDay,
    add_workout_day: addWorkoutDay,
    get_user_workout_plans: getUserWorkoutPlan,
};

export async function handleToolCall(
    ws: WebSocket,
    toolCall: ToolCall,
    userId: number,
): Promise<any> {
    const handler = toolHandlers[toolCall.name];

    if (!handler) {
        throw new Error(`Unknown tool: ${toolCall.name}`);
    }

    try {
        let parsedArgs;
        
        try {
            parsedArgs = JSON.parse(toolCall.arguments);
        } catch (parseErr) {
            throw new Error(
                `Invalid tool arguments JSON: ${(parseErr as Error).message}. Arguments may be incomplete or malformed.`,
            );
        }

        const result = await handler(ws, toolCall, userId);
        return result;
    } catch (error) {
        throw error;
    }
}
