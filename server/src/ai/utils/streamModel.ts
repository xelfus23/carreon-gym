import { WebSocket } from "ws";
import type { ChatMessage, ToolCall } from "../../types/index.ts";
import { LMstudio } from "../client/LMstudio.ts";

export async function streamModel(
    messages: ChatMessage[],
    ws: WebSocket,
    params?: { disableTools?: boolean },
): Promise<{ toolCalls: ToolCall[]; assistantContent: string }> {
    ws.send(JSON.stringify({ type: "state", state: "Thinking" }));

    const response = await LMstudio(messages, {
        disableTools: params?.disableTools ?? false,
    });

    if (!response) {
        throw new Error("No response from model");
    }

    const reader = response.getReader();
    const decoder = new TextDecoder();

    let buffer = "";
    let toolCallBuffer: Record<number, ToolCall> = {};
    let assistantContent = "";
    let done = false; // ✅ single flag to break both loops

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
                done = true; // ✅ breaks the outer while loop too
                break;
            }

            try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta;

                if (!delta) continue;

                if (delta.content) {
                    assistantContent += delta.content;
                    ws.send(
                        JSON.stringify({
                            type: "token",
                            content: delta.content,
                        }),
                    );
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
                            if (tc.id) {
                                toolCallBuffer[index].id = tc.id;
                            }
                            if (tc.function?.name) {
                                toolCallBuffer[index].name += tc.function.name;
                            }
                            if (tc.function?.arguments) {
                                toolCallBuffer[index].arguments +=
                                    tc.function.arguments;
                            }
                        }
                    }
                }
            } catch (parseErr) {
                // Partial chunk — safe to skip, will be reassembled on next read
                console.warn(
                    `⚠️ Could not parse chunk:`,
                    (parseErr as Error).message.substring(0, 80),
                );
            }
        }
    }

    const toolCalls = Object.values(toolCallBuffer);

    if (toolCalls.length > 0) {
        console.log(`✅ Collected ${toolCalls.length} tool call(s):`);
        toolCalls.forEach((tc, i) => {
            console.log(`   [${i}] ${tc.name}: ${tc.arguments.length} chars`);
        });
    } else {
        console.log(
            `✅ streamModel done — contentLength=${assistantContent.length}`,
        );
    }

    return { toolCalls, assistantContent };
}
