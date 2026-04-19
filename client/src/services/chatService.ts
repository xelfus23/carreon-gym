// chatService.ts
import { forceRefreshToken, request } from "../utils/request";
import { tokenManager } from "../utils/tokenManager";

const WS_URL = process.env.EXPO_PUBLIC_WS_URL;

// Single shared socket — one connection at a time
let activeSocket: WebSocket | null = null;

const errorMsg: Record<string, string> = {
    SUBSCRIPTION_REQUIRED: "You don't have active subscriptions.",
    SUBSCRIPTION_EXPIRED: "Your subscription has expired.",
    AUTHENTICATION_FAILED: "You're unauthorized to use chats.",
};

export const chatService = {
    getHistory: async () => {
        return (await request(`/chats/sessions`)).data;
    },

    getSessionMessages: async (sessionId: number) => {
        return (await request(`/chats/sessions/${sessionId}/messages`)).data;
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
        onToken: (token: string) => void,
        onState: (state: string) => void,
        signal?: AbortSignal,
        isRetry = false, // Add a retry flag to prevent infinite loops
    ): Promise<void> => {
        // Define the core logic as a helper to allow for easy retries
        const connectAndSend = (): Promise<void> => {
            return new Promise((resolve, reject) => {
                const token = tokenManager.getAccessToken();

                if (!token) {
                    reject(new Error("No auth token available"));
                    return;
                }

                if (
                    activeSocket &&
                    activeSocket.readyState === WebSocket.OPEN
                ) {
                    activeSocket.close(1000, "New message sent");
                }

                activeSocket = new WebSocket(
                    `${WS_URL}?token=${token}&session_id=${sessionId}`,
                );

                const socket = activeSocket;
                let settled = false;

                const settle = (fn: () => void) => {
                    if (!settled) {
                        settled = true;
                        fn();
                    }
                };

                const handleAbort = () => {
                    socket.close(1000, "Aborted");
                    settle(() => reject(new Error("Aborted")));
                };
                signal?.addEventListener("abort", handleAbort);

                const cleanup = () => {
                    signal?.removeEventListener("abort", handleAbort);
                };

                socket.onopen = () => {
                    socket.send(JSON.stringify({ message: text }));
                };

                socket.onmessage = (e) => {
                    try {
                        const data = JSON.parse(e.data as string);
                        if (data.type === "token") onToken(data.content);
                        else if (data.type === "state") onState(data.state);
                        else if (data.type === "error") {
                            cleanup();
                            // Check for Auth error in JSON message
                            if (data.message === "AUTHENTICATION_FAILED") {
                                settle(() =>
                                    reject(new Error("AUTHENTICATION_FAILED")),
                                );
                            } else {
                                settle(() =>
                                    reject(
                                        new Error(
                                            data.message ?? "Server error",
                                        ),
                                    ),
                                );
                            }
                            socket.close();
                        } else if (data.type === "done") {
                            onState("Done");
                            cleanup();
                            settle(() => resolve());
                            socket.close(1000, "Done");
                        }
                    } catch {
                        /* ignore */
                    }
                };

                socket.onerror = () => {
                    cleanup();
                    settle(() =>
                        reject(new Error("WebSocket connection failed")),
                    );
                };

                socket.onclose = (e) => {
                    cleanup();
                    if (!e.wasClean && e.code !== 1000) {
                        // Check for Auth error in Close Reason
                        const reason =
                            e.reason === "AUTHENTICATION_FAILED"
                                ? "AUTHENTICATION_FAILED"
                                : errorMsg[e.reason];
                        settle(() =>
                            reject(
                                new Error(reason || "Unknown Connection Error"),
                            ),
                        );
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
                        onToken,
                        onState,
                        signal,
                        true,
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
