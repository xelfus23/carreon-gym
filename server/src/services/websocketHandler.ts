// websocket/websocket.ts
import { WebSocketServer, WebSocket as WsWebSocket } from "ws";
import type { Server } from "http";
import jwt from "jsonwebtoken";
import pool from "../config/pool.ts";
import { handleToolCall } from "./handleToolCall.ts";
import { tools } from "../utils/tools.ts";
import { getChatHistory } from "../utils/getChatHistory.ts";
import { AIProviderService } from "./AIprovider.ts";

type ToolCall = {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
};

// Helper functions
function tryParseJSON(raw: string): any | null {
    if (!raw || raw.trim() === "") return {};
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function stripThinkBlocks(text: string): string {
    return text.replace(/\[THINK\][\s\S]*?\[\/THINK\]/g, "").trim();
}

function sendStatus(ws: WsWebSocket, state: string, extra?: any) {
    if (ws.readyState !== ws.OPEN) return;
    ws.send(JSON.stringify({ type: "status", state, ...extra }));
}

export const setupWebSocket = (server: Server) => {
    const wss = new WebSocketServer({ server });
    const aiService = new AIProviderService();

    wss.on("connection", (ws, req) => {
        let userId: number | null = null;
        let session_Id: number | null = null;

        try {
            const url = new URL(req.url!, "http://localhost");
            const token = url.searchParams.get("token");
            const sessionIdStr = url.searchParams.get("session_id");

            if (!token || !sessionIdStr) throw new Error("Missing auth params");

            const payload = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
                id: number;
            };
            userId = payload.id;
            session_Id = parseInt(sessionIdStr);
            console.log("✅ WS authenticated:", userId, session_Id);
        } catch (err) {
            console.error("❌ WS auth failed:", err);
            ws.close();
            return;
        }

        ws.on("message", async (message) => {
            if (!userId || !session_Id) return;

            console.log("\n========================================");
            console.log("📨 NEW MESSAGE RECEIVED");
            console.log("========================================");

            try {
                const { message: userPrompt } = JSON.parse(message.toString());
                console.log("👤 User:", userPrompt);

                // Save user message
                await pool.query(
                    `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)`,
                    [session_Id, "user", userPrompt],
                );

                // Get chat history (includes system prompt)
                const messagesPayload = await getChatHistory(
                    userId,
                    session_Id,
                );
                sendStatus(ws, "thinking");

                console.log("\n🤖 Phase 1: Checking for tool calls...");
                const aiResponse = await aiService.getNonStreamingResponse(
                    messagesPayload,
                    tools,
                );

                let { toolCalls, content: assistantMessage } = aiResponse;
                console.log(`  Found ${toolCalls.length} tool call(s)`);

                if (toolCalls.length > 0) {
                    // Log detected tool calls
                    toolCalls.forEach((tc, idx) => {
                        console.log(`  ${idx + 1}. ${tc.function.name}`);
                    });
                }

                // Execute tools if found
                if (toolCalls.length > 0) {
                    console.log("\n🚀 Phase 2A: Executing tools...");
                    const toolResults: any[] = [];

                    for (const tc of toolCalls) {
                        console.log(`\n  → Executing: ${tc.function.name}`);
                        console.log(`    Tool ID: ${tc.id}`);

                        try {
                            sendStatus(ws, "executing_tool", {
                                tool: tc.function.name,
                            });

                            const result = await handleToolCall(
                                {
                                    name: tc.function.name,
                                    arguments: tc.function.arguments,
                                },
                                userId,
                            );

                            console.log(`    ✅ Tool executed successfully`);

                            toolResults.push({
                                tool_call_id: tc.id,
                                role: "tool",
                                name: tc.function.name,
                                content: JSON.stringify(
                                    result || { success: true },
                                ),
                            });

                            ws.send(
                                JSON.stringify({
                                    type: "tool_result",
                                    tool: tc.function.name,
                                    success: true,
                                }),
                            );
                        } catch (err) {
                            console.error(`    ❌ Tool execution failed:`, err);

                            toolResults.push({
                                tool_call_id: tc.id,
                                role: "tool",
                                name: tc.function.name,
                                content: JSON.stringify({
                                    error: String(err),
                                    success: false,
                                }),
                            });

                            ws.send(
                                JSON.stringify({
                                    type: "tool_result",
                                    tool: tc.function.name,
                                    success: false,
                                    error: String(err),
                                }),
                            );
                        }
                    }

                    // Phase 2B: Stream follow-up response
                    console.log("\n📤 Phase 2B: Getting follow-up response...");
                    sendStatus(ws, "responding");
                    let finalText = "";

                    await aiService.streamChat(
                        [
                            ...messagesPayload,
                            {
                                role: "assistant",
                                content: assistantMessage || null,
                                tool_calls: toolCalls,
                            },
                            ...toolResults,
                        ],
                        tools,
                        (chunk) => {
                            if (chunk.content && ws.readyState === ws.OPEN) {
                                finalText += chunk.content;
                                ws.send(
                                    JSON.stringify({
                                        type: "token",
                                        content: chunk.content,
                                    }),
                                );
                            }
                        },
                    );

                    const cleaned = stripThinkBlocks(finalText).trim();
                    if (cleaned) {
                        sendStatus(ws, "saving");
                        await pool.query(
                            `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)`,
                            [session_Id, "assistant", cleaned],
                        );
                    }
                } else {
                    // Phase 2C: No tools, stream response directly
                    console.log(
                        "\n📤 Phase 2C: Streaming response (no tools)...",
                    );
                    sendStatus(ws, "responding");
                    let streamedText = "";

                    await aiService.streamChat(
                        messagesPayload,
                        tools,
                        (chunk) => {
                            if (chunk.content && ws.readyState === ws.OPEN) {
                                streamedText += chunk.content;
                                ws.send(
                                    JSON.stringify({
                                        type: "token",
                                        content: chunk.content,
                                    }),
                                );
                            }
                        },
                    );

                    const cleaned = stripThinkBlocks(streamedText).trim();
                    if (cleaned) {
                        sendStatus(ws, "saving");
                        await pool.query(
                            `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, $2, $3)`,
                            [session_Id, "assistant", cleaned],
                        );
                    }
                }

                sendStatus(ws, "done");
                ws.send(JSON.stringify({ type: "done" }));
                console.log("✅ Complete\n");
            } catch (err) {
                console.error("❌ Error:", err);
                console.error("Stack:", (err as Error).stack);

                sendStatus(ws, "error", {
                    message: err instanceof Error ? err.message : "Error",
                });

                if (ws.readyState === ws.OPEN) {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            message:
                                err instanceof Error
                                    ? err.message
                                    : "Unknown error",
                        }),
                    );
                }
            }
        });

        ws.on("close", () => {
            console.log("🔌 WS closed - User:", userId);
        });

        ws.on("error", (error) => {
            console.error("❌ WS error:", error);
        });
    });
};
