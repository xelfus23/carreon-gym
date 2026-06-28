import { AiPreferences } from "../types/aiPreferences";
import { forceRefreshToken, request } from "../utils/request";
import { tokenManager } from "../utils/tokenManager";
import {
  startStreaming,
  onToken,
  onState,
  onDone,
} from "./streaming.controller";

const WS_URL = process.env.EXPO_PUBLIC_WS_URL;

if (!WS_URL) {
  console.error(
    "Missing EXPO_PUBLIC_WS_URL environment variable for chat websocket",
  );
}

// Single shared socket — one connection at a time
let activeSocket: WebSocket | null = null;

const errorMsg: Record<string, string> = {
  SUBSCRIPTION_REQUIRED: "You don't have active subscriptions.",
  SUBSCRIPTION_EXPIRED: "Your subscription has expired.",
  AUTHENTICATION_FAILED: "You're unauthorized to use chats.",
  SESSION_MISSING: "Chat session does not exist.",
};

const mapClientErrorMessage = (message?: string) => {
  const normalized = message?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return "Something went wrong while contacting the assistant.";
  }

  if (normalized === "authentication_failed") {
    return "AUTHENTICATION_FAILED";
  }

  if (normalized.includes("connection closed before completion")) {
    return "The assistant connection ended early. Please try again.";
  }

  if (normalized.includes("unknown connection error")) {
    return "The assistant connection failed. Please try again.";
  }

  if (
    normalized.includes("error please try again later") ||
    normalized.includes("server error")
  ) {
    return "The assistant is unavailable right now. Please try again in a moment.";
  }

  return message!.trim();
};

