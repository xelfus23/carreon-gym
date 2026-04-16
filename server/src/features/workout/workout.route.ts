import { Router } from "express";
import {
    deleteLog,
    deleteWorkoutPlan,
    getCompleted,
    getTodayLogs,
    getWorkoutPlan,
    logComplete,
    toggleActivation,
} from "./workout.controller.ts";
import { mobileAuthMiddleware } from "../../middleware/authenticate.ts";

const workoutRoutes = Router();

workoutRoutes.get("/", mobileAuthMiddleware, getWorkoutPlan);

workoutRoutes.post("/logs", mobileAuthMiddleware, logComplete);
workoutRoutes.get("/logs/today", mobileAuthMiddleware, getTodayLogs);
workoutRoutes.get("/logs", mobileAuthMiddleware, getCompleted);
workoutRoutes.delete("/:workout_exercise_id", mobileAuthMiddleware, deleteLog);
workoutRoutes.patch("/plan/:id", mobileAuthMiddleware, toggleActivation);
workoutRoutes.delete("/plan/:id", mobileAuthMiddleware, deleteWorkoutPlan);

export default workoutRoutes;
