import { env } from "../../config/env.ts";
import type { ChatMessage } from "../../types/index.ts";
import { tools } from "../tools/toolRegistry.ts";

const model = {
    ministral8B: "mistralai/ministral-3-8b-reasoning",
    ministral14B: "mistralai/ministral-3-14b-reasoning",
};

export const LMstudio = async (
    messages: ChatMessage[],
    options?: { disableTools: boolean },
) => {
    const response = await fetch(env.LMSTUDIO_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: model.ministral8B,
            stream: true,
            messages: messages,
            tools: tools,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        console.error("❌ LM Studio error:", text);
        throw new Error("LM Studio request failed");
    }

    return response.body;
};
