import { Router } from "express";
import {
    deleteLog,
    getCompleted,
    getTodayLogs,
    getWorkoutPlan,
    logComplete,
} from "./workout.controller.ts";
import { mobileAuthMiddleware } from "../../middleware/authenticate.ts";

const workoutRoutes = Router();

workoutRoutes.get("/", mobileAuthMiddleware, getWorkoutPlan);

workoutRoutes.post("/logs", mobileAuthMiddleware, logComplete);
workoutRoutes.get("/logs/today", mobileAuthMiddleware, getTodayLogs);
workoutRoutes.get("/logs", mobileAuthMiddleware, getCompleted);
workoutRoutes.delete("/:workout_exercise_id", mobileAuthMiddleware, deleteLog);

export default workoutRoutes;
