import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { WSAuthentication } from "../middleware/wsAuth.ts";
import type { ChatMessage } from "../types/index.ts";
import { getChatHistory } from "./utils/getChatHistory.ts";
import { handleModelStreamWithTools } from "./utils/handleModelStreamWithTools.ts";
import { saveMessageDomain } from "../domain/chat/saveMessage.ts";
import { saveSummaryDomain } from "../domain/chat/saveSummary.ts";
import pool from "../config/pool.ts";
import { env } from "../config/env.ts";
import jwt, { type JwtPayload } from "jsonwebtoken";

let wssChat: WebSocketServer;
let wssAdmin: WebSocketServer;

const getTokenFromCookies = (cookieHeader?: string) => {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());

  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === "accessToken") return value;
  }

  return null;
};

export const WebsocketHandler = async (server: Server) => {
  wssChat = new WebSocketServer({ noServer: true });
  wssAdmin = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(
      request.url || "",
      `http://${request.headers.host}`,
    );

    if (pathname === "/ws/chat") {
      wssChat.handleUpgrade(request, socket, head, (ws) => {
        wssChat.emit("connection", ws, request);
      });
    } else if (pathname === "/ws/admin") {
      wssAdmin.handleUpgrade(request, socket, head, (ws) => {
        wssAdmin.emit("connection", ws, request);
      });
    } else {
      // Reject any other upgrade requests
      socket.destroy();
    }
  });

  wssChat.on("connection", async (ws: WebSocket, req: any) => {
    const auth = await WSAuthentication(ws, req, "chat");

    if (!auth) {
      ws.close(1008, "Unauthorized");
      return;
    }

    const { userId, sessionId } = auth;

    ws.on("message", async (message) => {
      console.log("Client WSS connection");

      try {
        const parsed = JSON.parse(message.toString());
        const userMessage = parsed.message;

        const newMsg = {
          role: "user",
          content: userMessage,
        };

        const chatHistory = await getChatHistory(userId, sessionId!, newMsg);

        let messages: ChatMessage[] = [...chatHistory];

        const msgResult: ChatMessage | undefined =
          await handleModelStreamWithTools(messages, userId, sessionId!, ws);

        if (msgResult) {
          await saveMessageDomain(ws, sessionId!, userId, {
            role: "user",
            content: userMessage,
          });

          await saveMessageDomain(ws, sessionId!, userId, msgResult);

          const countResult = await pool.query(
            `SELECT COUNT(*) FROM chat_messages WHERE session_id = $1`,
            [sessionId],
          );

          const messageCount = parseInt(countResult.rows[0].count);

          if (messageCount % 10 === 0) {
            await saveSummaryDomain(sessionId!);
          } else {
            console.log("Skip Summarization message count: ", messageCount);
          }
        } else {
          console.log("AI did not return a response, skipping save");
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

  wssAdmin.on("connection", async (ws, req) => {
    console.log("Admin WSS connection");

    try {
      const token = getTokenFromCookies(req.headers.cookie);

      if (!token) {
        console.log("❌ No token in cookies");
        ws.close(1008, "NO_TOKEN");
        return;
      }

      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET!) as JwtPayload;

      if (payload?.role !== "admin") {
        ws.close(1008, "FORBIDDEN");
        return;
      }

      console.log("🖥️ Admin connected:", payload.sub);
    } catch (err) {
      console.error("Admin WS auth error:", err);
      ws.close(1008, "AUTH_FAILED");
    }
  });
};

export const broadcastNotification = (type: string, payload: any) => {
  if (!wssAdmin) return;

  const message = JSON.stringify({
    type: "SYSTEM_NOTIFICATION",
    event: type,
    data: payload,
  });

  wssAdmin.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

const broadcastToMembers = (payload: any) => {
  if (!wssChat) return;

  const message = JSON.stringify({
    type: "SYSTEM_NOTIFICATION",
    data: payload,
  });

  wssChat.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};
