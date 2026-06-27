import { WebSocket } from "ws";
import type { ChatMessage } from "../../types/index.ts";
import { handleToolCall } from "../tools/handleToolCall.ts";
import { TOOL_NAMES } from "../tools/toolRegistry.ts";
import { streamModel } from "./streamModel.ts";

const VALID_TOOLS = new Set(TOOL_NAMES);
const MAX_TOOL_ITERATIONS = 20;

/** Categorizes errors and provides user-friendly messages */
function getUserFriendlyErrorMessage(error: unknown): string {
  const message = extractErrorMessage(error);
  const lower = message.toLowerCase();

  // Service capacity/availability
  if (
    lower.includes("busy") ||
    lower.includes("unavailable") ||
    lower.includes("high demand")
  ) {
    return "The assistant is busy right now. Please try again in a moment.";
  }

  // Rate limiting
  if (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("too many")
  ) {
    return "The assistant is temporarily handling too many requests. Please try again shortly.";
  }

  // Authentication/configuration
  if (
    lower.includes("api key") ||
    lower.includes("permission") ||
    lower.includes("auth")
  ) {
    return "The assistant could not be reached due to a configuration issue.";
  }

  // Network
  if (
    lower.includes("refused") ||
    lower.includes("fetch") ||
    lower.includes("network")
  ) {
    return "The assistant service is currently unavailable. Please try again in a moment.";
  }

  // Empty response
  if (lower.includes("empty") || lower.includes("no response")) {
    return "The assistant did not respond. Please try again.";
  }

  return "Something went wrong. Please try again.";
}

/** Extracts the actual error message from various error types */
function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;

  if (error instanceof Error) {
    const message = error.message?.trim() || "";
    if (!message) return "Unknown error";

    // Try to extract provider error details from JSON in message
    const jsonStart = message.indexOf("{");
    if (jsonStart > -1) {
      try {
        const json = JSON.parse(message.slice(jsonStart)) as {
          error?: { message?: string };
          message?: string;
        };
        return (
          json.error?.message || json.message || message.slice(0, jsonStart)
        );
      } catch {
        return message;
      }
    }

    return message;
  }

  return "Unknown error";
}

/** Converts tool names to user-friendly status messages */
function getToolStateName(
  toolName: string,
  type: "start" | "done",
  args?: Record<string, unknown>,
): string {
  const toolLabels: Record<string, { start: string; done: string }> = {
    create_session_exercise: {
      start: "Creating",
      done: "Done creating",
    },
    create_workout_session: {
      start: "Creating",
      done: "Done creating",
    },
    delete_workout_session: {
      start: "Removing",
      done: "Done removing",
    },
    get_session_by_date: {
      start: "Looking up",
      done: "Done looking up",
    },
    get_user_workout_sessions: {
      start: "Getting",
      done: "Done getting",
    },
    get_workout_logs: {
      start: "Getting",
      done: "Done getting",
    },
  };

  const label = toolLabels[toolName];
  if (!label) {
    // Generic fallback: "create_" → "Creating", "get_" → "Getting", etc.
    const action = toolName
      .replace(/^get_/, "Getting ")
      .replace(/^create_/, "Creating ")
      .replace(/^delete_/, "Removing ")
      .replace(/^add_/, "Updating ")
      .replace(/_/g, " ")
      .trim();

    return type === "done" ? `Done ${action.toLowerCase()}` : action;
  }

  // Try to extract descriptive info from args
  if (type === "start" && args) {
    if (toolName === "create_session_exercise" && args.exercise_name) {
      const name = String(args.exercise_name).trim();
      return name ? `Creating ${name}` : `${label.start} exercise`;
    }
    if (toolName === "create_workout_session" && args.title) {
      const title = String(args.title).trim();
      return title ? `Creating ${title} session` : `${label.start} session`;
    }
  }

  return type === "start" ? `${label.start}...` : `${label.done}`;
}

/** Safely parses tool call arguments JSON */
function parseToolArgs(json: string): Record<string, unknown> {
  try {
    return JSON.parse(json);
  } catch (err) {
    console.warn(`Failed to parse tool args: ${json}`);
    return {};
  }
}

/** Sends a message to the WebSocket if it's open */
function safeSend(ws: WebSocket, payload: unknown): void {
  try {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  } catch (err) {
    console.error("Failed to send WebSocket message:", err);
  }
}

/** Sends state update to client */
function sendState(ws: WebSocket, state: string): void {
  safeSend(ws, { type: "state", state });
}

/** Sends error message to client */
function sendError(ws: WebSocket, message: string): void {
  safeSend(ws, { type: "error", message });
}

/** Sends completion signal to client */
function sendDone(ws: WebSocket): void {
  safeSend(ws, { type: "done" });
}

