import { WebSocket } from "ws";
import type { ChatMessage, ToolCall } from "../../types/index.ts";
import { LMstudio } from "../client/LMstudio.ts";
import { Gemini } from "../client/Gemini.ts";
import { env } from "../../config/env.ts";
import { sanitizeAssistantContent } from "./sanitizeAssistantContent.ts";

export const modelProvider = async (
  messages: ChatMessage[],
  options?: { disableTools: boolean },
) => {
  if (env.PROVIDER === "gemini") {
    return Gemini(messages, options);
  }
  return LMstudio(messages);
};

export async function streamModel(
  messages: ChatMessage[],
  ws: WebSocket,
  params?: { disableTools?: boolean },
): Promise<{ toolCalls: ToolCall[]; assistantContent: string }> {
  ws.send(JSON.stringify({ type: "assistant_response_start" }));

  const response = await modelProvider(messages, {
    disableTools: params?.disableTools ?? false,
  });

  if (!response) {
    throw new Error("No response from model");
  }

  const reader = response.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let toolCallBuffer: Record<number, ToolCall> = {};
  let pendingText = "";

  let assistantContent = "";
  let visibleContent = "";

  let inThinkBlock = true;
  let done = false;

  const THINK_OPEN = "<think>";
  const THINK_CLOSE = "</think>";

  const sanitizeVisibleText = (content: string) =>
    content
      .replace(
        /"?\b(?:equipment_id|exercise_id|day_id|plan_id|workout_id|member_id|user_id|session_id)\b"?\s*[:=]\s*"?[a-z0-9_-]+"?,?/gi,
        "",
      )
      .replace(
        /\b(?:equipment_id|exercise_id|day_id|plan_id|workout_id|member_id|user_id|session_id)\b\s*[:=]\s*[a-z0-9_-]+/gi,
        "",
      );

  const consumeSafeStreamText = (chunk: string): string => {
    pendingText += chunk;
    let visible = "";

    while (pendingText.length > 0) {
      const lower = pendingText.toLowerCase();

      if (inThinkBlock) {
        const closeIdx = lower.indexOf(THINK_CLOSE);
        if (closeIdx === -1) {
          // Still in thinking block, buffer the tail to check for the tag in next chunk
          if (pendingText.length > THINK_CLOSE.length) {
            pendingText = pendingText.slice(pendingText.length - THINK_CLOSE.length);
          }
          return "";
        }

        // Found the end of thoughts!
        pendingText = pendingText.slice(closeIdx + THINK_CLOSE.length);
        inThinkBlock = false;
        continue;
      }

      // Check for a new think block (unlikely after the first one, but good for safety)
      const openIdx = lower.indexOf(THINK_OPEN);
      if (openIdx === -1) {
        const safeLen = Math.max(0, pendingText.length - THINK_OPEN.length);
        if (safeLen === 0) return sanitizeVisibleText(visible);
        visible += pendingText.slice(0, safeLen);
        pendingText = pendingText.slice(safeLen);
        return sanitizeVisibleText(visible);
      }

      visible += pendingText.slice(0, openIdx);
      pendingText = pendingText.slice(openIdx + THINK_OPEN.length);
      inThinkBlock = true;
    }

    return sanitizeVisibleText(visible);
  };

  while (!done) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const data = trimmed.slice("data:".length).trim();
      if (data === "[DONE]") {
        done = true;
        break;
      }

      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta;
        if (!delta) continue;

        if (delta.content) {
          assistantContent += delta.content;
          const streamSafeText = consumeSafeStreamText(delta.content);

          if (streamSafeText) {
            // Update the Database-ready string
            visibleContent += streamSafeText;

            // Send real-time token to client
            ws.send(
              JSON.stringify({
                type: "token",
                content: streamSafeText,
              }),
            );
          }
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const index: number = tc.index ?? 0;
            if (!toolCallBuffer[index]) {
              toolCallBuffer[index] = {
                id: tc.id || `tool_${index}`,
                name: tc.function?.name || "",
                arguments: tc.function?.arguments || "",
              };
            } else {
              if (tc.id) toolCallBuffer[index].id = tc.id;
              if (tc.function?.name) toolCallBuffer[index].name += tc.function.name;
              if (tc.function?.arguments) toolCallBuffer[index].arguments += tc.function.arguments;
            }
          }
        }
      } catch (parseErr) {
        console.warn(`⚠️ Could not parse chunk:`, (parseErr as Error).message);
      }
    }
  }

  // Handle any final text left in the buffer
  const trailingVisible = !inThinkBlock && pendingText ? sanitizeVisibleText(pendingText) : "";
  if (trailingVisible) {
    visibleContent += trailingVisible;
    ws.send(JSON.stringify({ type: "token", content: trailingVisible }));
  }

  const toolCalls = Object.values(toolCallBuffer);

  // Use visibleContent as the source for the final result
  const cleanedResponse = sanitizeAssistantContent(visibleContent).trim();

  if (toolCalls.length > 0) {
    console.log(`✅ Collected ${toolCalls.length} tool call(s)`);
  } else {
    console.log(`✅ streamModel done — visibleLength=${cleanedResponse.length}`);
  }

  return {
    toolCalls,
    assistantContent: cleanedResponse
  };
}