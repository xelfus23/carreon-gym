import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ChatMessage, ToolCall } from "../../types/index.ts";
import { tools } from "../tools/toolRegistry.ts";
import { aiLogConfig, isAiInteractionLoggingEnabled } from "./config.ts";
import { redactForLog } from "./redact.ts";
import {
  estimateInputTokensFromMessages,
  estimateOutputTokens,
  estimateTokenCount,
} from "./tokenEstimate.ts";
import type {
  AiInteractionLog,
  CreateLoggerParams,
  InteractionTokenUsage,
  ModelCallLog,
  StreamEvent,
  StreamEventType,
  ToolExecutionLog,
} from "./types.ts";

function isoNow(): string {
  return new Date().toISOString();
}

function formatLogFilename(sessionId: number, requestId: string): string {
  const stamp = new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\..+$/, "")
    .replace("T", "_");

  return `${stamp}_session${sessionId}_${requestId.slice(0, 8)}.json`;
}

const TOOL_DEFINITION_TOKEN_ESTIMATE = estimateTokenCount(JSON.stringify(tools));

function resolveModelCallTokens(
  active: ActiveModelCall,
  result: { finalContent: string; toolCalls: ToolCall[] },
): Pick<
  ModelCallLog["performance"],
  "inputTokens" | "outputTokens" | "totalTokens" | "tokenSource" | "promptTokens" | "completionTokens"
> {
  const hasProviderInput = active.promptTokens !== undefined;
  const hasProviderOutput = active.completionTokens !== undefined;

  const estimatedInput =
    estimateInputTokensFromMessages(active.requestMessages) +
    (active.disableTools ? 0 : TOOL_DEFINITION_TOKEN_ESTIMATE);

  const estimatedOutput = estimateOutputTokens(
    active.rawStreamedContent || result.finalContent,
    result.toolCalls,
  );

  const inputTokens = hasProviderInput ? active.promptTokens! : estimatedInput;
  const outputTokens = hasProviderOutput
    ? active.completionTokens!
    : estimatedOutput;

  const totalTokens = active.totalTokens ?? inputTokens + outputTokens;
  const tokenSource: "provider" | "estimated" =
    hasProviderInput && hasProviderOutput ? "provider" : "estimated";

  const resolved: Pick<
    ModelCallLog["performance"],
    "inputTokens" | "outputTokens" | "totalTokens" | "tokenSource"
  > & {
    promptTokens?: number;
    completionTokens?: number;
  } = {
    inputTokens,
    outputTokens,
    totalTokens,
    tokenSource,
  };

  if (hasProviderInput && active.promptTokens !== undefined) {
    resolved.promptTokens = active.promptTokens;
  }
  if (hasProviderOutput && active.completionTokens !== undefined) {
    resolved.completionTokens = active.completionTokens;
  }

  return resolved;
}

function buildInteractionTokenUsage(
  modelCalls: ModelCallLog[],
): InteractionTokenUsage {
  const perModelCall = modelCalls.map((call) => ({
    iteration: call.iteration,
    inputTokens: call.performance.inputTokens,
    outputTokens: call.performance.outputTokens,
    totalTokens: call.performance.totalTokens,
    tokenSource: call.performance.tokenSource,
  }));

  const totalInputTokens = perModelCall.reduce(
    (sum, call) => sum + call.inputTokens,
    0,
  );
  const totalOutputTokens = perModelCall.reduce(
    (sum, call) => sum + call.outputTokens,
    0,
  );
  const totalTokens = perModelCall.reduce(
    (sum, call) => sum + call.totalTokens,
    0,
  );

  const sources = new Set(perModelCall.map((call) => call.tokenSource));
  const tokenSource: InteractionTokenUsage["tokenSource"] =
    sources.size > 1
      ? "mixed"
      : sources.has("provider")
        ? "provider"
        : "estimated";

  return {
    modelRequestCount: modelCalls.length,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    tokenSource,
    perModelCall,
  };
}

