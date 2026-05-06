import { deleteWorkoutPlanDomain } from "../../../domain/workout/deleteWorkoutPlan.ts";
import { WebSocket } from "ws";

export const deleteWorkoutPlan = async (
  _ws: WebSocket,
  args: any,
  userId: number,
) => {
  return await deleteWorkoutPlanDomain({ args, userId });
};
