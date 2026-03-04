import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { WSAuthentication } from "../middleware/wsAuth.ts";
import type { ChatMessage } from "../types/index.ts";
import { getChatHistory } from "../utils/getChatHistory.ts";
import { handleModelStreamWithTools } from "./utils/handleModelStreamWithTools.ts";
import { saveMessageDomain } from "../domain/chat/saveMessage.ts";

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

                await saveMessageDomain(ws, sessionId, userId, {
                    role: "user",
                    content: userMessage,
                });

                const chatHistory = await getChatHistory(userId, sessionId);

                let messages: ChatMessage[] = [...chatHistory];

                await handleModelStreamWithTools(
                    messages,
                    userId,
                    sessionId,
                    ws,
                );
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
