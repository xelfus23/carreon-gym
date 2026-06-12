import { WebSocket } from "ws";
import { createSessionExerciseDomain } from "../../../domain/workout/createSessionExerciseDomain.ts";

export const createSessionExercise = async (ws: WebSocket, args: any, userId: number) => {
  const result = await createSessionExerciseDomain({ args, userId });
  return result;
};
