import { saveWorkoutPlanDomain } from "../../../domain/workout/saveWorkout.ts";
import { WebSocket } from "ws";
import type { ToolCall } from "../../../types/index.ts";

export const saveWorkoutPlan = async (
    ws: WebSocket,
    toolCall: ToolCall,
    userId: number,
) => {
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
            let fixedJson = toolCall.arguments.trim();
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

    const result = await saveWorkoutPlanDomain({
        args: parsedArgs,
        userId: userId,
    });

    console.log("✅ save_workout_plan result:", result);
    return result;
};
