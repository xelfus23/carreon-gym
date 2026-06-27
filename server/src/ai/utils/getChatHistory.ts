import { chatQuery } from "../../repositories/user.repository.ts";
import {
  buildSystemPrompt,
  type AiPersonalization,
} from "../prompts/buildSystemPrompt.ts";
import { formatChatHistory } from "./formatHistory.ts";

export const getChatHistory = async (
  userId: number,
  sessionId: number,
  newMsg: any,
  personalization?: AiPersonalization,
): Promise<any[]> => {

  const systemPrompt = await buildSystemPrompt(userId, personalization);
  
  const result = await chatQuery(sessionId);
  return await formatChatHistory([...result.rows, newMsg], systemPrompt);
};
