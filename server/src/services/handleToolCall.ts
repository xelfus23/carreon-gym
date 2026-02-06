import { WebSocket } from "ws";
import {
    addWorkoutDay,
    getUserWorkoutPlans,
} from "../controller/workoutController/addWorkoutDay.ts";
import { saveWorkoutPlan } from "../controller/workoutController/saveWorkout.ts";
import type { ToolCall } from "../types/index.ts";
import { deleteWorkoutPlan } from "../controller/workoutController/deleteWorkoutPlan.ts";
import { deleteWorkoutDay } from "../controller/workoutController/deleteWorkoutDay.ts";

type ToolHandler = (
    ws: WebSocket,
    toolCall: ToolCall,
    userId: number,
) => Promise<any>;

const toolHandlers: Record<string, ToolHandler> = {
    save_workout_plan: async (ws, toolCall, userId) => {
        ws.send(
            JSON.stringify({
                type: "state",
                state: "saving workout plan",
            }),
        );

        let parsedArgs;
        try {
            parsedArgs = JSON.parse(toolCall.arguments);
        } catch (e) {
            console.warn(
                "⚠️  First parse attempt failed, trying to fix incomplete JSON...",
            );
            try {
                // Try to close any incomplete strings or objects
                let fixedJson = toolCall.arguments.trim();
                // Count braces
                const openBraces = (fixedJson.match(/{/g) || []).length;
                const closeBraces = (fixedJson.match(/}/g) || []).length;
                for (let i = 0; i < openBraces - closeBraces; i++) {
                    fixedJson += "}";
                }
                parsedArgs = JSON.parse(fixedJson);
                console.log("✅ Successfully recovered incomplete JSON");
            } catch (recoveryErr) {
                console.error("❌ Could not recover JSON, giving up");
                throw e;
            }
        }
        const result = await saveWorkoutPlan({ arguments: parsedArgs }, userId);
        console.log("✅ save_workout_plan result:", result);
        return result;
    },

    delete_workout_plan: async (ws, toolCall, userId) => {
        ws.send(
            JSON.stringify({
                type: "state",
                state: "deleting workout plan",
            }),
        );

        const parsedArgs = JSON.parse(toolCall.arguments);
        const result = await deleteWorkoutPlan(
            { arguments: parsedArgs },
            userId,
        );
        console.log("✅ delete_workout_plan result:", result);
        return result;
    },

    delete_workout_day: async (ws, toolCall, userId) => {
        ws.send(
            JSON.stringify({
                type: "state",
                state: "deleting workout day",
            }),
        );

        const parsedArgs = JSON.parse(toolCall.arguments);
        const result = await deleteWorkoutDay(
            { arguments: parsedArgs },
            userId,
        );
        console.log("✅ delete_workout_day result:", result);
        return result;
    },

    add_workout_day: async (ws, toolCall, userId) => {
        ws.send(
            JSON.stringify({
                type: "state",
                state: "adding workout day",
            }),
        );

        const parsedArgs = JSON.parse(toolCall.arguments);
        const result = await addWorkoutDay({ arguments: parsedArgs }, userId);
        console.log("✅ add_workout_day result:", result);
        return result;
    },

    get_user_workout_plans: async (ws, toolCall, userId) => {
        ws.send(
            JSON.stringify({
                type: "state",
                state: "checking user plan",
            }),
        );

        console.log("📋 Executing get_user_workout_plans...");
        const result = await getUserWorkoutPlans(userId);
        console.log("✅ get_user_workout_plans result:", result);
        return result;
    },
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
