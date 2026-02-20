import { Router } from "express";
import {
    checkIn,
    checkOut,
    getSessionStatus,
} from "./attendance.controller.ts";
import { mobileAuthMiddleware } from "../../middleware/authenticate.ts";

const attendanceRoute = Router();

attendanceRoute.post("/checkin", mobileAuthMiddleware, checkIn);
attendanceRoute.post("/checkout", mobileAuthMiddleware, checkOut);
attendanceRoute.get("/sessionStatus", mobileAuthMiddleware, getSessionStatus);

export default attendanceRoute;
