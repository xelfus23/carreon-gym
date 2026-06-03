import { Router } from "express";
import {
  getSession,
  createSession,
  getSessionMessages,
  deleteMessage,
} from "./chat.controller.ts";

import { authMiddleware } from "../../middleware/authenticate.ts";

const chatRoutes = Router();

chatRoutes.get("/sessions", authMiddleware, getSession);
chatRoutes.post("/sessions", authMiddleware, createSession);
chatRoutes.get("/sessions/:sessionId/messages", authMiddleware, getSessionMessages);
chatRoutes.delete("/messages/:id", authMiddleware, deleteMessage);

export default chatRoutes;
