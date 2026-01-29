import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/user.route.ts";
import authRouter from "./routes/auth.route.ts";
import chatRouter from "./routes/chat.routes.ts";
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 4545;

app.use("/api/users", userRouter);
app.use("/api/authenticate", authRouter);
app.use("/api/chats", chatRouter);

app.listen(PORT, "0.0.0.0", () => {
    console.log("Listening to port", PORT);
});
