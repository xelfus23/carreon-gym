import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { WSAuthentication } from "../middleware/wsAuth.ts";
import type { ChatMessage } from "../types/index.ts";
import { getChatHistory } from "../utils/getChatHistory.ts";
import { handleModelStreamWithTools } from "./utils/handleModelStreamWithTools.ts";
import { saveMessageDomain } from "../domain/chat/saveMessage.ts";
import { saveSummaryDomain } from "../domain/chat/saveSummary.ts";
import pool from "../config/pool.ts";

export const WebsocketHandler = async (server: Server) => {
    const wss = new WebSocketServer({ server });

    wss.on("connection", async (ws: WebSocket, req: any) => {
        const auth = await WSAuthentication(ws, req);

        if (!auth) {
            ws.close(1008, "Unauthorized");
            return;
        }

        const { userId, sessionId } = auth;

        ws.on("message", async (message) => {
            try {
                const parsed = JSON.parse(message.toString());
                const userMessage = parsed.message;

                const newMsg = {
                    role: "user",
                    content: userMessage,
                };

                let newMessage = [newMsg];

                const chatHistory = await getChatHistory(
                    userId,
                    sessionId,
                    newMsg,
                );

                let messages: ChatMessage[] = [...chatHistory];

                await handleModelStreamWithTools(
                    messages,
                    userId,
                    sessionId,
                    ws,
                );

                await saveMessageDomain(ws, sessionId, userId, {
                    role: "user",
                    content: userMessage,
                });

                await saveMessageDomain(ws, sessionId, userId, {});

                const countResult = await pool.query(
                    `SELECT COUNT(*) FROM chat_messages WHERE session_id = $1`,
                    [sessionId],
                );

                const messageCount = parseInt(countResult.rows[0].count);

                if (messageCount % 10 === 0) {
                    await saveSummaryDomain(sessionId);
                } else {
                    console.log(
                        "Skip Summarization message count: ",
                        messageCount,
                    );
                }
            } catch (err) {
                console.error("WS message error:", err);
                ws.send(
                    JSON.stringify({
                        type: "error",
                        message: "Streaming failed",
                    }),
                );
            }
        });

        ws.on("close", () => {
            console.log("🔌 WebSocket closed:", userId);
        });
    });
};
