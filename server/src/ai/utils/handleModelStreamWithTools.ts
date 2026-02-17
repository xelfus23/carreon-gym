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
    const MAX_ITERATIONS = 5;
    let iterations = 0;

    try {
        while (iterations < MAX_ITERATIONS) {
            iterations++;

            const { toolCalls, assistantContent } = await streamModel(
                messages,
                ws,
            );

            // 2. If there's content but no tools, save and break
            if (toolCalls.length === 0) {
                if (assistantContent) {
                    const finalMessage: ChatMessage = {
                        role: "assistant",
                        content: assistantContent,
                    };
                    await saveMessageService(
                        ws,
                        sessionId,
                        userId,
                        finalMessage,
                    );
                }
                break;
            }

            // 3. If there are tool calls, handle them
            const assistantMessageWithTools = {
                role: "assistant",
                content: assistantContent || undefined,
                tool_calls: toolCalls.map((tc) => ({
                    id: tc.id,
                    type: "function",
                    function: { name: tc.name, arguments: tc.arguments },
                })),
            } as any;

            messages.push(assistantMessageWithTools);
            await saveMessageService(
                ws,
                sessionId,
                userId,
                assistantMessageWithTools,
            );

            // Execute all tools in the current turn
            for (const toolCall of toolCalls) {
                const toolResult = await handleToolCall(ws, toolCall, userId);

                const toolMessage: ChatMessage = {
                    role: "tool",
                    tool_call_id: toolCall.id,
                    name: toolCall.name, // Important for some models
                    content: JSON.stringify(toolResult),
                };

                messages.push(toolMessage);
                await saveMessageService(ws, sessionId, userId, toolMessage);
            }

            // 4. IMPORTANT: Loop continues.
            // The updated 'messages' array now contains the tool results.
            // streamModel will be called again at the top of the loop.
        }

        if (iterations >= MAX_ITERATIONS) {
            console.warn("⚠️ Max tool-call iterations reached.");
        }

        ws.send(JSON.stringify({ type: "done" }));
    } catch (error) {
        console.error("Error in handleModelStreamWithTools:", error);
        ws.send(
            JSON.stringify({ type: "error", message: "Internal server error" }),
        );
    }
}
