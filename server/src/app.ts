import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./features/user/user.route.ts";
import authRoutes from "./features/auth/auth.route.ts";
import chatRoutes from "./features/chat/chat.route.ts";
import equipmentRoutes from "./features/equipment/equipment.route.ts";
import workoutRoutes from "./features/workout/workout.route.ts";
import cookieParser from "cookie-parser";
import memberRoutes from "./features/members/members.route.ts";
import statsRoutes from "./features/stats/stats.route.ts";
import attendanceRoute from "./features/attendance/attendance.route.ts";

dotenv.config({ path: ".env" });

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
    cors({
        origin: ["http://192.168.1.150:5173"],
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
    }),
);

/* ---------- ROUTES ---------- */
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/workoutplan", workoutRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/attendance", attendanceRoute )

/* ---------- HEALTH CHECK ---------- */
app.get("/health", (_, res) => {
    res.status(200).json({ status: "ok" });
});

export default app;
