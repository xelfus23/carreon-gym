import { Router } from "express";
import createChat from "../controller/chatController/createChat.controller.ts";
import sendMessage from "../controller/chatController/sendMessage.controller.ts";
import { authMiddleware } from "../middleware/AuthMiddleware.ts";

const chatRouter = Router();

chatRouter.post("/", authMiddleware, createChat);
chatRouter.post("/messages", authMiddleware, sendMessage);

export default chatRouter;
