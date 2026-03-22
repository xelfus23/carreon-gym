import { WebSocket } from "ws";
import { deleteWorkoutPlanDomain } from "../../../domain/workout/deleteWorkoutPlan.ts";

export const deleteWorkoutPlan = async (
    ws: WebSocket,
    args: any,
    userId: number,
) => {
    return await deleteWorkoutPlanDomain({ args, userId });
};
