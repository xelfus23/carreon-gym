import { Instructions } from "../ai/prompts/trainer.Instructions.ts";
import { chatQuery } from "../repositories/user.repository.ts";
import { formatChatHistory } from "./formatHistory.ts";

export const getChatHistory = async (
    userId: number,
    sessionId: number,
    newMsg: any,
): Promise<any[]> => {
    const systemPrompt = await Instructions(userId);
    const result = await chatQuery(sessionId);
    return await formatChatHistory([...result.rows, newMsg], systemPrompt);
};
