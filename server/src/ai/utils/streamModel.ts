import { WebSocket } from "ws";
import type { ChatMessage, ToolCall } from "../../types/index.ts";
import { LMstudio } from "../client/LMstudio.ts";
import { Gemini } from "../client/Gemini.ts";
import {
  ACTIVE_MODEL_PROVIDER,
  type AiInteractionLogger,
} from "../logging/index.ts";
import { sanitizeAssistantContent } from "./sanitizeAssistantContent.ts";

type ModelProvider = "lmstudio" | "gemini";

const PROVIDER: ModelProvider = ACTIVE_MODEL_PROVIDER;

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
  finishReason?: string | null;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

function parseStreamChunk(jsonString: string): StreamChunk | null {
  try {
    const json = JSON.parse(jsonString);
    const choice = json.choices?.[0];
    const delta = choice?.delta;

    if (!delta && !choice?.finish_reason && !json.usage) return null;

    return {
      content: delta?.content || undefined,
      toolCalls: delta?.tool_calls || undefined,
      finishReason: choice?.finish_reason ?? null,
      usage: json.usage,
    };
  } catch {
    return null;
  }
}

type StreamProcessContext = {
  ws: WebSocket;
  toolCallBuffer: Record<number, ToolCall>;
  visibleContent: { value: string };
  logger?: AiInteractionLogger | null;
  iteration: number;
  firstTokenRecorded: { value: boolean };
};

/** Process one SSE `data:` line — emit tokens and accumulate tool-call deltas. */
function processSseDataLine(data: string, ctx: StreamProcessContext): void {
  if (data === "[DONE]") return;

  const chunk = parseStreamChunk(data);
  if (!chunk) return;

  if (chunk.finishReason !== undefined && chunk.finishReason !== null) {
    ctx.logger?.recordUsageMetrics({ finishReason: chunk.finishReason });
  }

  if (chunk.usage) {
    const usageMetrics: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    } = {};

    if (chunk.usage.prompt_tokens !== undefined) {
      usageMetrics.promptTokens = chunk.usage.prompt_tokens;
    }
    if (chunk.usage.completion_tokens !== undefined) {
      usageMetrics.completionTokens = chunk.usage.completion_tokens;
    }
    if (chunk.usage.total_tokens !== undefined) {
      usageMetrics.totalTokens = chunk.usage.total_tokens;
    }

    ctx.logger?.recordUsageMetrics(usageMetrics);
  }

  if (chunk.content) {
    const safeChunk = sanitizeVisibleText(chunk.content);

    if (safeChunk) {
      if (!ctx.firstTokenRecorded.value) {
        ctx.firstTokenRecorded.value = true;
        ctx.logger?.recordFirstToken(ctx.iteration, safeChunk.length);
      }

      ctx.visibleContent.value += safeChunk;
      ctx.logger?.appendStreamedContent(safeChunk);
      ctx.logger?.recordTokenChunk(ctx.iteration, safeChunk);

      ctx.ws.send(
        JSON.stringify({
          type: "token",
          content: safeChunk,
        }),
      );
    }
  }

  if (chunk.toolCalls) {
    updateToolCallBuffer(ctx.toolCallBuffer, chunk.toolCalls);
  }
}

/** Parse complete lines from the SSE byte buffer; returns the unprocessed tail. */
function drainSseLineBuffer(
  buffer: string,
  ctx: StreamProcessContext,
): string {
  const lines = buffer.split("\n");
  const tail = lines.pop() ?? "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;

    const data = trimmed.slice("data:".length).trim();
    processSseDataLine(data, ctx);
  }

  return tail;
}

export async function streamModel(
  messages: ChatMessage[],
  ws: WebSocket,
  params?: {
    disableTools?: boolean;
    logger?: AiInteractionLogger | null;
    iteration?: number;
  },
): Promise<{ toolCalls: ToolCall[]; assistantContent: string }> {
  const iteration = params?.iteration ?? 1;
  const logger = params?.logger ?? null;

  ws.send(JSON.stringify({ type: "assistant_response_start" }));
  ws.send(JSON.stringify({ type: "state", state: "Connecting to the model" }));
  logger?.recordState("Connecting to the model", iteration);

  logger?.beginModelCall(iteration, messages, params?.disableTools ?? false);

  const stream = await getModelStream(messages, params?.disableTools ?? false);
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let toolCallBuffer: Record<number, ToolCall> = {};
  const visibleContentRef = { value: "" };
  const firstTokenRecorded = { value: false };
  const streamCtx: StreamProcessContext = {
    ws,
    toolCallBuffer,
    visibleContent: visibleContentRef,
    logger,
    iteration,
    firstTokenRecorded,
  };

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();

      if (value) {
        buffer += decoder.decode(value, { stream: true });
        buffer = drainSseLineBuffer(buffer, streamCtx);
      }

      if (done) {
        // Flush any bytes held inside the TextDecoder (incomplete UTF-8 sequences).
        buffer += decoder.decode();
        buffer = drainSseLineBuffer(buffer, streamCtx);

        // Process a final partial line that never received a trailing newline.
        const trimmedTail = buffer.trim();
        if (trimmedTail.startsWith("data:")) {
          const data = trimmedTail.slice("data:".length).trim();
          processSseDataLine(data, streamCtx);
        }

        break;
      }
    }
  } finally {
    reader.releaseLock();
  }

  const toolCalls = Object.values(toolCallBuffer).filter((tc) => tc.name);
  const cleanedResponse = sanitizeAssistantContent(visibleContentRef.value).trim();

  logger?.endModelCall({
    finalContent: cleanedResponse,
    toolCalls,
  });

  return {
    toolCalls,
    assistantContent: cleanedResponse,
  };
}
