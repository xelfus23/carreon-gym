import { WebSocketServer } from "ws";
import type { Server } from "http";
import jwt from "jsonwebtoken";
import pool from "../config/pool.ts";
import { Instructions } from "../utils/getInstructions.ts";
import { handleToolCall } from "./handleToolCall.ts";
import { tools } from "../utils/tools.ts";
import { getChatHistory } from "../utils/getChatHistory.ts";

export const setupWebSocket = (server: Server) => {
    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws, req) => {
        let userId: number | null = null;
        let session_Id: number | null = null;

        try {
            const url = new URL(req.url!, "http://localhost");
            const token = url.searchParams.get("token");
            const sessionIdStr = url.searchParams.get("session_id");

            if (!token) throw new Error("Missing token");
            if (!sessionIdStr) throw new Error("Missing Session ID");

            const payload = jwt.verify(token, process.env.JWT_SECRET_KEY!) as {
                id: number;
                role: string;
            };

            userId = payload.id;
            session_Id = parseInt(sessionIdStr);
            (ws as any).user = payload;
            console.log("WS authenticated:", payload.id);
        } catch (err) {
            console.error("WS auth failed:", err);
            ws.close();
            return;
        }

        ws.on("message", async (message) => {
            if (!userId || !session_Id) return;

            try {
                const { message: userPrompt } = JSON.parse(message.toString());

                const messagesPayload = await getChatHistory(
                    userId,
                    session_Id,
                    userPrompt,
                );

                let fullResponseText = "";
                let toolCalls: any[] = []; // 🔹 Accumulate tool calls
                let currentToolCall: any = null; // 🔹 Track current tool being built

                const lmResponse = await fetch(process.env.MODEL_URL!, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "mistralai/ministral-3-8b-reasoning",
                        stream: true,
                        messages: messagesPayload,
                        tools: tools,
                    }),
                });

                if (!lmResponse.body)
                    throw new Error("Model returned no stream");

                const reader = lmResponse.body.getReader();
                const decoder = new TextDecoder();

                while (ws.readyState === ws.OPEN) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (!line.startsWith("data: ")) continue;
                        if (line === "data: [DONE]") continue;

                        try {
                            const payload = JSON.parse(
                                line.replace("data: ", ""),
                            );
                            const delta = payload.choices?.[0]?.delta;

                            // 🔹 Handle tool calls (they stream incrementally)
                            if (
                                delta?.tool_calls &&
                                delta.tool_calls.length > 0
                            ) {
                                for (const toolCallDelta of delta.tool_calls) {
                                    const index = toolCallDelta.index || 0;

                                    // Initialize tool call if it doesn't exist
                                    if (!toolCalls[index]) {
                                        toolCalls[index] = {
                                            id: toolCallDelta.id || "",
                                            type:
                                                toolCallDelta.type ||
                                                "function",
                                            function: {
                                                name: "",
                                                arguments: "",
                                            },
                                        };
                                    }

                                    // Accumulate the function name
                                    if (toolCallDelta.function?.name) {
                                        toolCalls[index].function.name +=
                                            toolCallDelta.function.name;
                                    }

                                    // Accumulate the function arguments
                                    if (toolCallDelta.function?.arguments) {
                                        toolCalls[index].function.arguments +=
                                            toolCallDelta.function.arguments;
                                    }

                                    // Update ID if present
                                    if (toolCallDelta.id) {
                                        toolCalls[index].id = toolCallDelta.id;
                                    }
                                }
                            }

                            // 🔹 Only stream text content if no tools have been called
                            if (toolCalls.length === 0 && delta?.content) {
                                fullResponseText += delta.content;

                                ws.send(
                                    JSON.stringify({
                                        type: "token",
                                        content: delta.content,
                                    }),
                                );
                            }
                        } catch (parseErr) {
                            console.error("Error parsing chunk", parseErr);
                        }
                    }
                }

                // 🔹 After streaming is complete, execute tool calls if any
                if (toolCalls.length > 0) {
                    console.log("Processing tool calls:", toolCalls);

                    const toolResults: any[] = [];

                    for (const toolCall of toolCalls) {
                        try {
                            console.log(
                                "Executing tool:",
                                toolCall.function.name,
                            );
                            console.log(
                                "Arguments:",
                                toolCall.function.arguments,
                            );

                            const result = await handleToolCall(
                                toolCall.function,
                                userId,
                            );

                            toolResults.push({
                                tool_call_id: toolCall.id,
                                role: "tool",
                                name: toolCall.function.name,
                                content: JSON.stringify(result),
                            });

                            ws.send(
                                JSON.stringify({
                                    type: "tool_result",
                                    toolName: toolCall.function.name,
                                    result: result,
                                }),
                            );
                        } catch (toolErr) {
                            console.error("Tool execution error:", toolErr);
                            ws.send(
                                JSON.stringify({
                                    type: "tool_error",
                                    toolName: toolCall.function.name,
                                    error: "Failed to execute tool",
                                }),
                            );
                        }
                    }

                    // 🔹 Now make another LLM call with the tool results
                    const followUpMessages = [
                        ...messagesPayload,
                        {
                            role: "assistant",
                            content: null,
                            tool_calls: toolCalls,
                        },
                        ...toolResults,
                    ];

                    let finalResponseText = "";

                    const followUpResponse = await fetch(
                        process.env.MODEL_URL!,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                model: "mistralai/ministral-3-8b-reasoning",
                                stream: true,
                                messages: followUpMessages,
                                tools: tools,
                            }),
                        },
                    );

                    if (!followUpResponse.body)
                        throw new Error("Model returned no stream");

                    const followUpReader = followUpResponse.body.getReader();

                    while (ws.readyState === ws.OPEN) {
                        const { value, done } = await followUpReader.read();
                        if (done) break;

                        const chunk = decoder.decode(value);
                        const lines = chunk.split("\n");

                        for (const line of lines) {
                            if (!line.startsWith("data: ")) continue;
                            if (line === "data: [DONE]") continue;

                            try {
                                const payload = JSON.parse(
                                    line.replace("data: ", ""),
                                );
                                const delta = payload.choices?.[0]?.delta;

                                if (delta?.content) {
                                    finalResponseText += delta.content;

                                    ws.send(
                                        JSON.stringify({
                                            type: "token",
                                            content: delta.content,
                                        }),
                                    );
                                }
                            } catch (parseErr) {
                                console.error("Error parsing chunk", parseErr);
                            }
                        }
                    }

                    // 🔹 Save the final AI response to DB
                    if (finalResponseText.trim().length > 0) {
                        await pool.query(
                            `INSERT INTO chat_messages (session_id, role, content) 
                             VALUES ($1, $2, $3)`,
                            [session_Id, "assistant", finalResponseText],
                        );
                        console.log("Final AI response saved to DB");
                    }
                } else if (fullResponseText.trim().length > 0) {
                    // 🔹 Save AI response only if it's text (not tool calls)
                    await pool.query(
                        `INSERT INTO chat_messages (session_id, role, content) 
                         VALUES ($1, $2, $3)`,
                        [session_Id, "assistant", fullResponseText],
                    );
                    console.log("AI response saved to DB");
                }

                ws.send(JSON.stringify({ type: "done" }));
            } catch (err) {
                console.error("WS streaming error:", err);
                if (ws.readyState === ws.OPEN) {
                    ws.send(
                        JSON.stringify({
                            type: "error",
                            message: "Something went wrong",
                        }),
                    );
                }
            }
        });

        ws.on("close", () => {
            console.log("Client disconnected:", userId);
        });
    });
};
