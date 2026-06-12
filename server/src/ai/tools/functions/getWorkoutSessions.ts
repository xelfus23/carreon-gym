import { WebSocket } from "ws";
import type { ToolCall } from "../../../types/index.ts";
import { getWorkoutSessionDomain } from "../../../domain/workout/getWorkoutSessionDomain.ts";

export const getUserWorkoutPlan = async (
  ws: WebSocket,
  args: any,
  userId: number,
) => {

  const data = await getWorkoutSessionDomain({ userId })

  return data;
};
