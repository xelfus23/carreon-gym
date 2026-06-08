import { WebSocket } from "ws";
import { createWorkoutPlanDomain } from "../../../domain/workout/createWorkoutPlan.ts";

export const createWorkoutPlan = async (
  ws: WebSocket,
  args: any,
  userId: number,
) => {
  return await createWorkoutPlanDomain({ args, userId });
};
