// utils/getChatHistory.ts
import pool from "../config/pool.ts";
import { Instructions } from "./getInstructions.ts";

export const getChatHistory = async (
    userId: number,
    sessionId: number,
): Promise<any[]> => {
    console.log("\n📚 Fetching chat history...");
    console.log("User ID:", userId, "Session ID:", sessionId);

    // Get system instructions
    const systemPrompt = await Instructions(userId);

    // Get chat messages
    const result = await pool.query(
        `SELECT role, content, tool_calls, name, tool_call_id, created_at
         FROM chat_messages 
         WHERE session_id = $1 
         ORDER BY created_at ASC`,
        [sessionId],
    );

    console.log("✅ Found", result.rows.length, "messages");

    const messages = [
        {
            role: "system",
            content: systemPrompt,
        },
        ...result.rows.map((row) => {
            // Handle tool messages
            if (row.role === "tool") {
                return {
                    role: "tool",
                    name: row.name || "unknown_tool",
                    content: row.content,
                    tool_call_id: row.tool_call_id || `tool_${Date.now()}`,
                };
            }

            // Handle assistant messages with tool calls
            if (row.role === "assistant" && row.tool_calls) {
                return {
                    role: "assistant",
                    content: row.content,
                    tool_calls: row.tool_calls,
                };
            }

            // Regular messages
            return {
                role: row.role,
                content: row.content,
            };
        }),
    ];

    return messages;
};
