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
    
    console.log("\n========================================");
    console.log("🛠️  HANDLE TOOL CALL");
    console.log("========================================");
    console.log("Tool name:", toolCall.name);
    console.log("User ID:", userId);
    console.log("Tool ID:", toolCall.id);
    console.log("Arguments length:", toolCall.arguments.length);
    console.log(
        "Raw arguments:",
        toolCall.arguments.substring(0, 200) +
            (toolCall.arguments.length > 200 ? "..." : ""),
    );

    const handler = toolHandlers[toolCall.name];

    if (!handler) {
        console.error("❌ Unknown tool:", toolCall.name);
        throw new Error(`Unknown tool: ${toolCall.name}`);
    }

    try {
        // Validate and parse arguments
        let parsedArgs;
        try {
            parsedArgs = JSON.parse(toolCall.arguments);
        } catch (parseErr) {
            console.error("❌ Failed to parse tool arguments as JSON");
            console.error(
                "   Argument string length:",
                toolCall.arguments.length,
            );
            console.error("   Last 100 chars:", toolCall.arguments.slice(-100));
            console.error("   Parse error:", parseErr);
            throw new Error(
                `Invalid tool arguments JSON: ${(parseErr as Error).message}. Arguments may be incomplete or malformed.`,
            );
        }

        const result = await handler(ws, toolCall, userId);
        return result;
    } catch (error) {
        console.error(`❌ Tool error (${toolCall.name}):`, error);
        throw error;
    }
}
