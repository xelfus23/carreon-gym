import { WebSocketServer, WebSocket } from "ws";
import type { ChatMessage, ToolCall } from "../../types/index.ts";
import { LMstudio } from "../client/LMstudio.ts";

export async function streamModel(
    messages: ChatMessage[],
    ws: WebSocket,
): Promise<{ toolCalls: ToolCall[]; assistantContent: string }> {
    ws.send(
        JSON.stringify({
            type: "state",
            state: "Thinking",
        }),
    );

    const response = await LMstudio(messages);

    if (!response) {
        throw new Error("Error Response");
    }

    const reader = response.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let toolCallBuffer: Record<string, ToolCall> = {};
    let assistantContent = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const data = trimmed.replace("data:", "").trim();

            if (data === "[DONE]") break;

            try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta;

                if (delta?.content) {
                    assistantContent += delta.content;
                    ws.send(
                        JSON.stringify({
                            type: "token",
                            content: delta.content,
                        }),
                    );
                }

                if (delta?.tool_calls) {
                    for (const tc of delta.tool_calls) {
                        const index = tc.index ?? 0;

                        if (!toolCallBuffer[index]) {
                            toolCallBuffer[index] = {
                                id: tc.id || `tool_${index}`,
                                name: tc.function?.name || "",
                                arguments: tc.function?.arguments || "",
                            };
                        } else {
                            if (tc.id) toolCallBuffer[index].id = tc.id;
                            if (tc.function?.name) {
                                toolCallBuffer[index].name += tc.function.name;
                            }
                            if (tc.function?.arguments) {
                                const oldLen =
                                    toolCallBuffer[index].arguments.length;
                                toolCallBuffer[index].arguments +=
                                    tc.function.arguments;
                            }
                        }
                    }
                }
            } catch (parseErr) {
                console.warn(
                    "⚠️  Could not parse data chunk (may be partial):",
                    (parseErr as Error).message.substring(0, 80),
                );
            }
        }
    }

    const toolCalls = Object.values(toolCallBuffer);

    if (toolCalls.length > 0) {
        console.log(`\n✅ Collected ${toolCalls.length} tool call(s)`);
        for (let i = 0; i < toolCalls.length; i++) {
            const tc = toolCalls[i]!;
            console.log(
                `   [${i}] ${tc.name}: ${tc.arguments.length} chars of arguments`,
            );
        }
    }

    return {
        toolCalls,
        assistantContent,
    };
}
