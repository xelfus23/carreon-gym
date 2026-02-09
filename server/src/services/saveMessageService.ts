import { WebSocket } from "ws";
import pool from "../config/pool.ts";
import type { ChatMessage } from "../types/index.ts";

export const saveMessageService = async (
    ws: WebSocket,
    sessionId: number,
    userId: number,
    message: ChatMessage,
) => {
    try {
        console.log(`\n💾 Saving message: role=${message.role}`);

        if (message.role === "user") {
            await pool.query(
                `INSERT INTO chat_messages (session_id, user_id, role, content) 
                 VALUES ($1, $2, $3, $4)`,
                [sessionId, userId, "user", message.content],
            );
            console.log("✅ User message saved");
        } else if (message.role === "assistant") {
            const toolCallsJson = message.tool_calls
                ? JSON.stringify(message.tool_calls)
                : null;

            await pool.query(
                `INSERT INTO chat_messages (session_id, user_id, role, content, tool_calls) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    sessionId,
                    userId,
                    "assistant",
                    message.content || null,
                    toolCallsJson,
                ],
            );
            console.log("✅ Assistant message saved");

            if (message.tool_calls) {
                console.log(
                    `   ↳ With ${message.tool_calls.length} tool call(s)`,
                );
            }
        } else if (message.role === "tool") {
            ws.send(
                JSON.stringify({
                    type: "state",
                    message: "Saving Workout Plan",
                }),
            );
            // Save tool result message
            await pool.query(
                `INSERT INTO chat_messages (session_id, user_id, role, content, tool_call_id, name) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [
                    sessionId,
                    userId,
                    "tool",
                    message.content,
                    message.tool_call_id,
                    message.tool_call_id || "unknown_tool",
                ],
            );
            console.log("✅ Tool result message saved");
        }
    } catch (err) {
        console.error("❌ Failed to save message:", err);
        throw err;
    }
};
