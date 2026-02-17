import { Router } from "express";
import {
    getSession,
    createSession,
    getSessionMessages,
    deletemessage,
} from "./chat.controller.ts";
import { mobileAuthMiddleware } from "../../middleware/authenticate.ts";

const chatRoutes = Router();

chatRoutes.use(mobileAuthMiddleware);
chatRoutes.get("/sessions", getSession);
chatRoutes.post("/sessions", createSession);
chatRoutes.get("/sessions/:sessionId/messages", getSessionMessages);
chatRoutes.delete("/messages/:id", deletemessage);

export default chatRoutes;
