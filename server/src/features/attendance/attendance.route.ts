import { Router } from "express";
import {
    checkIn,
    checkOut,
    getAttendanceLog,
    getSessionStatus,
} from "./attendance.controller.ts";
import {
    mobileAuthMiddleware,
    webAuthMiddleware,
} from "../../middleware/authenticate.ts";

const attendanceRoute = Router();

attendanceRoute.post("/checkin", mobileAuthMiddleware, checkIn);
attendanceRoute.post("/checkout", mobileAuthMiddleware, checkOut);
attendanceRoute.get("/sessionStatus", mobileAuthMiddleware, getSessionStatus);
attendanceRoute.get("/log", webAuthMiddleware, getAttendanceLog);

export default attendanceRoute;
