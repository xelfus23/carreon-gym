import { Router } from "express";
import {
  checkIn,
  checkOut,
  getAttendanceLog,
  getSessionStatus,
  manualAttendance,
} from "./attendance.controller.ts";
import { authMiddleware } from "../../middleware/authenticate.ts";
import { authorizeRoles } from "../../middleware/roleGuard.ts";

const attendanceRoute = Router();

attendanceRoute.post("/checkin", authMiddleware, checkIn);
attendanceRoute.post("/checkout", authMiddleware, checkOut);
attendanceRoute.get("/sessionStatus", authMiddleware, getSessionStatus);
attendanceRoute.get("/log", authMiddleware, authorizeRoles("admin"), getAttendanceLog);
attendanceRoute.post("/manual", authMiddleware, authorizeRoles("admin"), manualAttendance);

export default attendanceRoute;
