import pool from "../config/pool.ts";
import {
    addWorkoutDay,
    getUserWorkoutPlans,
} from "../controller/toolController/addWorkoutDay.ts";
import { saveWorkoutPlan } from "../controller/toolController/saveWorkout.ts";

export async function handleToolCall(toolCall: any, userId: number) {
    console.log("\n========================================");
    console.log("🛠️  HANDLE TOOL CALL");
    console.log("========================================");
    console.log("Tool name:", toolCall.name);
    console.log("User ID:", userId);
    console.log("Raw arguments:", toolCall.arguments);

    let parsedArgs;
    try {
        parsedArgs = JSON.parse(toolCall.arguments);
        console.log("✅ Arguments parsed successfully");
        console.log("Parsed arguments:", JSON.stringify(parsedArgs, null, 2));
    } catch (parseError) {
        console.error("❌ Failed to parse tool arguments:", parseError);
        throw new Error(`Invalid tool arguments: ${parseError}`);
    }

    if (toolCall.name === "save_workout_plan") {
        console.log("📝 Executing save_workout_plan...");
        const result = await saveWorkoutPlan(
            { arguments: parsedArgs }, // Use parsed arguments
            userId,
        );
        console.log("✅ save_workout_plan result:", result);
        return result;
    }

    if (toolCall.name === "add_workout_day") {
        console.log("➕ Executing add_workout_day...");
        const result = await addWorkoutDay(
            { arguments: parsedArgs }, // Use parsed arguments
            userId,
        );
        console.log("✅ add_workout_day result:", result);
        return result;
    }

    if (toolCall.name === "get_user_workout_plans") {
        console.log("📋 Executing get_user_workout_plans...");
        const result = await getUserWorkoutPlans(userId);
        console.log("✅ get_user_workout_plans result:", result);
        return result;
    }

    console.error("❌ Unknown tool:", toolCall.name);
    throw new Error(`Unknown tool: ${toolCall.name}`);
}
