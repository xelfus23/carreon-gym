import { env } from "../../config/env.ts";
import type { ChatMessage } from "../../types/index.ts";
import { tools } from "../tools/toolRegistry.ts";

const model = {
    ministral8B: "mistralai/ministral-3-8b-reasoning",
    ministral14B: "mistralai/ministral-3-14b-reasoning",
    qwen3_2B: "qwen3-1.7b-fitnessdiet-assistant:3",
};

export const LMstudio = async (
    messages: ChatMessage[],
    options: { disableTools?: boolean; stream?: boolean },
) => {

    console.log("OPTIONS", options)
    const response = await fetch(env.LMSTUDIO_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: model.ministral8B,
            stream: options.stream || false,
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
