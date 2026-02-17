import { addWorkoutDayDomain } from "../../../domain/workout/addWorkoutDay.ts";
import { WebSocket } from "ws";
import { deleteWorkoutPlanDomain } from "../../../domain/workout/deleteWorkoutPlan.ts";
import type { ToolCall } from "../../../types/index.ts";
import { addExerciseDomain } from "../../../domain/workout/addExercise.ts";

export const addExercise = async (ws: WebSocket, args: any, userId: number) => {
    ws.send(
        JSON.stringify({
            type: "state",
            state: "Adding new day",
        }),
    );

    const result = await addExerciseDomain({ args, userId });

    return result;
};
