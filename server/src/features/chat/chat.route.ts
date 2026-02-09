import { Router } from "express";
import { authentication } from "../../middleware/authenticate.ts";
import {
    getSession,
    createSession,
    getSessionMessages,
    deletemessage,
} from "./chat.controller.ts";

const chatRoutes = Router();

chatRoutes.use(authentication);

chatRoutes.get("/sessions", getSession);
chatRoutes.post("/sessions", createSession);
chatRoutes.get("/sessions/:sessionId/messages", getSessionMessages);
chatRoutes.delete("/messages/:id", deletemessage);

export default chatRoutes;
