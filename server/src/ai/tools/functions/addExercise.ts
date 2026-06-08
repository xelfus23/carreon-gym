import { WebSocket } from "ws";
import { addExerciseDomain } from "../../../domain/workout/addExercise.ts";

export const addExercise = async (ws: WebSocket, args: any, userId: number) => {
  const result = await addExerciseDomain({ args, userId });
  return result;
};
