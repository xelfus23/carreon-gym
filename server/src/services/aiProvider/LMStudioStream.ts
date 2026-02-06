import { tools } from "../../utils/tools/tools.ts";
import type { ChatMessage } from "../../types/index.ts";

export const LMstudioStream = async (messages: ChatMessage[]) => {
    const response = await fetch(process.env.MODEL_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "mistralai/ministral-3-8b-reasoning",
            stream: true,
            messages: messages,
            tools: tools,
        }),
    });

    if (!response.body) throw new Error("No response body");

    return response.body;
};
