import { WebSocket } from "ws";
import type { ToolCall } from "../../../types/index.ts";
import { deleteWorkoutDayDomain } from "../../../domain/workout/deleteWorkoutDay.ts";

export const deleteWorkoutDay = async (
    ws: WebSocket,
    args: any,
    userId: number,
) => {
    return await deleteWorkoutDayDomain({ args, userId });
};
