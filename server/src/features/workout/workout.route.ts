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
import { authMiddleware } from "../../middleware/authenticate.ts";

const workoutRoutes = Router();

workoutRoutes.get("/", authMiddleware, getWorkoutPlan);

workoutRoutes.post("/logs", authMiddleware, logComplete);
workoutRoutes.get("/logs/today", authMiddleware, getTodayLogs);
workoutRoutes.get("/logs", authMiddleware, getCompleted);
workoutRoutes.delete("/:workout_exercise_id", authMiddleware, deleteLog);
workoutRoutes.patch("/plan/:id", authMiddleware, toggleActivation);
workoutRoutes.delete("/plan/:id", authMiddleware, deleteWorkoutPlan);

export default workoutRoutes;
