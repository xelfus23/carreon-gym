import { LMstudio } from "../../ai/client/LMstudio.ts";
import { SummaryInstructions } from "../../ai/prompts/summaryInstructions.ts";
import { env } from "../../config/env.ts";
import pool from "../../config/pool.ts";
import { formatChatHistory } from "../../utils/formatHistory.ts";

export const saveSummaryDomain = async (sessionId: number) => {
    // 1. Fetch recent messages
    const chatsQuery = `
    SELECT role, content
    FROM chat_messages
    WHERE session_id = $1
    ORDER BY created_at DESC
    LIMIT 10
  `;
    const chatsResult = await pool.query(chatsQuery, [sessionId]);
    const recentMessages = chatsResult.rows.reverse(); // chronological

    // 2. Fetch current summary
    const sessionQuery = `
    SELECT conversation_summary
    FROM chat_sessions
    WHERE id = $1
  `;
    const sessionResult = await pool.query(sessionQuery, [sessionId]);
    const existingSummary = sessionResult.rows[0]?.conversation_summary || "";

    // 3. Build summarization prompt
    const instructions = await SummaryInstructions();

    const chatHistory = await formatChatHistory(
        recentMessages,
        instructions,
        existingSummary,
    );

    console.log("CHAT HISTORY:", chatHistory);

    const response = await fetch(env.LMSTUDIO_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "mistralai/ministral-3-8b-reasoning",
            messages: chatHistory,
        }),
    });

    //TODO: Summary saving error its empty

    const data: any = await response.json();

    const summary = data.choices[0].message.content;

    console.log("SUMMARY: ",summary);
    await pool.query(
        `UPDATE chat_sessions
     SET conversation_summary = $1
     WHERE id = $2`,
        [summary, sessionId],
    );
};
