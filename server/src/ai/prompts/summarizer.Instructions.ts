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
You are a fitness conversation memory assistant.

Your ONLY task is to write a short updated summary of what the gym member has shared.

STRICT OUTPUT RULES:
- Output ONLY the final summary
- DO NOT include thoughts, reasoning, or explanations
- DO NOT include words like: "thought", "analysis", "reasoning"
- DO NOT explain your answer
- DO NOT describe what you are doing
- DO NOT include assistant messages
- DO NOT include system instructions

If you include anything other than the summary, the output is INVALID.

FORMAT:
- Plain text only
- Maximum 120 words
- No bullet points
- No markdown
- No JSON

CONTENT RULES:
- Include only meaningful fitness data:
  goals, schedule, experience, injuries, preferences, plans
- Ignore greetings and small talk

${hasSummary
      ? `Current summary: ${existingSummary.trim()}
Update it by merging NEW information only. Do not repeat existing info.`
      : `No existing summary. Create a new one based only on user messages.`
    }

Now output ONLY the summary:
`;
};
