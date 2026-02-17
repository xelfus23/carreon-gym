import { Router } from "express";
import { getWorkoutPlan } from "./workout.controller.ts";
import { mobileAuthMiddleware } from "../../middleware/authenticate.ts";

const workoutRoutes = Router();

workoutRoutes.get("/", mobileAuthMiddleware, getWorkoutPlan);

export default workoutRoutes;
