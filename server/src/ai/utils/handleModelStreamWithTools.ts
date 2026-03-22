import { WebSocket } from "ws";
import type { ChatMessage } from "../../types/index.ts";
import { handleToolCall } from "../tools/handleToolCall.ts";
import { streamModel } from "./streamModel.ts";

export async function handleModelStreamWithTools(
    messages: ChatMessage[],
    userId: number,
    sessionId: number,
    ws: WebSocket,
): Promise<ChatMessage | undefined> {
    const MAX_TOOL_ITERATIONS = 10;
    let toolCallCount = 0;
    let iteration = 0;

    const log = (msg: string, data?: unknown) => {
        const prefix = `[Stream][session=${sessionId}][user=${userId}][iter=${iteration}]`;
        data !== undefined
            ? console.log(`${prefix} ${msg}`, data)
            : console.log(`${prefix} ${msg}`);
    };

    const safeSend = (payload: object) => {
        try {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(payload));
            }
        } catch (err) {
            console.error(
                `[Stream][session=${sessionId}] ❌ ws.send() threw:`,
                err,
            );
        }
    };

    log("▶️ Starting stream loop");

    try {
        while (true) {
            iteration++;
            log(`🔄 Loop iteration start`);

            let toolCalls: Awaited<ReturnType<typeof streamModel>>["toolCalls"];
            let assistantContent: Awaited<
                ReturnType<typeof streamModel>
            >["assistantContent"];

            try {
                const result = await streamModel(messages, ws);
                toolCalls = result.toolCalls;
                assistantContent = result.assistantContent;
                log(
                    `✅ streamModel complete — toolCalls=${toolCalls.length}, contentLength=${assistantContent?.length ?? 0}`,
                );
            } catch (err) {
                console.error(
                    `[Stream][session=${sessionId}][iter=${iteration}] ❌ streamModel threw:`,
                    err,
                );
                safeSend({ type: "error", message: "Model stream failed" });
                return undefined;
            }

            // ── Final response (no tool calls) ──────────────────────────
            if (toolCalls.length === 0) {
                log("🏁 No tool calls — final response");
                safeSend({ type: "done" });

                if (!assistantContent) {
                    log(
                        "⚠️ No assistant content and no tool calls — empty response",
                    );
                    return undefined;
                }

                return {
                    role: "assistant",
                    content: assistantContent,
                } as ChatMessage;
            }

            // ── Tool call cap check ──────────────────────────────────────
            toolCallCount += toolCalls.length;
            log(
                `🔧 Tool calls this round: ${toolCalls.length} (total so far: ${toolCallCount})`,
            );

            if (toolCallCount > MAX_TOOL_ITERATIONS) {
                log(`⚠️ Tool call limit hit — forcing final response`);

                messages.push({
                    role: "system",
                    content:
                        "You have used the maximum number of tool calls. " +
                        "Summarize what you have found so far and respond directly to the user without calling any more tools.",
                } as ChatMessage);

                try {
                    const { assistantContent: summary } = await streamModel(
                        messages,
                        ws,
                        { disableTools: true },
                    );
                    safeSend({ type: "done" });

                    if (summary) {
                        return {
                            role: "assistant",
                            content: summary,
                        } as ChatMessage;
                    }
                } catch (err) {
                    console.error(
                        `[Stream][session=${sessionId}] ❌ streamModel (disableTools) threw:`,
                        err,
                    );
                }

                return undefined;
            }

            // ── Push assistant message with tool calls into context ──────
            // NOTE: NOT returned — just added to messages for next iteration
            const assistantMessageWithTools: ChatMessage = {
                role: "assistant",
                content: assistantContent || null,
                tool_calls: toolCalls.map((tc) => ({
                    id: tc.id,
                    type: "function",
                    function: { name: tc.name, arguments: tc.arguments },
                })),
            } as any;

            messages.push(assistantMessageWithTools);
            log("💬 Assistant tool-call message pushed to context");

            // ── Execute tools in parallel ────────────────────────────────
            log(
                `⚙️ Executing ${toolCalls.length} tool(s): ${toolCalls.map((t) => t.name).join(", ")}`,
            );

            const toolResults = await Promise.allSettled(
                toolCalls.map((toolCall) =>
                    handleToolCall(ws, toolCall, userId),
                ),
            );

            log(`⚙️ Tool execution complete`);

            // ── Push tool results into context ───────────────────────────
            for (const [i, toolCall] of toolCalls.entries()) {
                const result = toolResults[i];
                if (!result) continue;

                if (result.status === "rejected") {
                    console.error(
                        `[Stream][session=${sessionId}] ❌ Tool "${toolCall.name}" failed:`,
                        result.reason,
                    );
                } else {
                    log(`✅ Tool "${toolCall.name}" succeeded`);
                }

                const toolContent =
                    result.status === "fulfilled"
                        ? JSON.stringify(result.value)
                        : JSON.stringify({
                              error: true,
                              message:
                                  result.reason instanceof Error
                                      ? result.reason.message
                                      : "Tool execution failed",
                          });

                const toolMessage: ChatMessage = {
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: toolCall.name,
                    content: toolContent,
                };

                // NOTE: NOT returned — just pushed for next iteration
                messages.push(toolMessage);
                log(`💬 Tool result pushed for "${toolCall.name}"`);
            }

            log("➡️ Looping back with updated messages");
            // Loop continues to next iteration
        }
    } catch (error) {
        console.error(
            `[Stream][session=${sessionId}] ❌ Unhandled error in stream loop:`,
            error,
        );
        safeSend({ type: "error", message: "Internal server error" });
        return undefined;
    }
}
