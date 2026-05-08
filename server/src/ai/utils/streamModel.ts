import { WebSocket } from "ws";
import type { ChatMessage, ToolCall } from "../../types/index.ts";
import { LMstudio } from "../client/LMstudio.ts";
import { Gemini } from "../client/Gemini.ts";
import { env } from "../../config/env.ts";
import { sanitizeAssistantContent } from "./sanitizeAssistantContent.ts";

export const modelProvider = async (
    messages: ChatMessage[],
    options?: { disableTools: boolean },
) => {
    if (env.PROVIDER === "gemini") {
        return Gemini(messages, options);
    }
    return LMstudio(messages);
};

export async function streamModel(
    messages: ChatMessage[],
    ws: WebSocket,
    params?: { disableTools?: boolean },
): Promise<{ toolCalls: ToolCall[]; assistantContent: string }> {
    ws.send(JSON.stringify({ type: "assistant_response_start" }));

    const response = await modelProvider(messages, {
        disableTools: params?.disableTools ?? false,
    });

    if (!response) {
        throw new Error("No response from model");
    }

    const reader = response.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let toolCallBuffer: Record<number, ToolCall> = {};
    let visibleContent = "";
    let done = false;

    // REMOVED: inThinkBlock, pendingText, and THINK tags

    const sanitizeVisibleText = (content: string) =>
        content
            .replace(
                /"?\b(?:equipment_id|exercise_id|day_id|plan_id|workout_id|member_id|user_id|session_id)\b"?\s*[:=]\s*"?[a-z0-9_-]+"?,?/gi,
                "",
            )
            .replace(
                /\b(?:equipment_id|exercise_id|day_id|plan_id|workout_id|member_id|user_id|session_id)\b\s*[:=]\s*[a-z0-9_-]+/gi,
                "",
            );

    while (!done) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const data = trimmed.slice("data:".length).trim();
            if (data === "[DONE]") {
                done = true;
                break;
            }

            try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta;
                if (!delta) continue;

                if (delta.content) {
                    // DIRECT PASS-THROUGH: No more waiting for </think>
                    const safeChunk = sanitizeVisibleText(delta.content);

                    if (safeChunk) {
                        visibleContent += safeChunk;
                        ws.send(
                            JSON.stringify({
                                type: "token",
                                content: safeChunk,
                            }),
                        );
                    }
                }

                if (delta.tool_calls) {
                    for (const tc of delta.tool_calls) {
                        const index: number = tc.index ?? 0;
                        if (!toolCallBuffer[index]) {
                            toolCallBuffer[index] = {
                                id: tc.id || `tool_${index}`,
                                name: tc.function?.name || "",
                                arguments: tc.function?.arguments || "",
                            };
                        } else {
                            if (tc.id) toolCallBuffer[index].id = tc.id;
                            if (tc.function?.name)
                                toolCallBuffer[index].name += tc.function.name;
                            if (tc.function?.arguments)
                                toolCallBuffer[index].arguments +=
                                    tc.function.arguments;
                        }
                    }
                }
            } catch (parseErr) {
                console.warn(
                    `⚠️ Could not parse chunk:`,
                    (parseErr as Error).message,
                );
            }
        }
    }

    const toolCalls = Object.values(toolCallBuffer);
    const cleanedResponse = sanitizeAssistantContent(visibleContent).trim();

    return {
        toolCalls,
        assistantContent: cleanedResponse,
    };
}
