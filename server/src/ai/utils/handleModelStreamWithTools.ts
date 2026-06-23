import { WebSocket } from "ws";
import type { ChatMessage } from "../../types/index.ts";
import { handleToolCall } from "../tools/handleToolCall.ts";
import { TOOL_NAMES } from "../tools/toolRegistry.ts";
import { streamModel } from "./streamModel.ts";

const VALID_TOOLS = new Set(TOOL_NAMES);

function mapProviderErrorMessage(message: string): string {
  const normalized = message.trim().toLowerCase();

  if (
    normalized.includes("currently experiencing high demand") ||
    normalized.includes("status: unavailable") ||
    normalized.includes('"status":"unavailable"')
  ) {
    return "The assistant is busy right now. Please try again in a moment.";
  }

  if (
    normalized.includes("quota") ||
    normalized.includes("rate limit") ||
    normalized.includes("too many requests")
  ) {
    return "The assistant is temporarily handling too many requests. Please try again shortly.";
  }

  if (
    normalized.includes("api key") ||
    normalized.includes("permission denied") ||
    normalized.includes("permission_denied") ||
    normalized.includes("authentication")
  ) {
    return "The assistant could not be reached right now because of a configuration issue.";
  }

  if (
    normalized.includes("econnrefused") ||
    normalized.includes("fetch failed") ||
    normalized.includes("network error") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("lm studio request failed")
  ) {
    return "The assistant service is currently unavailable. Please try again in a moment.";
  }

  if (normalized.includes("no response from model")) {
    return "The assistant did not return a response. Please try again.";
  }

  if (normalized.includes("empty assistant response")) {
    return "The assistant returned an empty response. Please try again.";
  }

  return message.trim();
}

function extractProviderErrorMessage(error: unknown): string {
  if (!error) return "Something went wrong while generating a response.";

  if (typeof error === "string") {
    return mapProviderErrorMessage(error);
  }

  if (!(error instanceof Error)) {
    return "Something went wrong while generating a response.";
  }

  const rawMessage = error.message?.trim();
  if (!rawMessage) return "Something went wrong while generating a response.";

  const jsonStart = rawMessage.indexOf("{");
  if (jsonStart !== -1) {
    const jsonSlice = rawMessage.slice(jsonStart);
    try {
      const parsed = JSON.parse(jsonSlice) as {
        error?: { message?: string; status?: string; code?: number };
        message?: string;
      };

      const providerMessage =
        parsed.error?.message ?? parsed.message ?? rawMessage.slice(0, jsonStart).trim();

      if (providerMessage) {
        return mapProviderErrorMessage(providerMessage);
      }
    } catch {
      // Fall through to the raw error message when the suffix is not valid JSON.
    }
  }

  return mapProviderErrorMessage(rawMessage);
}

