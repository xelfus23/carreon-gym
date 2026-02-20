import { WebSocket } from "ws";
import { saveMessageService } from "../../services/saveMessageService.ts";
import type { ChatMessage } from "../../types/index.ts";
import { handleToolCall } from "../tools/handleToolCall.ts";
import { streamModel } from "./streamModel.ts";

export async function handleModelStreamWithTools(
    messages: ChatMessage[],
    userId: number,
    sessionId: number,
    ws: WebSocket,
) {
    const MAX_TOOL_ITERATIONS = 10;
    let toolCallCount = 0;
    let iteration = 0;

    const log = (msg: string, data?: unknown) => {
        const prefix = `[Stream][session=${sessionId}][user=${userId}][iter=${iteration}]`;
        if (data !== undefined) {
            console.log(`${prefix} ${msg}`, data);
        } else {
            console.log(`${prefix} ${msg}`);
        }
    };

    const safeSend = (payload: object) => {
        try {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(payload));
            } else {
                console.warn(
                    `[Stream][session=${sessionId}] ⚠️ Tried to send but WS is not open (readyState=${ws.readyState})`,
                );
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

            // ── streamModel ──────────────────────────────────────────────
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
                return;
            }

            // ── Final response (no tool calls) ───────────────────────────
            if (toolCalls.length === 0) {
                log("🏁 No tool calls — final response");

                if (assistantContent) {
                    const finalMessage: ChatMessage = {
                        role: "assistant",
                        content: assistantContent,
                    };
                    try {
                        await saveMessageService(
                            ws,
                            sessionId,
                            userId,
                            finalMessage,
                        );
                        log("💾 Final message saved");
                    } catch (err) {
                        console.error(
                            `[Stream][session=${sessionId}] ❌ saveMessageService (final) threw:`,
                            err,
                        );
                        // Don't return — still send done so client isn't hanging
                    }
                } else {
                    log(
                        "⚠️ No assistant content and no tool calls — empty response",
                    );
                }

                safeSend({ type: "done" });
                return;
            }

            // ── Tool call cap check ──────────────────────────────────────
            toolCallCount += toolCalls.length;
            log(
                `🔧 Tool calls this round: ${toolCalls.length} (total so far: ${toolCallCount})`,
            );

            if (toolCallCount > MAX_TOOL_ITERATIONS) {
                log(
                    `⚠️ Tool call limit hit (${toolCallCount}/${MAX_TOOL_ITERATIONS}) — forcing final response`,
                );

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

                    if (summary) {
                        await saveMessageService(ws, sessionId, userId, {
                            role: "assistant",
                            content: summary,
                        });
                        log("💾 Summary message saved after cap");
                    }
                } catch (err) {
                    console.error(
                        `[Stream][session=${sessionId}] ❌ streamModel (disableTools) threw:`,
                        err,
                    );
                }

                safeSend({ type: "done" });
                return;
            }

            // ── Save assistant message with tool calls ───────────────────
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

            try {
                await saveMessageService(
                    ws,
                    sessionId,
                    userId,
                    assistantMessageWithTools,
                );
                log("💾 Assistant tool-call message saved");
            } catch (err) {
                console.error(
                    `[Stream][session=${sessionId}] ❌ saveMessageService (assistant+tools) threw:`,
                    err,
                );
            }

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

            // ── Save tool results ────────────────────────────────────────
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

                messages.push(toolMessage);

                try {
                    await saveMessageService(
                        ws,
                        sessionId,
                        userId,
                        toolMessage,
                    );
                    log(`💾 Tool result saved for "${toolCall.name}"`);
                } catch (err) {
                    console.error(
                        `[Stream][session=${sessionId}] ❌ saveMessageService (tool result "${toolCall.name}") threw:`,
                        err,
                    );
                }
            }

            log("➡️ Looping back with updated messages");
        }
    } catch (error) {
        // This should now only catch truly unexpected errors
        // since each await has its own try/catch above
        console.error(
            `[Stream][session=${sessionId}] ❌ Unhandled error in stream loop:`,
            error,
        );
        safeSend({ type: "error", message: "Internal server error" });
    }
}
