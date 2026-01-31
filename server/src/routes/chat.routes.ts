import { Router } from "express";
import createUser from "../controller/userController/createUser.controller.ts";
import createChat from "../controller/chatController/createChat.controller.ts";
import sendMessage from "../controller/chatController/sendMessage.controller.ts";

const chatRouter = Router();

chatRouter.post("/", createChat);
chatRouter.post("/messages", sendMessage);

export default chatRouter;
