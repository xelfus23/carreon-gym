import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./features/user/user.route.ts";
import authRoutes from "./features/auth/auth.route.ts";
import chatRoutes from "./features/chat/chat.route.ts";
import equipmentRoutes from "./features/equipment/equipment.route.ts";
import workoutRoutes from "./features/workout/workout.route.ts";

dotenv.config({ path: ".env" });

const app = express();

app.use(express.json());

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
    }),
);

/* ---------- ROUTES ---------- */
app.use("/api/users", userRoutes);
app.use("/api/login", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/workoutplan", workoutRoutes);

/* ---------- HEALTH CHECK ---------- */
app.get("/health", (_, res) => {
    res.status(200).json({ status: "ok" });
});

export default app;
