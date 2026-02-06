import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { WSAuthentication } from "./webSocketAuth.ts";
import { getChatHistory } from "../utils/getChatHistory.ts";
import { LMstudioStream } from "./aiProvider/LMStudioStream.ts";
import { handleToolCall } from "./handleToolCall.ts";
import { saveMessageService } from "./saveMessageService.ts";
import type { ToolCall, ChatMessage } from "../types/index.ts";

export const WebsocketHandler = async (server: Server) => {
    const wss = new WebSocketServer({ server });

    wss.on("connection", async (ws: WebSocket, req: any) => {
        const auth = await WSAuthentication(ws, req);
        if (!auth) return;

        const { userId, sessionId } = auth;

        ws.on("message", async (message) => {
            try {
                const parsed = JSON.parse(message.toString());
                const userMessage = parsed.message;

                // 💾 Save user message to database
                await saveMessageService(ws, sessionId, userId, {
                    role: "user",
                    content: userMessage,
                });

                const chatHistory = await getChatHistory(userId, sessionId);

                let messages: ChatMessage[] = [
                    ...chatHistory,
                    { role: "user", content: userMessage },
                ];

                // 🔹 STREAM MODEL AND HANDLE TOOL CALLS
                await handleModelStreamWithTools(
                    messages,
                    userId,
                    sessionId,
                    ws,
                );
            } catch (err) {
                console.error("WS message error:", err);
                ws.send(
                    JSON.stringify({
                        type: "error",
                        message: "Streaming failed",
                    }),
                );
            }
        });

        ws.on("close", () => {
            console.log("🔌 WebSocket closed:", userId);
        });
    });

    // Example of improved error handling in handleModelStreamWithTools
    async function handleModelStreamWithTools(
        messages: ChatMessage[],
        userId: number,
        sessionId: number,
        ws: WebSocket,
    ) {
        try {
            const { toolCalls, assistantContent } = await streamModel(
                messages,
                ws,
            );

            if (toolCalls.length > 0) {
                console.log(`\n📞 Detected ${toolCalls.length} tool call(s)`);

                const assistantMessageWithTools = {
                    role: "assistant",
                    content: assistantContent || undefined,
                    tool_calls: toolCalls.map((tc) => ({
                        id: tc.id,
                        type: "function",
                        function: {
                            name: tc.name,
                            arguments: tc.arguments,
                        },
                    })),
                } as any;

                messages.push(assistantMessageWithTools);

                // 💾 Save assistant message with tool calls
                await saveMessageService(
                    ws,
                    sessionId,
                    userId,
                    assistantMessageWithTools,
                );

                // Execute each tool call
                for (const toolCall of toolCalls) {
                    try {
                        const toolResult = await handleToolCall(
                            ws,
                            toolCall,
                            userId,
                        );

                        const toolMessage: ChatMessage = {
                            role: "tool",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify(toolResult),
                        };

                        messages.push(toolMessage);

                        // 💾 Save tool result message
                        await saveMessageService(
                            ws,
                            sessionId,
                            userId,
                            toolMessage,
                        );

                        ws.send(
                            JSON.stringify({
                                type: "tool_result",
                                name: toolCall.name,
                                result: toolResult,
                            }),
                        );
                    } catch (toolErr) {
                        console.error(
                            `❌ Tool error (${toolCall.name}):`,
                            toolErr,
                        );
                        const errorMessage: ChatMessage = {
                            role: "tool",
                            tool_call_id: toolCall.id,
                            content: JSON.stringify({
                                error: `Tool execution failed: ${toolErr instanceof Error ? toolErr.message : "Unknown error"}`,
                            }),
                        };

                        messages.push(errorMessage);

                        // 💾 Save error message
                        await saveMessageService(
                            ws,
                            sessionId,
                            userId,
                            errorMessage,
                        );
                    }
                }

                // 🔹 SECOND PASS: Stream model again with tool results
                console.log(
                    "\n🔄 Second pass: Streaming model with tool results",
                );
                const { assistantContent: finalContent } = await streamModel(
                    messages,
                    ws,
                );

                // 💾 Save final assistant message
                if (finalContent) {
                    const finalMessage: ChatMessage = {
                        role: "assistant",
                        content: finalContent,
                    };
                    await saveMessageService(
                        ws,
                        sessionId,
                        userId,
                        finalMessage,
                    );
                }
            } else {
                // 💾 No tool calls - save simple assistant response
                if (assistantContent) {
                    console.log(
                        "\n💬 No tool calls detected, saving assistant response",
                    );
                    const assistantMessage: ChatMessage = {
                        role: "assistant",
                        content: assistantContent,
                    };
                    await saveMessageService(
                        ws,
                        sessionId,
                        userId,
                        assistantMessage,
                    );
                }
            }

            ws.send(JSON.stringify({ type: "done" }));
        } catch (error) {
            console.error("Error in handleModelStreamWithTools:", error);
            ws.send(
                JSON.stringify({
                    type: "error",
                    message: "Internal server error",
                }),
            );
        }
    }

    // 🔹 HELPER: Stream from model and collect tool calls + content
    async function streamModel(
        messages: ChatMessage[],
        ws: WebSocket,
    ): Promise<{ toolCalls: ToolCall[]; assistantContent: string }> {
        ws.send(
            JSON.stringify({
                type: "state",
                state: "thinking",
            }),
        );

        const response = await LMstudioStream(messages);

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

                    // 🔹 Handle text content
                    if (delta?.content) {
                        assistantContent += delta.content;
                        ws.send(
                            JSON.stringify({
                                type: "token",
                                content: delta.content,
                            }),
                        );
                    }

                    // 🔹 Handle tool calls (streamed)
                    if (delta?.tool_calls) {
                        for (const tc of delta.tool_calls) {
                            const index = tc.index ?? 0;

                            if (!toolCallBuffer[index]) {
                                toolCallBuffer[index] = {
                                    id: tc.id || `tool_${index}`,
                                    name: tc.function?.name || "",
                                    arguments: tc.function?.arguments || "",
                                };
                                console.log(
                                    `📥 Tool call chunk [${index}] - name: "${tc.function?.name || ""}"`,
                                );
                            } else {
                                // Append streaming chunks
                                if (tc.id) toolCallBuffer[index].id = tc.id;
                                if (tc.function?.name) {
                                    toolCallBuffer[index].name +=
                                        tc.function.name;
                                }
                                if (tc.function?.arguments) {
                                    const oldLen =
                                        toolCallBuffer[index].arguments.length;
                                    toolCallBuffer[index].arguments +=
                                        tc.function.arguments;
                                    console.log(
                                        `📥 Tool call chunk [${index}] - appended ${tc.function.arguments.length} chars (total: ${toolCallBuffer[index].arguments.length})`,
                                    );
                                }
                            }
                        }
                    }
                } catch (parseErr) {
                    // Log parse errors but don't fail - could be partial JSON
                    console.warn(
                        "⚠️  Could not parse data chunk (may be partial):",
                        (parseErr as Error).message.substring(0, 80),
                    );
                }
            }
        }

        // 🔹 Validate tool calls before returning
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
};
