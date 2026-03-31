import { addWorkoutDayDomain } from "../../../domain/workout/addWorkoutDay.ts";
import { WebSocket } from "ws";

export const addWorkoutDay = async (
    ws: WebSocket,
    args: any,
    userId: number,
) => {
    return await addWorkoutDayDomain({ args, userId });
};
