import { WebSocket } from "ws";
import type { ToolCall } from "../../types/index.ts";
import { deleteWorkoutDay } from "./functions/deleteWorkoutDay.ts";
import { addWorkoutDay } from "./functions/addWorkoutDay.ts";
import { getUserWorkoutPlan } from "./functions/getUserWorkoutPlan.ts";
import { deleteWorkoutPlan } from "./functions/deleteWorkoutPlan.ts";
import { createWorkoutPlan } from "./functions/createWorkoutPlan.ts";
import { addExercise } from "./functions/addExercise.ts";

type ToolHandler = (ws: WebSocket, args: any, userId: number) => Promise<any>;

const toolHandlers: Record<string, ToolHandler> = {
  create_workout_plan: createWorkoutPlan,
  add_workout_day: addWorkoutDay,
  add_exercise: addExercise,
  delete_workout_plan: deleteWorkoutPlan,
  delete_workout_day: deleteWorkoutDay,
  get_user_workout_plans: getUserWorkoutPlan,
};

export async function handleToolCall(
  ws: WebSocket,
  toolCall: ToolCall,
  userId: number,
): Promise<any> {
  const handler = toolHandlers[toolCall.name];

  if (!handler) {
    throw new Error(`Unknown tool: ${toolCall.name}`);
  }

  try {
    let parsedArgs;

    try {
      parsedArgs = JSON.parse(toolCall.arguments);
    } catch (parseErr) {
      throw new Error(
        "Incomplete tool arguments. Please regenerate tool call.",
      );
    }

    const result = await handler(ws, parsedArgs, userId);

    return result;
  } catch (error) {
    throw error;
  }
}
