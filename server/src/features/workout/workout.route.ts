import { Router } from "express";
import {
  deleteWorkoutSession,
  getAllLogs,
  getSessionLogs,
  getTodayLogs,
  getWorkoutSessions,
  logComplete,
  removeLog,
} from "./workout.controller.ts";

import { authMiddleware } from "../../middleware/authenticate.ts";

const workoutRoutes = Router();

workoutRoutes.get("/", authMiddleware, getWorkoutSessions);
workoutRoutes.delete("/:id", authMiddleware, deleteWorkoutSession);

workoutRoutes.post("/logs", authMiddleware, logComplete);
workoutRoutes.get("/logs/today", authMiddleware, getTodayLogs);
workoutRoutes.get("/logs/all", authMiddleware, getAllLogs);
workoutRoutes.get("/logs", authMiddleware, getSessionLogs);
workoutRoutes.delete("/logs/:workoutExerciseId", authMiddleware, removeLog);

export default workoutRoutes;