export async function handleModelStreamWithTools(
  messages: ChatMessage[],
  userId: number,
  sessionId: number,
  ws: WebSocket,
): Promise<ChatMessage | undefined> {
  const MAX_TOOL_ITERATIONS = 20;
  let toolCallCount = 0;
  let iteration = 0;

  const log = (msg: string, data?: unknown) => {
    const prefix = `[Stream][session=${sessionId}][user=${userId}][iter=${iteration}]`;
    data !== undefined
      ? console.log(`${prefix} ${msg}`, data)
      : console.log(`${prefix} ${msg}`);
  };

  const safeSend = (payload: object) => {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    } catch (err) {
      console.error(`[Stream][session=${sessionId}] ❌ ws.send() threw:`, err);
    }
  };

  const parseToolArgs = (argumentsJson: string): Record<string, unknown> => {
    try {
      return JSON.parse(argumentsJson) as Record<string, unknown>;
    } catch {
      return {};
    }
  };

  const toReadableToolState = (toolName: string) =>
    toolName
      .replace(/^get_/, "Getting ")
      .replace(/^create_/, "Creating ")
      .replace(/^add_/, "Updating ")
      .replace(/^delete_/, "Updating ")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const getToolStartState = (toolName: string, args: Record<string, unknown>) => {
    switch (toolName) {
      case "create_session_exercise": {
        const exerciseName =
          typeof args.exercise_name === "string" ? args.exercise_name.trim() : "";
        return exerciseName ? `Creating ${exerciseName}` : "Creating exercise";
      }
      case "create_workout_session": {
        const title = typeof args.title === "string" ? args.title.trim() : "";
        return title ? `Creating ${title} session` : "Creating workout session";
      }
      case "delete_workout_session":
        return "Removing workout session";
      case "get_session_by_date":
        return "Looking up your session";
      case "get_user_workout_sessions":
        return "Getting your workout sessions";
      case "get_workout_logs":
        return "Getting your workout logs";
      default:
        return toReadableToolState(toolName);
    }
  };

  const getToolDoneState = (
    toolName: string,
    args: Record<string, unknown>,
    result: unknown,
  ) => {
    const parsedResult =
      result && typeof result === "object"
        ? (result as Record<string, unknown>)
        : {};

    switch (toolName) {
      case "create_session_exercise": {
        const exerciseName =
          (typeof args.exercise_name === "string" && args.exercise_name.trim()) ||
          (typeof parsedResult.message === "string"
            ? parsedResult.message.replace(/^Added\s+/i, "").trim()
            : "");
        return exerciseName
          ? `Done creating ${exerciseName}`
          : "Done creating exercise";
      }
      case "create_workout_session": {
        const title =
          (typeof args.title === "string" && args.title.trim()) ||
          (typeof parsedResult.title === "string" ? parsedResult.title.trim() : "");
        return title
          ? `Done creating ${title} session`
          : "Done creating workout session";
      }
      case "delete_workout_session":
        return "Done removing workout session";
      case "get_session_by_date":
        return "Done looking up your session";
      case "get_user_workout_sessions":
        return "Done getting your workout sessions";
      case "get_workout_logs":
        return "Done getting your workout logs";
      default: {
        const label = toReadableToolState(toolName);
        return `Done ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
      }
    }
  };

  log("▶️ Starting stream loop");

  try {
    while (true) {
      iteration++;
      log(`🔄 Loop iteration start`);
      safeSend({
        type: "state",
        state:
          iteration === 1
            ? "Understanding your request"
            : "Preparing response from latest updates",
      });

      let toolCalls: Awaited<ReturnType<typeof streamModel>>["toolCalls"];
      let assistantContent: Awaited<ReturnType<typeof streamModel>>["assistantContent"];

      try {
        const result = await streamModel(messages, ws);
        toolCalls = result.toolCalls;
        assistantContent = result.assistantContent;
        log(
          `✅ streamModel complete — toolCalls=${toolCalls.length}, contentLength=${assistantContent?.length ?? 0}`,
        );
      } catch (err) {
        console.error(
          `[Stream][session=${sessionId}][iter=${iteration}] ❌ streamModel threw:`,
          err,
        );
        safeSend({ type: "error", message: extractProviderErrorMessage(err) });
        return undefined;
      }

      // ── Final response (no tool calls) ──────────────────────────
      if (toolCalls.length === 0) {
        log("🏁 No tool calls — final response");
        safeSend({ type: "state", state: "Finalizing response" });

        if (!assistantContent) {
          const exercisesAdded = messages.filter(
            (m) => m.role === "tool" && m.name === "create_session_exercise",
          ).length;

          if (exercisesAdded > 0 && iteration < MAX_TOOL_ITERATIONS) {
            log(
              `⚠️ Empty response after ${exercisesAdded} exercise(s) — requesting summary`,
            );
            messages.push({
              role: "user",
              content:
                "All exercises have been saved. Provide a clean summary for the user with exercise names, sets, reps, and instructions. Do not call any more tools.",
            } as ChatMessage);
            continue;
          }

          log("⚠️ No assistant content and no tool calls — empty response");
          safeSend({ type: "error", message: "Empty assistant response" });
          return undefined;
        }

        safeSend({ type: "done" });
        return { role: "assistant", content: assistantContent } as ChatMessage;
      }

      const invalidCalls = toolCalls.filter((tc) => !VALID_TOOLS.has(tc.name));
      const validCalls = toolCalls.filter((tc) => VALID_TOOLS.has(tc.name));

      if (invalidCalls.length > 0) {
        log(
          `⚠️ Hallucinated tool name(s): ${invalidCalls.map((c) => `"${c.name}"`).join(", ")} — injecting correction`,
        );
        safeSend({ type: "state", state: "Correcting exercise format" });
        messages.push({
          role: "user",
          content:
            `You called tool(s) named ${invalidCalls.map((c) => `"${c.name}"`).join(", ")} which do not exist. ` +
            `Valid tools are: ${TOOL_NAMES.join(", ")}. ` +
            `Do not use exercise names or equipment names as tool names. ` +
            `To add those exercises, call create_session_exercise with the name in the exercise_name parameter. ` +
            `Continue the workout using the session_id from earlier tool results.`,
        } as ChatMessage);
        log("➡️ Looping back after hallucination correction");
        continue;
      }

      // ── Tool call cap check ──────────────────────────────────────
      toolCallCount += validCalls.length;
      log(`🔧 Tool calls this round: ${validCalls.length} (total so far: ${toolCallCount})`);

      if (toolCallCount > MAX_TOOL_ITERATIONS) {
        log(`⚠️ Tool call limit hit — forcing final response`);

        // Inject as user turn — more reliable than mid-conversation system message
        messages.push({
          role: "user",
          content:
            "All exercises have been added. Please summarize the full workout session you just created for me.",
        } as ChatMessage);

        try {
          const { assistantContent: summary } = await streamModel(messages, ws, {
            disableTools: true,
          });

          if (summary) {
            safeSend({ type: "done" });
            return { role: "assistant", content: summary } as ChatMessage;
          }

          log("⚠️ streamModel returned empty summary — using fallback");
          const toolNames = messages
            .filter((m) => m.role === "tool")
            .map((m) => {
              try {
                const parsed = JSON.parse(m.content as string);
                return parsed.message ?? parsed.exercise_name ?? null;
              } catch {
                return null;
              }
            })
            .filter(Boolean);

          const fallbackSummary =
            toolNames.length > 0
              ? `Your workout session has been created with the following exercises:\n${toolNames.map((n, i) => `${i + 1}. ${n}`).join("\n")}`
              : "Your workout session has been created successfully.";

          safeSend({ type: "done" });
          return { role: "assistant", content: fallbackSummary } as ChatMessage;

        } catch (err) {
          console.error(
            `[Stream][session=${sessionId}] ❌ streamModel (disableTools) threw:`,
            err,
          );
          safeSend({ type: "error", message: extractProviderErrorMessage(err) });
          return undefined;
        }
      }

      // ── Push assistant message with tool calls into context ──────
      const assistantMessageWithTools: ChatMessage = {
        role: "assistant",
        content: assistantContent || "",
        tool_calls: validCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: tc.arguments },
        })),
      } as any;

      messages.push(assistantMessageWithTools);

      for (const toolCall of validCalls) {
        const toolArgs = parseToolArgs(toolCall.arguments);

        safeSend({
          type: "state",
          state: getToolStartState(toolCall.name, toolArgs),
        });

        let toolContent: string;

        try {
          const result = await handleToolCall(ws, toolCall, userId);
          log(`✅ Tool "${toolCall.name}" succeeded`, result);
          safeSend({
            type: "state",
            state: getToolDoneState(toolCall.name, toolArgs, result),
          });
          toolContent = JSON.stringify(result);
        } catch (err) {
          console.error(
            `[Stream][session=${sessionId}] ❌ Tool "${toolCall.name}" failed:`,
            err,
          );
          safeSend({
            type: "state",
            state: `Retrying after ${toolCall.name.replace(/_/g, " ")} issue`,
          });
          toolContent = JSON.stringify({
            error: true,
            message: err instanceof Error ? err.message : "Tool execution failed",
          });
        }

        const toolMessage: ChatMessage = {
          role: "tool",
          tool_call_id: toolCall.id,
          name: toolCall.name,
          content: toolContent,
        };

        messages.push(toolMessage);
        log(`💬 Tool result pushed for "${toolCall.name}"`);
      }

      log("➡️ Looping back with updated messages");
    }
  } catch (error) {
    console.error(
      `[Stream][session=${sessionId}] ❌ Unhandled error in stream loop:`,
      error,
    );
    safeSend({ type: "error", message: "Internal server error" });
    return undefined;
  }
}