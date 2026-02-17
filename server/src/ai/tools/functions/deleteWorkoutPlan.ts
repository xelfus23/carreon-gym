import { WebSocket } from "ws";
import { deleteWorkoutPlanDomain } from "../../../domain/workout/deleteWorkoutPlan.ts";

export const deleteWorkoutPlan = async (
    ws: WebSocket,
    args: any,
    userId: number,
) => {
    ws.send(
        JSON.stringify({
            type: "state",
            state: "Deleting workout plan",
        }),
    );

    const result = await deleteWorkoutPlanDomain({ args, userId });

    console.log("✅ delete_workout_plan result:", result);
    return result;
};
