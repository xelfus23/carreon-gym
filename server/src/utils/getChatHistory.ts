import { Instructions } from "../ai/prompts/system.prompt.ts";
import pool from "../config/pool.ts";
import { chatQuery } from "../repositories/user.repository.ts";
import { formatChatHistory } from "./formatHistory.ts";

export const getChatHistory = async (
    userId: number,
    sessionId: number,
): Promise<any[]> => {
    const systemPrompt = await Instructions(userId);
    const result = await chatQuery(sessionId);
    return await formatChatHistory(result.rows, systemPrompt);
};
