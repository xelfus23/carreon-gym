import { WebSocket } from "ws";
import type { ToolCall } from "../../types/index.ts";
import { getUserWorkoutPlan } from "./functions/getWorkoutSessions.ts";
import { createWorkoutSession } from "./functions/createWorkoutSession.ts";
import { createSessionExercise } from "./functions/createSessionExercise.ts";
import { deleteWorkoutSession } from "./functions/deleteWorkoutSession.ts";
import { getSessionByDate } from "./functions/getSessionByDate.ts";

type ToolHandler = (ws: WebSocket, args: any, userId: number) => Promise<any>;

const toolHandlers: Record<string, ToolHandler> = {
  create_workout_session: createWorkoutSession,
  create_session_exercise: createSessionExercise,
  delete_workout_session: deleteWorkoutSession,
  get_user_workout_sessions: getUserWorkoutPlan,
  get_session_by_date: getSessionByDate
};

export async function handleToolCall(
  ws: WebSocket,
  toolCall: ToolCall,
  userId: number,
): Promise<any> {
  const handler = toolHandlers[toolCall.name];

  if (!handler) {
    throw new Error(`Unknown tool: "${toolCall.name}". Valid tools: ${Object.keys(toolHandlers).join(", ")}`);
  }

  let parsedArgs: any;
  try {
    parsedArgs = JSON.parse(toolCall.arguments);
  } catch {
    throw new Error(`Malformed arguments for tool "${toolCall.name}": ${toolCall.arguments}`);
  }

  return handler(ws, parsedArgs, userId);
}