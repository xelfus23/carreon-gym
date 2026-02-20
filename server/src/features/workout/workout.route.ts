import { Router } from "express";
import {
    deleteLog,
    getCompleted,
    getWorkoutPlan,
    logComplete,
} from "./workout.controller.ts";
import { mobileAuthMiddleware } from "../../middleware/authenticate.ts";

const workoutRoutes = Router();

workoutRoutes.get("/", mobileAuthMiddleware, getWorkoutPlan);

workoutRoutes.post("/logs", mobileAuthMiddleware, logComplete);
workoutRoutes.get("/logs", mobileAuthMiddleware, getCompleted);
workoutRoutes.delete("/:workout_exercise_id", mobileAuthMiddleware, deleteLog);

export default workoutRoutes;
