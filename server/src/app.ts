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
import subscriptionRoutes from "./features/subscription/subscription.route.ts";
import subscriptionAdminRoutes from "./features/subscription/subscription.admin.route.ts";
import { globalErrorHandler } from "./services/globalErrorHandler.ts";
import { env } from "./config/env.ts";
import productRoutes from "./features/products/product.route.ts";
import purchaseRoutes from "./features/purchase/purchase.route.ts";
import gymDetailsRoute from "./features/gymDetails/gymDetails.route.ts";

dotenv.config({ path: ".env" });

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: [env.CORS_ORIGIN],
    methods: ["GET", "POST", "PATCH", "DELETE"],
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
app.use("/api/attendance", attendanceRoute);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/web/subscriptions", subscriptionAdminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/purchase", purchaseRoutes);
app.use("/api/gym-details", gymDetailsRoute);

app.use(globalErrorHandler);
/* ---------- HEALTH CHECK ---------- */

app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok" });
});

export default app;
