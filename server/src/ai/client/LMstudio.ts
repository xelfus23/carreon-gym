import { env } from "../../config/env.ts";
import { model } from "../../config/models.ts";
import type { ChatMessage } from "../../types/index.ts";
import { tools } from "../tools/toolRegistry.ts";

export const LMstudio = async (messages: ChatMessage[]) => {
    const response = await fetch(env.LMSTUDIO_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: model.ministral8B,
            stream: true,
            messages: messages,
            tools: tools,
            reasoning: {
                effort: "none",
            },
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        console.error("❌ LM Studio error:", text);
        throw new Error("LM Studio request failed");
    }

    return response.body;
};
