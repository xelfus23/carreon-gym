import { Router } from "express";
import { authentication } from "../../middleware/authenticate.ts";
import { getWorkoutPlan } from "./workout.controller.ts";

const workoutRoutes = Router();

workoutRoutes.get("/", authentication, getWorkoutPlan);

export default workoutRoutes;