export async function handleModelStreamWithTools(
  messages: ChatMessage[],
  userId: number,
  sessionId: number,
  ws: WebSocket,
): Promise<ChatMessage | undefined> {
  let toolCallCount = 0;
  let iteration = 0;

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      iteration++;

      // Get response from model
      sendState(
        ws,
        iteration === 1 ? "Understanding your request" : "Preparing response",
      );

      let { toolCalls, assistantContent } = await streamModel(messages, ws);

      // No tool calls = final response
      if (toolCalls.length === 0) {
        return handleFinalResponse(ws, messages, assistantContent, iteration);
      }

      // Separate valid from invalid tool calls
      const validCalls = toolCalls.filter((tc) => VALID_TOOLS.has(tc.name));
      const invalidCalls = toolCalls.filter((tc) => !VALID_TOOLS.has(tc.name));

      // Correct hallucinations and loop back
      if (invalidCalls.length > 0) {
        const invalidNames = invalidCalls.map((c) => `"${c.name}"`).join(", ");
        sendState(ws, "Correcting format");

        messages.push({
          role: "user",
          content: `You called invalid tools: ${invalidNames}. Valid tools: ${TOOL_NAMES.join(", ")}. Continue with valid tools.`,
        } as ChatMessage);

        continue;
      }

      // Execute valid tool calls
      toolCallCount += validCalls.length;

      if (toolCallCount > MAX_TOOL_ITERATIONS) {
        return handleMaxIterationsReached(ws, messages);
      }

      // Add assistant message to context
      messages.push({
        role: "assistant",
        content: assistantContent || "",
        tool_calls: validCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: tc.arguments },
        })),
      } as any);

      // Execute each tool call
      for (const toolCall of validCalls) {
        const toolArgs = parseToolArgs(toolCall.arguments);
        sendState(ws, getToolStateName(toolCall.name, "start", toolArgs));

        try {
          const result = await handleToolCall(ws, toolCall, userId);

          sendState(ws, getToolStateName(toolCall.name, "done"));

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.name,
            content: JSON.stringify(result),
          });
        } catch (err) {
          const toolError = err instanceof Error ? err.message : "Tool failed";

          sendState(
            ws,
            `Retrying after ${toolCall.name.replace(/_/g, " ")} error`,
          );

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.name,
            content: JSON.stringify({
              error: true,
              message: toolError,
            }),
          });
        }
      }
    }
  } catch (err) {
    console.error("Stream processing error:", err);
    sendError(ws, getUserFriendlyErrorMessage(err));
    return undefined;
  }
}

/** Handles the final response when no more tool calls are needed */
async function handleFinalResponse(
  ws: WebSocket,
  messages: ChatMessage[],
  assistantContent: string,
  iteration: number,
): Promise<ChatMessage | undefined> {
  // If no content but exercises were added, request a summary
  if (!assistantContent) {
    const exercisesAdded = messages.filter(
      (m) => m.role === "tool" && m.name === "create_session_exercise",
    ).length;

    if (exercisesAdded > 0 && iteration < MAX_TOOL_ITERATIONS) {
      messages.push({
        role: "user",
        content:
          "All exercises have been saved. Summarize the full workout with exercise names, sets, reps, and instructions. No more tool calls.",
      } as ChatMessage);

      const { assistantContent: summary } = await streamModel(messages, ws, {
        disableTools: true,
      });

      if (summary) {
        sendDone(ws);
        return { role: "assistant", content: summary };
      }
    }

    sendError(ws, "The assistant could not generate a response");
    return undefined;
  }

  sendDone(ws);
  return { role: "assistant", content: assistantContent };
}

/** Handles tool call limit being reached */
async function handleMaxIterationsReached(
  ws: WebSocket,
  messages: ChatMessage[],
): Promise<ChatMessage | undefined> {
  sendState(ws, "Finalizing...");

  messages.push({
    role: "user",
    content: "Summarize all exercises created. No more tool calls.",
  } as ChatMessage);

  try {
    const { assistantContent: summary } = await streamModel(messages, ws, {
      disableTools: true,
    });

    if (summary) {
      sendDone(ws);
      return { role: "assistant", content: summary };
    }

    // Fallback: summarize from tool results
    const toolResults = messages
      .filter((m) => m.role === "tool" && m.name === "create_session_exercise")
      .map((m) => {
        try {
          const parsed = JSON.parse(m.content as string);
          return parsed.message ?? parsed.exercise_name;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const fallback =
      toolResults.length > 0
        ? `Created exercises: ${toolResults.join(", ")}`
        : "Workout session created successfully.";

    sendDone(ws);
    return { role: "assistant", content: fallback };
  } catch (err) {
    sendError(ws, getUserFriendlyErrorMessage(err));
    return undefined;
  }
}
