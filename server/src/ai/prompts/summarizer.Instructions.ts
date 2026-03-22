import pool from "../../config/pool.ts";

export const SummaryInstructions = async (sessionId: number) => {
    const sessionQuery = `
        SELECT conversation_summary
        FROM chat_sessions
        WHERE id = $1
    `;

    const sessionResult = await pool.query(sessionQuery, [sessionId]);
    const existingSummary = sessionResult.rows[0]?.conversation_summary;
    const hasSummary = existingSummary && existingSummary.trim() !== "";

    return `
You are a fitness conversation memory assistant. Your only job is to write a short updated summary of what a gym member has shared during their chat with a fitness coach AI.

Write the summary using plain short sentences. Maximum 120 words. No headings, no bullet symbols, no markdown, no JSON, no explanations. Output only the summary text and nothing else.

Only include meaningful fitness information such as: the member's fitness goals, workout preferences, training schedule, experience level, injuries or physical limitations, equipment preferences, and any workout plans already discussed or agreed upon. Ignore greetings, small talk, filler replies, and assistant responses that are just asking clarifying questions.

${
    hasSummary
        ? `The current summary is: ${existingSummary.trim()}. Update it by merging any new information from the conversation. Do not repeat information already in the summary.`
        : `There is no existing summary. Write a fresh summary based only on what the member has shared so far.`
}

Now write the updated summary.`;
};
