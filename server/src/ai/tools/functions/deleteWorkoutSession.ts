import { WebSocket } from "ws";
import { deleteWorkoutSessionDomain } from "../../../domain/workout/deleteWorkoutSessionDomain.ts";

export const deleteWorkoutSession = async (
  ws: WebSocket,
  args: any,
  userId: number,
) => {
  return await deleteWorkoutSessionDomain({ args, userId });
};
