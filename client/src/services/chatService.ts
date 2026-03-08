// chatService.ts
import { request } from "../utils/request";
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

    /** --------------------
     * WebSocket — token sent in first payload, not URL
     * -------------------- */
    sendMessage: (
        sessionId: number,
        text: string,
        onToken: (token: string) => void,
        onState: (state: string) => void,
        signal?: AbortSignal,
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            const token = tokenManager.getAccessToken();

            if (!token) {
                reject(new Error("No auth token available"));
                return;
            }

            if (activeSocket && activeSocket.readyState === WebSocket.OPEN) {
                activeSocket.close(1000, "New message sent");
            }

            const baseUrl = WS_URL?.startsWith("ws")
                ? WS_URL
                : `ws://${WS_URL}`;

            // Token in URL — backend authenticates on handshake
            activeSocket = new WebSocket(
                `${baseUrl}?token=${token}&session_id=${sessionId}`,
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

                    if (data.type === "token") {
                        onToken(data.content);
                    } else if (data.type === "state") {
                        onState(data.state);
                    } else if (data.type === "error") {
                        cleanup();
                        settle(() =>
                            reject(new Error(data.message ?? "Server error")),
                        );
                        socket.close();
                    } else if (data.type === "done") {
                        onState("Done");
                        cleanup();
                        settle(() => resolve());
                        socket.close(1000, "Done");
                    }
                } catch {
                    // Non-JSON frame — ignore
                }
            };

            socket.onerror = () => {
                cleanup();
                settle(() => reject(new Error("WebSocket connection failed")));
            };

            socket.onclose = (e) => {
                cleanup();
                if (!e.wasClean && e.code !== 1000) {
                    settle(() => reject(new Error(`${errorMsg[e.reason]}`)));
                }
            };
        });
    },

    /** Close active socket — call on logout or screen unmount */
    disconnect: () => {
        if (activeSocket) {
            activeSocket.close(1000, "Disconnected");
            activeSocket = null;
        }
    },
};
