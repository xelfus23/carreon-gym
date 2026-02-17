import { saveWorkoutPlanDomain } from "../../../domain/workout/saveWorkout.ts";
import { WebSocket } from "ws";

export const saveWorkoutPlan = async (
    ws: WebSocket,
    args: any,
    userId: number,
) => {
    ws.send(
        JSON.stringify({
            type: "state",
            state: "Saving workout",
        }),
    );

    const result = await saveWorkoutPlanDomain({ args, userId });

    return result;
};
