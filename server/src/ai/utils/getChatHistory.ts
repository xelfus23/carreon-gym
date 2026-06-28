import { chatQuery } from "../../repositories/user.repository.ts";
import type { ChatMessage } from "../../types/index.ts";
import {
  buildSystemPromptParts,
  type AiPersonalization,
  type PromptContext,
} from "../prompts/buildSystemPrompt.ts";
import { formatChatHistory } from "./formatHistory.ts";

export type ChatHistoryResult = {
  messages: ChatMessage[];
  promptContext: PromptContext;
  userPrompt: string;
};

export const getChatHistory = async (
  userId: number,
  sessionId: number,
  newMsg: { role: string; content: string },
  personalization?: AiPersonalization,
): Promise<ChatHistoryResult> => {
  const { systemPrompt, context: promptContext } = await buildSystemPromptParts(
    userId,
    personalization,
  );

  const result = await chatQuery(sessionId);
  const messages = await formatChatHistory(
    [...result.rows, newMsg],
    systemPrompt,
  );

  return {
    messages,
    promptContext,
    userPrompt: newMsg.content,
  };
};
