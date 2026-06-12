import { WebSocket } from "ws";
import { createWorkoutSessionDomain } from "../../../domain/workout/createWorkoutSessionDomain.ts";

export const createWorkoutSession = async (
  ws: WebSocket,
  args: any,
  userId: number,
) => {
  return await createWorkoutSessionDomain({ args, userId });
};
