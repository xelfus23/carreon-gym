import { WebSocket } from "ws";
import type { ToolCall } from "../../../types/index.ts";
import { deleteWorkoutDayDomain } from "../../../domain/workout/deleteWorkoutDay.ts";

export const deleteWorkoutDay = async (
    ws: WebSocket,
    args: any,
    userId: number,
) => {
    ws.send(
        JSON.stringify({
            type: "state",
            state: "Deleting workout day",
        }),
    );

    const result = await deleteWorkoutDayDomain({ args, userId });

    return result;
};
