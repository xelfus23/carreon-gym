import { Router } from "express";
import { authMiddleware } from "../middleware/AuthMiddleware.ts";
import getWorkoutPlan from "../controller/workoutController/getWorkoutPlan.ts";

const workoutPlanRouter = Router();

workoutPlanRouter.get("/", authMiddleware, getWorkoutPlan);

export default workoutPlanRouter;
