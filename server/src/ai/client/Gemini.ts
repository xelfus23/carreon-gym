// src/ai/client/Gemini.ts
import { GoogleGenAI, Type } from "@google/genai";
import { env } from "../../config/env.ts";
import { tools as toolRegistry } from "../tools/toolRegistry.ts";
import type { ChatMessage } from "../../types/index.ts";

const model = "gemini-2.0-flash";

/**
 * Converts your internal ChatMessage[] format to Gemini's `contents` format.
 * Handles: user, assistant (model), tool (function response), system
 */
function toGeminiContents(messages: ChatMessage[]) {
    const contents: any[] = [];

    for (const msg of messages) {
        if (msg.role === "system") continue; // handled separately as systemInstruction

        if (msg.role === "user") {
            contents.push({
                role: "user",
                parts: [{ text: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content) }],
            });
        } else if (msg.role === "assistant") {
            const parts: any[] = [];

            if (msg.content) {
                parts.push({ text: msg.content });
            }

            // Convert tool_calls to Gemini functionCall parts
            if ((msg as any).tool_calls) {
                for (const tc of (msg as any).tool_calls) {
                    parts.push({
                        functionCall: {
                            name: tc.function.name,
                            args: JSON.parse(tc.function.arguments || "{}"),
                        },
                    });
                }
            }

            contents.push({ role: "model", parts });
        } else if (msg.role === "tool") {
            // Gemini expects tool results as role: "user" with functionResponse parts
            contents.push({
                role: "user",
                parts: [
                    {
                        functionResponse: {
                            name: msg.name,
                            response: {
                                content: (() => {
                                    try {
                                        return JSON.parse(msg.content as string);
                                    } catch {
                                        return { result: msg.content };
                                    }
                                })(),
                            },
                        },
                    },
                ],
            });
        }
    }

    return contents;
}

/**
 * Converts your internal tool registry to Gemini's FunctionDeclaration format.
 * Assumes toolRegistry uses OpenAI-style tool definitions.
 */
function toGeminiTools(tools: any[]) {
    return [
        {
            functionDeclarations: tools.map((t) => ({
                name: t.function.name,
                description: t.function.description,
                parameters: t.function.parameters,
            })),
        },
    ];
}

/**
 * Extracts system prompt from messages (first system message).
 */
function extractSystemInstruction(messages: ChatMessage[]): string | undefined {
    const sys = messages.find((m) => m.role === "system");
    return sys ? (sys.content as string) : undefined;
}

/**
 * Drop-in replacement for LMstudio().
 * Returns a ReadableStream<Uint8Array> in SSE format (data: ...\n\n)
 * so that streamModel.ts works without modification.
 */
export const Gemini = async (
    messages: ChatMessage[],
    options?: { disableTools: boolean },
): Promise<ReadableStream<Uint8Array> | null> => {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    const contents = toGeminiContents(messages);
    const systemInstruction = extractSystemInstruction(messages);
    const geminiTools = options?.disableTools ? undefined : toGeminiTools(toolRegistry);

    const responseStream = await ai.models.generateContentStream({
        model,
        contents,
        ...(systemInstruction && { config: { systemInstruction } }),
        ...(geminiTools && { config: { tools: geminiTools } }),
    });

    // Wrap Gemini's async iterable into a ReadableStream that emits SSE chunks,
    // so streamModel.ts (which calls response.getReader()) works unchanged.
    return new ReadableStream<Uint8Array>({
        async start(controller) {
            const encoder = new TextEncoder();

            try {
                for await (const chunk of responseStream) {
                    const candidate = chunk.candidates?.[0];
                    if (!candidate) continue;

                    const parts = candidate.content?.parts ?? [];

                    for (const part of parts) {
                        let sseData: object | null = null;

                        if (part.text) {
                            // Regular text token
                            sseData = {
                                choices: [
                                    {
                                        delta: { content: part.text },
                                        finish_reason: null,
                                    },
                                ],
                            };
                        } else if (part.functionCall) {
                            // Tool call — emit as OpenAI-style tool_calls delta
                            sseData = {
                                choices: [
                                    {
                                        delta: {
                                            tool_calls: [
                                                {
                                                    index: 0,
                                                    id: `call_${part.functionCall.name}_${Date.now()}`,
                                                    function: {
                                                        name: part.functionCall.name,
                                                        arguments: JSON.stringify(part.functionCall.args ?? {}),
                                                    },
                                                },
                                            ],
                                        },
                                        finish_reason: null,
                                    },
                                ],
                            };
                        }

                        if (sseData) {
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`),
                            );
                        }
                    }
                }

                // Signal end-of-stream
                controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                controller.close();
            } catch (err) {
                controller.error(err);
            }
        },
    });
};