import { WebSocket } from "ws";
import type { ChatMessage } from "../../types/index.ts";
import { handleToolCall } from "../tools/handleToolCall.ts";
import { streamModel } from "./streamModel.ts";

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

  const toReadableToolState = (toolName: string) =>
    toolName
      .replace(/^get_/, "getting ")
      .replace(/^create_/, "creating ")
      .replace(/^add_/, "updating ")
      .replace(/^delete_/, "updating ")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^./, (c) => c.toUpperCase());

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
        safeSend({ type: "error", message: "Model stream failed" });
        return undefined;
      }

      // ── Final response (no tool calls) ──────────────────────────
      if (toolCalls.length === 0) {
        log("🏁 No tool calls — final response");
        safeSend({ type: "state", state: "Finalizing response" });

        if (!assistantContent) {
          log("⚠️ No assistant content and no tool calls — empty response");
          safeSend({ type: "error", message: "Empty assistant response" });
          return undefined;
        }

        safeSend({ type: "done" });
        return { role: "assistant", content: assistantContent } as ChatMessage;
      }

      // ── Tool call cap check ──────────────────────────────────────
      toolCallCount += toolCalls.length;
      log(`🔧 Tool calls this round: ${toolCalls.length} (total so far: ${toolCallCount})`);

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
          safeSend({ type: "error", message: "Unable to produce final response after tools" });
          return undefined;
        }
      }

      // ── Push assistant message with tool calls into context ──────
      const assistantMessageWithTools: ChatMessage = {
        role: "assistant",
        content: assistantContent || "",
        tool_calls: toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: tc.arguments },
        })),
      } as any;

      messages.push(assistantMessageWithTools);

      for (const toolCall of toolCalls) {
        safeSend({
          type: "state",
          state: toReadableToolState(toolCall.name),
        });

        let toolContent: string;

        try {
          const result = await handleToolCall(ws, toolCall, userId);
          log(`✅ Tool "${toolCall.name}" succeeded`, result);
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