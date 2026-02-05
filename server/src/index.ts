import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/user.route.ts";
import authRouter from "./routes/auth.route.ts";
import chatRouter from "./routes/chat.routes.ts";
import equipmentRouter from "./routes/equipment.route.ts";
import { setupWebSocket } from "./services/websocketHandler.ts";
import workoutPlanRouter from "./routes/workoutPlan.route.ts";

dotenv.config({ path: ".env" });

const app = express();
app.use(express.json());

const server = app.listen(3000);

setupWebSocket(server);

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
    }),
);

const PORT = Number(process.env.PORT) || 4545;

app.use("/api/users", userRouter);
app.use("/api/login", authRouter);
app.use("/api/chats", chatRouter);
app.use("/api/equipments", equipmentRouter);
app.use("/api/workoutplan", workoutPlanRouter);

app.listen(PORT, "0.0.0.0", () => {
    console.log("Listening to port", PORT);
});
