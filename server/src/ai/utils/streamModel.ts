import { WebSocket } from "ws";
import type { ChatMessage, ToolCall } from "../../types/index.ts";
import { LMstudio } from "../client/LMstudio.ts";
import { Gemini } from "../client/Gemini.ts";
import { sanitizeAssistantContent } from "./sanitizeAssistantContent.ts";

type ModelProvider = "lmstudio" | "gemini";

const PROVIDER: ModelProvider = "lmstudio";

/** Selects and calls the appropriate AI model provider */
async function getModelStream(
  messages: ChatMessage[],
  disableTools: boolean,
): Promise<ReadableStream<Uint8Array>> {
  const provider = PROVIDER === "lmstudio" ? LMstudio : Gemini;
  const stream = await provider(messages, { disableTools });

  if (!stream) {
    throw new Error("No response from model");
  }

  return stream;
}

/** Accumulates partial tool call data from streaming chunks */
function updateToolCallBuffer(
  buffer: Record<number, ToolCall>,
  toolCalls: Array<any>,
): void {
  for (const tc of toolCalls) {
    const index = tc.index ?? 0;

    if (!buffer[index]) {
      buffer[index] = {
        id: tc.id || `tool_${index}`,
        name: tc.function?.name || "",
        arguments: tc.function?.arguments || "",
      };
    } else {
      if (tc.id) buffer[index].id = tc.id;
      if (tc.function?.name) buffer[index].name += tc.function.name;
      if (tc.function?.arguments) {
        buffer[index].arguments += tc.function.arguments;
      }
    }
  }
}

/** Removes sensitive field names from assistant responses */
function sanitizeVisibleText(content: string): string {
  return content
    .replace(
      /"?\b(?:equipment_id|exercise_id|day_id|plan_id|workout_id|member_id|user_id|session_id)\b"?\s*[:=]\s*"?[a-z0-9_-]+"?,?/gi,
      "",
    )
    .replace(
      /\b(?:equipment_id|exercise_id|day_id|plan_id|workout_id|member_id|user_id|session_id)\b\s*[:=]\s*[a-z0-9_-]+/gi,
      "",
    );
}

/** Parses and processes a single streaming response chunk */
interface StreamChunk {
  content?: string;
  toolCalls?: Array<any>;
}

function parseStreamChunk(jsonString: string): StreamChunk | null {
  try {
    const json = JSON.parse(jsonString);
    const delta = json.choices?.[0]?.delta;

    if (!delta) return null;

    return {
      content: delta.content || undefined,
      toolCalls: delta.tool_calls || undefined,
    };
  } catch {
    return null;
  }
}

export async function streamModel(
  messages: ChatMessage[],
  ws: WebSocket,
  params?: { disableTools?: boolean },
): Promise<{ toolCalls: ToolCall[]; assistantContent: string }> {
  ws.send(JSON.stringify({ type: "assistant_response_start" }));
  ws.send(JSON.stringify({ type: "state", state: "Connecting to the model" }));

  const stream = await getModelStream(messages, params?.disableTools ?? false);
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let toolCallBuffer: Record<number, ToolCall> = {};
  let visibleContent = "";

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed.startsWith("data:")) continue;

        const data = trimmed.slice("data:".length).trim();

        if (data === "[DONE]") {
          // Mark completion by breaking inner loop, outer loop will detect EOF
          continue;
        }

        const chunk = parseStreamChunk(data);
        if (!chunk) continue;

        // Process text content
        if (chunk.content) {
          const safeChunk = sanitizeVisibleText(chunk.content);

          if (safeChunk) {
            visibleContent += safeChunk;
            ws.send(
              JSON.stringify({
                type: "token",
                content: safeChunk,
              }),
            );
          }
        }

        // Accumulate tool calls
        if (chunk.toolCalls) {
          updateToolCallBuffer(toolCallBuffer, chunk.toolCalls);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  const toolCalls = Object.values(toolCallBuffer).filter((tc) => tc.name);
  const cleanedResponse = sanitizeAssistantContent(visibleContent).trim();

  return {
    toolCalls,
    assistantContent: cleanedResponse,
  };
}
