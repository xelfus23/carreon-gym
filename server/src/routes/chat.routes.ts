import { Router } from "express";
import getSessions from "../controller/chatController/getSessions.ts";
import createSession from "../controller/chatController/createSession.ts";
import getSessionMessages from "../controller/chatController/getSessionMessage.ts";
import { authMiddleware } from "../middleware/AuthMiddleware.ts";
import saveMessage from "../controller/chatController/saveMessage.ts";
import deleteMessage from "../controller/chatController/deleteMessage.ts";


const router = Router();


router.use(authMiddleware);


// 1. Get all chat sessions for the current user
// Matches: GET /api/chats/sessions
router.get("/sessions", getSessions);

// 2. Create a new empty session
// Matches: POST /api/chats/sessions
router.post("/sessions", createSession);

// 3. Get all messages for a specific session
// Matches: GET /api/chats/sessions/:sessionId/messages
router.get("/sessions/:sessionId/messages", getSessionMessages);

// 4. Save a message manually (User or Assistant)
// Matches: POST /api/chats/messages
router.post("/messages", saveMessage);

// 5. Delete a specific message
// Matches: DELETE /api/chats/messages/:id
router.delete("/messages/:id", deleteMessage);

export default router;