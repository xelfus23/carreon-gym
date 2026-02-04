import pool from "../config/pool.ts";
import { Instructions } from "./getInstructions.ts";

export const getChatHistory = async (
    userId: number,
    sessionId: number,
    currentPrompt: string,
) => {
    // 1. Get the System Instructions (Inventory + User Stats)
    const systemContent = await Instructions(userId);

    // 2. Fetch recent chat history from DB
    // We limit to 20 to save tokens/money and prevent context overflow
    const query = `
        SELECT role, content 
        FROM chat_messages 
        WHERE session_id = $1 
        ORDER BY created_at ASC 
        LIMIT 20
    `;

    const historyResult = await pool.query(query, [sessionId]);

    // 3. Format DB rows for the AI (Mistral/OpenAI format)
    // The DB has 'role' (user/assistant) and 'message'
    const pastMessages = historyResult.rows.map((row) => ({
        role: row.role, // 'user' or 'assistant'
        content: row.content, // Map 'message' column to 'content' key
    }));

    // 4. Construct the final payload
    return [
        {
            role: "system",
            content: systemContent,
        },
        ...pastMessages, // Spread previous conversation here
        {
            role: "user",
            content: currentPrompt,
        },
    ];
};