export const chatService = {
  getHistory: async () => {
    return (await request(`/chats/sessions`)).data;
  },

  getSessionMessages: async (
    sessionId: number,
    options?: { limit?: number; beforeId?: number },
  ) => {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.beforeId) params.set("beforeId", String(options.beforeId));
    const query = params.toString();
    const path = `/chats/sessions/${sessionId}/messages${query ? `?${query}` : ""}`;
    return (await request(path)).data;
  },

  getGenerationStatus: async (sessionId: number) => {
    return (await request(`/chats/sessions/${sessionId}/generation-status`))
      .data as {
      isGenerating: boolean;
      lastMessageRole: string | null;
      lastMessageId: number | null;
      awaitingAssistant: boolean;
    };
  },

  createChat: async () => {
    return (
      await request(`/chats/sessions`, {
        method: "POST",
      })
    ).data;
  },

  deleteMessage: async (messageId: string) => {
    return (
      await request(`/chats/messages/${messageId}`, {
        method: "DELETE",
      })
    ).data;
  },

  sendMessage: async (
    sessionId: number,
    text: string,
    messageId: string,
    signal?: AbortSignal,
    isRetry = false,
    preferences?: AiPreferences,
  ): Promise<void> => {
    // Define the core logic as a helper to allow for easy retries
    const connectAndSend = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        const token = tokenManager.getAccessToken();

        if (!token) {
          reject(new Error("No auth token available"));
          return;
        }

        if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
          activeSocket.close(1000, "New message sent");
        }

        if (!WS_URL) {
          reject(new Error("Chat websocket URL not configured"));
          return;
        }

        activeSocket = new WebSocket(
          `${WS_URL}/ws/chat?token=${token}&session_id=${sessionId}`,
        );

        const socket = activeSocket;
        let settled = false;
        let receivedDone = false;
        let receivedError = false;
        let connectTimeout: ReturnType<typeof setTimeout> | null = null;
        let receivedAnyServerMessage = false;

        const parseSocketData = async (rawData: unknown) => {
          if (typeof rawData === "string") {
            return JSON.parse(rawData);
          }

          if (rawData instanceof ArrayBuffer) {
            return JSON.parse(new TextDecoder().decode(rawData));
          }

          if (typeof Blob !== "undefined" && rawData instanceof Blob) {
            const text = await rawData.text();
            return JSON.parse(text);
          }

          return JSON.parse(String(rawData));
        };

        const settle = (fn: () => void) => {
          if (!settled) {
            settled = true;
            fn();
          }
        };

        const handleAbort = () => {
          if (
            socket.readyState === WebSocket.OPEN ||
            socket.readyState === WebSocket.CONNECTING
          ) {
            socket.close(1000, "Aborted");
          }
          settle(() => reject(new Error("Aborted")));
        };
        signal?.addEventListener("abort", handleAbort);

        const cleanup = () => {
          signal?.removeEventListener("abort", handleAbort);
          if (connectTimeout) {
            clearTimeout(connectTimeout);
          }
        };

        connectTimeout = setTimeout(() => {
          if (!settled) {
            if (socket.readyState === WebSocket.CONNECTING) {
              socket.close(1000, "Connection timeout");
            }
            settle(() => reject(new Error("WebSocket connection timed out")));
          }
        }, 10000);

        socket.onopen = () => {
          if (connectTimeout) {
            clearTimeout(connectTimeout);
            connectTimeout = null;
          }
          // Initialize streaming state in controller with the message ID
          startStreaming(sessionId, messageId);

          onState("Connecting to assistant");
          socket.send(
            JSON.stringify({
              message: text,
              preferences: preferences ?? undefined,
            }),
          );
        };

        socket.onmessage = async (e) => {
          try {
            const data = await parseSocketData((e as MessageEvent).data);
            receivedAnyServerMessage = true;

            if (data.type === "assistant_response_start") {
              // This event indicates tool execution completed and response streaming begins
              // No action needed here - state updates handle status display
            } else if (data.type === "token") {
              onToken(data.content);
            } else if (data.type === "state") {
              onState(data.state);
            } else if (data.type === "error") {
              receivedError = true;
              cleanup();
              onDone();

              if (data.message === "AUTHENTICATION_FAILED") {
                settle(() => reject(new Error("AUTHENTICATION_FAILED")));
              } else {
                settle(() =>
                  reject(new Error(mapClientErrorMessage(data.message))),
                );
              }
              socket.close();
            } else if (data.type === "done") {
              receivedDone = true;
              onState("Complete");
              cleanup();
              onDone();
              settle(() => resolve());
              socket.close(1000, "Done");
            }
          } catch (error) {
            console.error("WebSocket parse error:", error);
          }
        };

        socket.onerror = (event) => {
          receivedError = true;
          cleanup();
          const errorReason = (event as Event & { message?: string }).message;
          settle(() =>
            reject(
              new Error(
                mapClientErrorMessage(
                  errorReason ?? "Error please try again later.",
                ),
              ),
            ),
          );
        };

        socket.onclose = (e) => {
          console.warn("Chat WebSocket closed:", {
            code: e.code,
            reason: e.reason,
            wasClean: e.wasClean,
            receivedDone,
            receivedError,
            settled,
            receivedAnyServerMessage,
          });

          cleanup();
          if (receivedDone || settled) return;

          if (!e.wasClean && e.code !== 1000) {
            const reason =
              e.reason === "AUTHENTICATION_FAILED"
                ? "AUTHENTICATION_FAILED"
                : errorMsg[e.reason];
            settle(() =>
              reject(
                new Error(
                  mapClientErrorMessage(reason || "Unknown Connection Error"),
                ),
              ),
            );
          } else if (!receivedError) {
            const message = receivedAnyServerMessage
              ? "Connection closed before completion."
              : "No response received from the assistant.";
            settle(() => reject(new Error(mapClientErrorMessage(message))));
          }
        };
      });
    };

    try {
      return await connectAndSend();
    } catch (error: any) {
      // Handle Auth Failure and Retry
      if (error.message === "AUTHENTICATION_FAILED" && !isRetry) {
        console.log("Chat auth failed, attempting token refresh...");
        try {
          await forceRefreshToken();
          // Recursive call with isRetry = true
          return await chatService.sendMessage(
            sessionId,
            text,
            messageId,
            signal,
            true,
            preferences,
          );
        } catch (refreshError) {
          console.error(refreshError);
          throw new Error("Session expired. Please log in again.");
        }
      }
      throw error;
    }
  },

  /** Close active socket — call on logout or screen unmount */
  disconnect: () => {
    if (activeSocket) {
      activeSocket.close(1000, "Disconnected");
      activeSocket = null;
    }
  },
};