type ActiveModelCall = {
  iteration: number;
  disableTools: boolean;
  requestStartTime: string;
  requestStartMs: number;
  requestMessages: ChatMessage[];
  firstTokenTime?: string;
  firstTokenMs?: number;
  rawStreamedContent: string;
  finishReason?: string | null;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

/**
 * Accumulates one user→assistant interaction in memory and persists it
 * asynchronously to disk when finalize() is called.
 *
 * Designed for zero impact on streaming: no awaits on the hot path,
 * no per-token JSON serialization unless explicitly enabled.
 */
export class AiInteractionLogger {
  private readonly requestId: string;
  private readonly interactionStartTime: string;
  private readonly interactionStartMs: number;
  private readonly params: CreateLoggerParams;

  private status: AiInteractionLog["metadata"]["status"] = "partial";
  private finalResponseContent: string | null = null;
  private error: AiInteractionLog["error"] = null;

  private readonly streamEvents: StreamEvent[] = [];
  private readonly modelCalls: ModelCallLog[] = [];
  private readonly toolExecutions: ToolExecutionLog[] = [];
  private activeModelCall: ActiveModelCall | null = null;

  private finalized = false;

  constructor(params: CreateLoggerParams) {
    this.requestId = randomUUID();
    this.interactionStartTime = isoNow();
    this.interactionStartMs = Date.now();
    this.params = params;

    this.pushEvent("interaction_started");
  }

  getRequestId(): string {
    return this.requestId;
  }

  recordState(state: string, iteration?: number): void {
    this.pushEvent("state_update", {
      state,
      ...(iteration !== undefined ? { iteration } : {}),
    });
  }

  beginModelCall(
    iteration: number,
    messages: ChatMessage[],
    disableTools: boolean,
  ): void {
    this.activeModelCall = {
      iteration,
      disableTools,
      requestStartTime: isoNow(),
      requestStartMs: Date.now(),
      requestMessages: structuredClone(messages),
      rawStreamedContent: "",
    };

    this.pushEvent("stream_started", { iteration });
  }

  recordFirstToken(iteration: number, tokenLength: number): void {
    if (!this.activeModelCall || this.activeModelCall.firstTokenMs) return;

    this.activeModelCall.firstTokenMs = Date.now();
    this.activeModelCall.firstTokenTime = isoNow();

    this.pushEvent("first_token", { iteration, tokenLength });
  }

  /** Optional per-token logging — disabled by default for performance. */
  recordTokenChunk(iteration: number, token: string): void {
    if (!aiLogConfig.logPartialTokens) return;

    this.pushEvent("token_chunk", {
      iteration,
      tokenPreview: token.slice(0, 80),
      tokenLength: token.length,
    });
  }

  appendStreamedContent(chunk: string): void {
    if (!this.activeModelCall) return;
    this.activeModelCall.rawStreamedContent += chunk;
  }

  recordUsageMetrics(metrics: {
    finishReason?: string | null;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  }): void {
    if (!this.activeModelCall) return;

    if (metrics.finishReason !== undefined) {
      this.activeModelCall.finishReason = metrics.finishReason;
    }
    if (metrics.promptTokens !== undefined) {
      this.activeModelCall.promptTokens = metrics.promptTokens;
    }
    if (metrics.completionTokens !== undefined) {
      this.activeModelCall.completionTokens = metrics.completionTokens;
    }
    if (metrics.totalTokens !== undefined) {
      this.activeModelCall.totalTokens = metrics.totalTokens;
    }
  }

  endModelCall(result: {
    finalContent: string;
    toolCalls: ToolCall[];
  }): void {
    if (!this.activeModelCall) return;

    const completedMs = Date.now();
    const streamedCharacterCount = this.activeModelCall.rawStreamedContent.length;
    const totalGenerationMs = completedMs - this.activeModelCall.requestStartMs;
    const firstTokenLatencyMs =
      this.activeModelCall.firstTokenMs !== undefined
        ? this.activeModelCall.firstTokenMs - this.activeModelCall.requestStartMs
        : undefined;

    const generationWindowMs =
      firstTokenLatencyMs !== undefined
        ? totalGenerationMs - firstTokenLatencyMs
        : totalGenerationMs;

    const estimatedTokensPerSecond =
      generationWindowMs > 0
        ? streamedCharacterCount / (generationWindowMs / 1000)
        : undefined;

    const tokenMetrics = resolveModelCallTokens(this.activeModelCall, result);

    const performance: ModelCallLog["performance"] = {
      requestStartTime: this.activeModelCall.requestStartTime,
      streamCompletedTime: isoNow(),
      totalGenerationMs,
      streamedCharacterCount,
      finishReason: this.activeModelCall.finishReason ?? null,
      inputTokens: tokenMetrics.inputTokens,
      outputTokens: tokenMetrics.outputTokens,
      totalTokens: tokenMetrics.totalTokens,
      tokenSource: tokenMetrics.tokenSource,
    };

    if (this.activeModelCall.firstTokenTime) {
      performance.firstTokenTime = this.activeModelCall.firstTokenTime;
    }
    if (firstTokenLatencyMs !== undefined) {
      performance.firstTokenLatencyMs = firstTokenLatencyMs;
    }
    if (estimatedTokensPerSecond !== undefined) {
      performance.estimatedTokensPerSecond = estimatedTokensPerSecond;
    }
    if (tokenMetrics.promptTokens !== undefined) {
      performance.promptTokens = tokenMetrics.promptTokens;
    }
    if (tokenMetrics.completionTokens !== undefined) {
      performance.completionTokens = tokenMetrics.completionTokens;
    }

    const modelCall: ModelCallLog = {
      iteration: this.activeModelCall.iteration,
      disableTools: this.activeModelCall.disableTools,
      requestMessages: this.activeModelCall.requestMessages,
      response: {
        rawStreamedContent: this.activeModelCall.rawStreamedContent,
        finalContent: result.finalContent,
        toolCalls: structuredClone(result.toolCalls),
        finishReason: this.activeModelCall.finishReason ?? null,
      },
      performance,
    };

    this.modelCalls.push(modelCall);
    this.pushEvent("stream_completed", { iteration: this.activeModelCall.iteration });
    this.activeModelCall = null;
  }

  recordToolStart(
    toolCallId: string,
    name: string,
    args: Record<string, unknown>,
  ): void {
    this.toolExecutions.push({
      toolCallId,
      name,
      arguments: args,
      startedAt: isoNow(),
    });

    this.pushEvent("tool_execution_start", { toolName: name, toolCallId });
  }

  recordToolResult(toolCallId: string, result: unknown): void {
    const entry = this.findOpenToolExecution(toolCallId);
    if (!entry) return;

    entry.result = result;
    entry.completedAt = isoNow();
    entry.durationMs =
      new Date(entry.completedAt).getTime() -
      new Date(entry.startedAt).getTime();

    this.pushEvent("tool_execution_done", {
      toolName: entry.name,
      toolCallId,
    });
  }

  recordToolError(toolCallId: string, message: string): void {
    const entry = this.findOpenToolExecution(toolCallId);
    if (!entry) return;

    entry.error = message;
    entry.completedAt = isoNow();
    entry.durationMs =
      new Date(entry.completedAt).getTime() -
      new Date(entry.startedAt).getTime();

    this.pushEvent("tool_execution_error", {
      toolName: entry.name,
      toolCallId,
      message,
    });
  }

  setFinalResponse(content: string | null | undefined): void {
    this.finalResponseContent = content ?? null;
  }

  recordError(error: unknown, phase?: string): void {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");

    this.error = phase ? { message, phase } : { message };
    this.status = "error";
    this.pushEvent("error", phase ? { message, phase } : { message });
  }

  finalize(status: "completed" | "error" | "partial" = "completed"): void {
    if (this.finalized) return;
    this.finalized = true;

    if (status === "completed" && this.status !== "error") {
      this.status = "completed";
    } else if (status === "error") {
      this.status = "error";
    }

    this.pushEvent("interaction_completed");

    const payload = this.buildPayload();
    void this.persist(payload);
  }

  private findOpenToolExecution(toolCallId: string): ToolExecutionLog | undefined {
    return this.toolExecutions.find(
      (entry) => entry.toolCallId === toolCallId && !entry.completedAt,
    );
  }

  private pushEvent(
    type: StreamEventType,
    extra?: Partial<StreamEvent>,
  ): void {
    this.streamEvents.push({
      timestamp: isoNow(),
      type,
      ...extra,
    });
  }

  private buildPayload(): AiInteractionLog {
    const interactionEndTime = isoNow();
    const totalDurationMs = Date.now() - this.interactionStartMs;
    const systemMessage = this.params.initialMessages.find(
      (message) => message.role === "system",
    );

    return redactForLog({
      metadata: {
        requestId: this.requestId,
        timestamp: this.interactionStartTime,
        sessionId: this.params.sessionId,
        userId: this.params.userId,
        conversationId: this.params.sessionId,
        provider: this.params.provider,
        modelName: this.params.modelName,
        status: this.status,
      },
      systemPrompt:
        typeof systemMessage?.content === "string" ? systemMessage.content : "",
      context: {
        ...this.params.promptContext,
        userPrompt: this.params.userPrompt,
        ...(this.params.personalization
          ? { personalization: this.params.personalization }
          : {}),
      },
      messages: this.params.initialMessages,
      toolDefinitions: tools,
      modelCalls: this.modelCalls,
      toolExecutions: this.toolExecutions,
      streamEvents: this.streamEvents,
      finalResponse: this.finalResponseContent
        ? { role: "assistant", content: this.finalResponseContent }
        : null,
      performance: {
        interactionStartTime: this.interactionStartTime,
        interactionEndTime,
        totalDurationMs,
        modelCallCount: this.modelCalls.length,
        toolExecutionCount: this.toolExecutions.length,
        tokenUsage: buildInteractionTokenUsage(this.modelCalls),
      },
      error: this.error,
    });
  }

  private async persist(payload: AiInteractionLog): Promise<void> {
    try {
      const directory = path.resolve(process.cwd(), aiLogConfig.logDirectory);
      await mkdir(directory, { recursive: true });

      const filename = formatLogFilename(
        this.params.sessionId,
        this.requestId,
      );
      const filePath = path.join(directory, filename);

      await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
    } catch (err) {
      console.error("Failed to persist AI interaction log:", err);
    }
  }
}

export function createInteractionLogger(
  params: CreateLoggerParams,
): AiInteractionLogger | null {
  if (!isAiInteractionLoggingEnabled()) return null;
  return new AiInteractionLogger(params);
}
