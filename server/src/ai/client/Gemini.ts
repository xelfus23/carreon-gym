// src/ai/client/Gemini.ts
import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.ts";
import { tools as toolRegistry } from "../tools/toolRegistry.ts";
import type { ChatMessage } from "../../types/index.ts";

const model = {
  gemini_2_flash: "gemini-2.0-flash",
  gemini_2_5_flash_lite: "gemini-2.5-flash-lite",
  gemini_2_flash_lite: "gemini-2.0-flash-lite",
  gemini_2_5_flash: "gemini-2.5-flash",
};

function toGeminiContents(messages: ChatMessage[]) {
  const contents: any[] = [];

  for (const msg of messages) {
    if (msg.role === "system") continue;

    if (msg.role === "user") {
      contents.push({
        role: "user",
        parts: [
          {
            text:
              typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content),
          },
        ],
      });
    } else if (msg.role === "assistant") {
      const parts: any[] = [];

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if ((msg as any).tool_calls) {
        for (const tc of (msg as any).tool_calls) {
          let finalArgs = tc.function.arguments;

          if (typeof finalArgs === "string") {
            try {
              finalArgs = JSON.parse(finalArgs);
            } catch (e) {
              console.error("Failed to parse tool args:", finalArgs);
              finalArgs = {};
            }
          }

          parts.push({
            functionCall: {
              name: tc.function.name,
              args: finalArgs,
            },
          });
        }
      }

      contents.push({ role: "model", parts });
    } else if (msg.role === "tool") {
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

/** Gemini rejects schemas where `type` and `anyOf`/`oneOf`/`allOf` coexist on the same node. */
function sanitizeSchemaForGemini(
  schema: Record<string, unknown>,
): Record<string, unknown> {
  if (!schema || typeof schema !== "object") return schema;

  const { anyOf, oneOf, allOf, default: _default, ...rest } = schema;
  const hasComposition = anyOf != null || oneOf != null || allOf != null;

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(rest)) {
    if (key === "properties" && value && typeof value === "object") {
      const properties: Record<string, unknown> = {};
      for (const [propKey, propValue] of Object.entries(
        value as Record<string, unknown>,
      )) {
        properties[propKey] = sanitizeSchemaForGemini(
          propValue as Record<string, unknown>,
        );
      }
      sanitized.properties = properties;
      continue;
    }

    if (key === "items" && value && typeof value === "object") {
      sanitized.items = sanitizeSchemaForGemini(
        value as Record<string, unknown>,
      );
      continue;
    }

    sanitized[key] = value;
  }

  // Keep composition-only nodes; otherwise drop anyOf/oneOf/allOf when `type` is present.
  if (hasComposition && sanitized.type == null) {
    if (anyOf != null) {
      sanitized.anyOf = (anyOf as Record<string, unknown>[]).map((item) =>
        sanitizeSchemaForGemini(item),
      );
    }
    if (oneOf != null) {
      sanitized.oneOf = (oneOf as Record<string, unknown>[]).map((item) =>
        sanitizeSchemaForGemini(item),
      );
    }
    if (allOf != null) {
      sanitized.allOf = (allOf as Record<string, unknown>[]).map((item) =>
        sanitizeSchemaForGemini(item),
      );
    }
  }

  return sanitized;
}

function toGeminiTools(tools: any[]) {
  return [
    {
      functionDeclarations: tools.map((t) => ({
        name: t.function.name,
        description: t.function.description,
        parameters: sanitizeSchemaForGemini(t.function.parameters),
      })),
    },
  ];
}

function extractSystemInstruction(messages: ChatMessage[]): string | undefined {
  const sys = messages.find((m) => m.role === "system");
  return sys ? (sys.content as string) : undefined;
}

function normalizeGeminiError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error("Gemini request failed");
  }

  const rawMessage = error.message?.trim();
  if (!rawMessage) {
    return new Error("Gemini request failed");
  }

  const jsonStart = rawMessage.indexOf("{");
  if (jsonStart !== -1) {
    const jsonSlice = rawMessage.slice(jsonStart);
    try {
      const parsed = JSON.parse(jsonSlice) as {
        error?: { message?: string; status?: string; code?: number };
      };

      const providerMessage = parsed.error?.message;
      const providerStatus = parsed.error?.status;
      const providerCode = parsed.error?.code;

      if (providerMessage) {
        const statusLabel =
          providerStatus || providerCode
            ? `${providerStatus ?? "Error"}${providerCode ? ` (${providerCode})` : ""}`
            : "Gemini";
        return new Error(`${statusLabel}: ${providerMessage}`);
      }
    } catch {
      // Keep the original provider message if the JSON suffix is malformed.
    }
  }

  return error;
}

export const Gemini = async (
  messages: ChatMessage[],
  options?: { disableTools: boolean },
): Promise<ReadableStream<Uint8Array> | null> => {
  const ai = new GoogleGenAI({ apiKey: env.GOOGLE_API_KEY });

  const contents = toGeminiContents(messages);
  const systemInstruction = extractSystemInstruction(messages);
  const geminiTools = options?.disableTools
    ? undefined
    : toGeminiTools(toolRegistry);

  const config: Record<string, unknown> = {};
  if (systemInstruction) config.systemInstruction = systemInstruction;
  if (geminiTools) config.tools = geminiTools;

  let responseStream;
  const GEMINI_REQUEST_TIMEOUT_MS = 30000;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    responseStream = await Promise.race([
      ai.models.generateContentStream({
        model: model.gemini_2_5_flash_lite,
        contents,
        ...(Object.keys(config).length > 0 && { config }),
      }),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Gemini request timed out")),
          GEMINI_REQUEST_TIMEOUT_MS,
        );
      }),
    ]);
  } catch (error) {
    throw normalizeGeminiError(error);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }

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
              sseData = {
                choices: [
                  {
                    delta: { content: part.text },
                    finish_reason: null,
                  },
                ],
              };
            } else if (part.functionCall) {
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
                            arguments: JSON.stringify(
                              part.functionCall.args ?? {},
                            ),
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

        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      } catch (err) {
        controller.error(normalizeGeminiError(err));
      }
    },
  });
};
