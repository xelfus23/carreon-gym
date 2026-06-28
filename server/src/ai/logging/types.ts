import type { ChatMessage, ToolCall } from "../../types/index.ts";
import type { PromptContext } from "../prompts/buildSystemPrompt.ts";
import type { AiPersonalization } from "../prompts/buildSystemPrompt.ts";

export type StreamEventType =
  | "interaction_started"
  | "stream_started"
  | "state_update"
  | "first_token"
  | "token_chunk"
  | "tool_execution_start"
  | "tool_execution_done"
  | "tool_execution_error"
  | "stream_completed"
  | "interaction_completed"
  | "error";

export type StreamEvent = {
  timestamp: string;
  type: StreamEventType;
  iteration?: number;
  state?: string;
  toolName?: string;
  toolCallId?: string;
  message?: string;
  phase?: string;
  /** Present only when AI_INTERACTION_LOG_TOKENS=true */
  tokenPreview?: string;
  tokenLength?: number;
};

export type ModelCallPerformance = {
  requestStartTime: string;
  firstTokenTime?: string;
  streamCompletedTime?: string;
  firstTokenLatencyMs?: number;
  totalGenerationMs?: number;
  streamedCharacterCount: number;
  estimatedTokensPerSecond?: number;
  /** Input/prompt tokens (provider count or estimate). */
  inputTokens: number;
  /** Output/completion tokens (provider count or estimate). */
  outputTokens: number;
  totalTokens: number;
  tokenSource: "provider" | "estimated";
  /** Provider-reported values when available. */
  promptTokens?: number;
  completionTokens?: number;
  finishReason?: string | null;
};

export type ModelCallLog = {
  iteration: number;
  disableTools: boolean;
  requestMessages: ChatMessage[];
  response: {
    rawStreamedContent: string;
    finalContent: string;
    toolCalls: ToolCall[];
    finishReason?: string | null;
  };
  performance: ModelCallPerformance;
};

export type ToolExecutionLog = {
  toolCallId: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  error?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
};

export type InteractionTokenUsage = {
  /** Number of HTTP/streaming requests sent to the model API. */
  modelRequestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  tokenSource: "provider" | "estimated" | "mixed";
  perModelCall: Array<{
    iteration: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    tokenSource: "provider" | "estimated";
  }>;
};

export type AiInteractionLog = {
  metadata: {
    requestId: string;
    timestamp: string;
    sessionId: number;
    userId: number;
    conversationId: number;
    provider: string;
    modelName: string;
    status: "completed" | "error" | "partial";
  };
  systemPrompt: string;
  context: PromptContext & { userPrompt: string; personalization?: AiPersonalization };
  messages: ChatMessage[];
  toolDefinitions: unknown[];
  modelCalls: ModelCallLog[];
  toolExecutions: ToolExecutionLog[];
  streamEvents: StreamEvent[];
  finalResponse: {
    role: "assistant";
    content: string | null;
  } | null;
  performance: {
    interactionStartTime: string;
    interactionEndTime: string;
    totalDurationMs: number;
    modelCallCount: number;
    toolExecutionCount: number;
    tokenUsage: InteractionTokenUsage;
  };
  error: { message: string; phase?: string } | null;
};

export type CreateLoggerParams = {
  userId: number;
  sessionId: number;
  userPrompt: string;
  promptContext: PromptContext;
  initialMessages: ChatMessage[];
  personalization?: AiPersonalization;
  provider: string;
  modelName: string;
};
