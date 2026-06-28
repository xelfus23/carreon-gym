import type { ChatMessage, ToolCall } from "../../types/index.ts";

/** Rough token estimate (~4 characters per token for English-like text). */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

function messageToText(message: ChatMessage): string {
  const parts: string[] = [];

  if (typeof message.content === "string" && message.content.trim()) {
    parts.push(message.content);
  }

  if (message.tool_calls?.length) {
    for (const call of message.tool_calls) {
      parts.push(call.function?.name ?? "");
      parts.push(call.function?.arguments ?? "");
    }
  }

  if (message.role === "tool") {
    parts.push(message.name ?? "");
  }

  return parts.join("\n");
}

export function estimateInputTokensFromMessages(messages: ChatMessage[]): number {
  return messages.reduce(
    (total, message) => total + estimateTokenCount(messageToText(message)),
    0,
  );
}

export function estimateOutputTokens(
  rawContent: string,
  toolCalls: ToolCall[],
): number {
  const contentTokens = estimateTokenCount(rawContent);

  if (contentTokens > 0) return contentTokens;

  if (!toolCalls.length) return 0;

  const toolText = toolCalls
    .map(
      (call) =>
        `${call.name}\n${call.arguments}`,
    )
    .join("\n");

  return estimateTokenCount(toolText);
}

export function estimateToolDefinitionTokens(toolJsonLength: number): number {
  return estimateTokenCount(" ".repeat(toolJsonLength));
}
