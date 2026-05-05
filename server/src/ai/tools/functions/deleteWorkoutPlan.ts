import { deleteWorkoutPlanDomain } from "../../../domain/workout/deleteWorkoutPlan.ts";

export const deleteWorkoutPlan = async (args: any, userId: number) => {
  return await deleteWorkoutPlanDomain({ args, userId });
};
