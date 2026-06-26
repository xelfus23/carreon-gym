import { SummaryInstructions } from "../../ai/prompts/summarizer.Instructions.ts";
import { env } from "../../config/env.ts";
import { model } from "../../config/models.ts";
import pool from "../../config/pool.ts";
import { formatChatHistory } from "../../ai/utils/formatHistory.ts";

export const saveSummaryDomain = async (sessionId: number) => {
  console.log("START SUMMARIZATION");

  const chatsQuery = `
        SELECT role, content
        FROM chat_messages
        WHERE session_id = $1
        ORDER BY created_at DESC
        LIMIT 10
    `;

  const chatsResult = await pool.query(chatsQuery, [sessionId]);
  const recentMessages = chatsResult.rows.reverse();

  const instructions = await SummaryInstructions(sessionId);

  const chatHistory = await formatChatHistory(
    recentMessages,
    instructions,
    "summary",
  );

  const propMsg = {
    role: "user",
    content: "Summarize the previous 10 messages.",
  };

  const fullHistory = [...chatHistory, propMsg];

  const response = await fetch(env.LMSTUDIO_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model.gema_12b,
      messages: fullHistory,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `LM Studio request failed [${response.status}]: ${errorText}`,
    );
  }

  const rawText = await response.text();

  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    throw new Error(`Failed to parse LM Studio response as JSON: ${rawText}`);
  }

  const choice = data?.choices?.[0];
  if (!choice) {
    throw new Error(`Unexpected response shape: ${JSON.stringify(data)}`);
  }

  let summary: string = choice.message?.content ?? "";

  summary = summary.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  if (!summary) {
    throw new Error("AI returned empty summary after stripping think blocks.");
  }

  if (!choice) {
    throw new Error(
      `Unexpected LM Studio response shape: ${JSON.stringify(data)}`,
    );
  }

  await pool.query(
    `UPDATE chat_sessions SET conversation_summary = $1 WHERE id = $2`,
    [summary, sessionId],
  );
};
