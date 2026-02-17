import { WebSocket } from "ws";
import { createWorkoutPlanDomain } from "../../../domain/workout/createWorkoutPlan.ts";

export const createWorkoutPlan = async (
    ws: WebSocket,
    args: any,
    userId: number,
) => {
    ws.send(
        JSON.stringify({
            type: "state",
            state: "Creating Workout Plan",
        }),
    );

    const result = await createWorkoutPlanDomain({ args, userId });

    return result;
};
