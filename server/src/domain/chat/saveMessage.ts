import { WebSocket } from "ws";
import pool from "../../config/pool.ts";
import type { ChatMessage } from "../../types/index.ts";
import { sanitizeAssistantContent } from "../../ai/utils/sanitizeAssistantContent.ts";

export const saveMessageDomain = async (
    ws: WebSocket,
    sessionId: number,
    userId: number,
    message: ChatMessage,
) => {
    console.log("Saving...");

    if (message.role === "user") {
        await pool.query(
            `INSERT INTO chat_messages (session_id, user_id, role, content) 
             VALUES ($1, $2, $3, $4)`,
            [sessionId, userId, "user", message.content],
        );
    } else if (message.role === "assistant") {
        const cleanedAssistantContent = sanitizeAssistantContent(message.content);
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
                cleanedAssistantContent || null,
                toolCallsJson,
            ],
        );

        if (message.tool_calls) {
            console.log(`   ↳ With ${message.tool_calls.length} tool call(s)`);
        }
    } else if (message.role === "tool") {
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
    }
};
