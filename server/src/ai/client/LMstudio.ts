import { env } from "../../config/env.ts";
import { model } from "../../config/models.ts";
import type { ChatMessage } from "../../types/index.ts";
import { tools } from "../tools/toolRegistry.ts";

export const LMstudio = async (messages: ChatMessage[], options?: {}) => {
  const response = await fetch(env.LMSTUDIO_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model.gema_12b,
      stream: true,
      messages: messages,
      tools: tools,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("❌ LM Studio error:", text);
    throw new Error(
      text || `LM Studio request failed with status ${response.status}`,
    );
  }

  return response.body;
};
