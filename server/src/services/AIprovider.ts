// services/ai/AIprovider.ts
import { GoogleGenAI } from "@google/genai";

export type AIProvider = "lmstudio" | "gemini";

export interface StreamChunk {
    content?: string;
    toolCalls?: ToolCall[];
    done: boolean;
}

export interface AIResponse {
    content: string;
    toolCalls: ToolCall[];
}

type ToolCall = {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
};

export class AIProviderService {
    private provider: AIProvider;
    private geminiClient?: GoogleGenAI;

    constructor() {
        this.provider = (process.env.AI_PROVIDER as AIProvider) || "lmstudio";

        if (this.provider === "gemini") {
            this.geminiClient = new GoogleGenAI({
                apiKey: process.env.GEMINI_API_KEY!,
            });
        }
    }

    async streamChat(
        messages: any[],
        tools: any[],
        onChunk: (chunk: StreamChunk) => void,
    ): Promise<void> {
        if (this.provider === "gemini") {
            return this.streamGemini(messages, tools, onChunk);
        } else {
            return this.streamLMStudio(messages, tools, onChunk);
        }
    }

    async getNonStreamingResponse(
        messages: any[],
        tools: any[],
    ): Promise<AIResponse> {
        if (this.provider === "gemini") {
            return this.getNonStreamingGemini(messages, tools);
        } else {
            return this.getNonStreamingLMStudio(messages, tools);
        }
    }

    // ============ LM STUDIO METHODS ============
    private async streamLMStudio(
        messages: any[],
        tools: any[],
        onChunk: (chunk: StreamChunk) => void,
    ): Promise<void> {
        const response = await fetch(process.env.MODEL_URL!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "mistralai/ministral-3-8b-reasoning",
                stream: true,
                messages: messages,
                tools: tools,
            }),
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let toolCalls: ToolCall[] = [];

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (!line.startsWith("data: ") || line === "data: [DONE]")
                    continue;

                try {
                    const payload = JSON.parse(line.replace("data: ", ""));
                    const delta = payload.choices?.[0]?.delta;

                    // Handle tool calls
                    if (delta?.tool_calls?.length) {
                        for (const tc of delta.tool_calls) {
                            const idx = tc.index ?? 0;
                            if (!toolCalls[idx]) {
                                toolCalls[idx] = {
                                    id: tc.id || `call_${Date.now()}_${idx}`,
                                    type: "function",
                                    function: { name: "", arguments: "" },
                                };
                            }
                            if (tc.function?.name)
                                toolCalls[idx].function.name +=
                                    tc.function.name;
                            if (tc.function?.arguments)
                                toolCalls[idx].function.arguments +=
                                    tc.function.arguments;
                            if (tc.id) toolCalls[idx].id = tc.id;
                        }
                    }

                    // Handle content
                    if (delta?.content) {
                        onChunk({
                            content: delta.content,
                            toolCalls: [],
                            done: false,
                        });
                    }
                } catch (e) {
                    console.error("Error parsing stream chunk:", e);
                }
            }
        }

        onChunk({ content: "", toolCalls, done: true });
    }

    // In AIprovider.ts - Update getNonStreamingLMStudio:

    private async getNonStreamingLMStudio(
        messages: any[],
        tools: any[],
    ): Promise<AIResponse> {
        console.log("\n🔍 LM Studio Request Debug:");
        console.log("- Messages count:", messages.length);
        console.log("- Tools count:", tools.length);
        console.log(
            "- Last user message:",
            messages[messages.length - 1]?.content?.substring(0, 100),
        );
        console.log("\n📋 Tools being sent:");
        tools.forEach((tool, idx) => {
            console.log(`  ${idx + 1}. ${tool.function.name}`);
        });

        const requestBody = {
            model: "mistralai/ministral-3-8b-reasoning",
            stream: false,
            messages: messages,
            tools: tools,
            tool_choice: "auto",
        };

        console.log("\n📤 Full request body:");
        console.log(JSON.stringify(requestBody, null, 2));

        const response = await fetch(process.env.MODEL_URL!, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        const data: any = await response.json();

        console.log("\n📥 LM Studio Response:");
        console.log(
            "- Content:",
            data.choices[0]?.message?.content?.substring(0, 200),
        );
        console.log(
            "- Tool calls:",
            data.choices[0]?.message?.tool_calls?.length || 0,
        );

        if (data.choices[0]?.message?.tool_calls) {
            console.log("🔧 Tool calls detected:");
            data.choices[0].message.tool_calls.forEach(
                (tc: any, idx: number) => {
                    console.log(`  ${idx + 1}. ${tc.function.name}`);
                },
            );
        }

        return {
            content: data.choices[0]?.message?.content || "",
            toolCalls: data.choices[0]?.message?.tool_calls || [],
        };
    }

    // ============ GEMINI METHODS ============
    private async streamGemini(
        messages: any[],
        tools: any[],
        onChunk: (chunk: StreamChunk) => void,
    ): Promise<void> {
        const model = "gemini-2.0-flash-exp";

        // Extract system message and convert messages
        const { systemInstruction, contents } =
            this.prepareGeminiMessages(messages);

        const config: any = {
            tools: this.convertToolsToGemini(tools),
        };

        // Add system instruction if present
        if (systemInstruction) {
            config.systemInstruction = systemInstruction;
        }

        console.log("🔍 Gemini Stream Config:");
        console.log("- System instruction present:", !!systemInstruction);
        console.log("- Messages count:", contents.length);
        console.log("- Tools count:", tools.length);

        const response = await this.geminiClient!.models.generateContentStream({
            model,
            config,
            contents,
        });

        let accumulatedToolCalls: ToolCall[] = [];

        for await (const chunk of response) {
            // Handle function calls
            if (chunk.candidates?.[0]?.content?.parts) {
                for (const part of chunk.candidates[0].content.parts) {
                    if (part.functionCall) {
                        console.log(
                            "🔧 Gemini tool call detected:",
                            part.functionCall.name,
                        );
                        accumulatedToolCalls.push({
                            id: `gemini_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            type: "function",
                            function: {
                                name: part.functionCall.name!,
                                arguments: JSON.stringify(
                                    part.functionCall.args || {},
                                ),
                            },
                        });
                    }

                    if (part.text) {
                        onChunk({
                            content: part.text,
                            toolCalls: [],
                            done: false,
                        });
                    }
                }
            }

            // Fallback
            if (chunk.text) {
                onChunk({
                    content: chunk.text,
                    toolCalls: [],
                    done: false,
                });
            }
        }

        onChunk({ content: "", toolCalls: accumulatedToolCalls, done: true });
    }

    private async getNonStreamingGemini(
        messages: any[],
        tools: any[],
    ): Promise<AIResponse> {
        const model = "gemini-2.0-flash-exp";

        // Extract system message and convert messages
        const { systemInstruction, contents } =
            this.prepareGeminiMessages(messages);

        const config: any = {
            tools: this.convertToolsToGemini(tools),
        };

        // Add system instruction if present
        if (systemInstruction) {
            config.systemInstruction = systemInstruction;
        }

        console.log("🔍 Gemini Non-Stream Config:");
        console.log("- System instruction present:", !!systemInstruction);
        console.log("- Messages count:", contents.length);
        console.log("- Tools count:", tools.length);

        const response = await this.geminiClient!.models.generateContent({
            model,
            config,
            contents,
        });

        const toolCalls: ToolCall[] = [];
        let textContent = "";

        // Extract function calls and text
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.functionCall) {
                    console.log(
                        "🔧 Gemini tool call detected:",
                        part.functionCall.name,
                    );
                    console.log(
                        "📦 Tool args:",
                        JSON.stringify(part.functionCall.args, null, 2),
                    );

                    toolCalls.push({
                        id: `gemini_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        type: "function",
                        function: {
                            name: part.functionCall.name!,
                            arguments: JSON.stringify(
                                part.functionCall.args || {},
                            ),
                        },
                    });
                }

                if (part.text) {
                    textContent += part.text;
                }
            }
        }

        return {
            content: textContent,
            toolCalls,
        };
    }

    // ============ CONVERSION METHODS ============
    private prepareGeminiMessages(messages: any[]): {
        systemInstruction?: { parts: { text: string }[] };
        contents: any[];
    } {
        let systemInstruction: { parts: { text: string }[] } | undefined;
        const contents: any[] = [];

        for (const msg of messages) {
            // Extract system message
            if (msg.role === "system") {
                systemInstruction = {
                    parts: [{ text: msg.content }],
                };
                continue;
            }

            // Handle tool results
            if (msg.role === "tool") {
                contents.push({
                    role: "function",
                    parts: [
                        {
                            functionResponse: {
                                name: msg.name,
                                response: this.parseToolContent(msg.content),
                            },
                        },
                    ],
                });
                continue;
            }

            // Handle assistant messages with tool calls
            if (msg.role === "assistant" && msg.tool_calls) {
                const parts = [];

                // Add text content if present
                if (msg.content) {
                    parts.push({ text: msg.content });
                }

                // Add function calls
                for (const tc of msg.tool_calls) {
                    parts.push({
                        functionCall: {
                            name: tc.function.name,
                            args: this.parseToolArguments(
                                tc.function.arguments,
                            ),
                        },
                    });
                }

                contents.push({
                    role: "model",
                    parts,
                });
                continue;
            }

            // Handle regular messages
            contents.push({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content || "" }],
            });
        }

        return { systemInstruction, contents };
    }

    private parseToolArguments(args: string): any {
        if (typeof args === "object") return args;
        try {
            return JSON.parse(args);
        } catch {
            console.error("Failed to parse tool arguments:", args);
            return {};
        }
    }

    private parseToolContent(content: string): any {
        try {
            return JSON.parse(content);
        } catch {
            return { content };
        }
    }

    private convertToolsToGemini(tools: any[]) {
        return [
            {
                functionDeclarations: tools.map((tool) => ({
                    name: tool.function.name,
                    description: tool.function.description,
                    parameters: tool.function.parameters,
                })),
            },
        ];
    }
}
