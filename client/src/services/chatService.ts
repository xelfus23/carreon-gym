import { authService } from "./authService";

let ws: WebSocket | null = null;

const WS_URL = process.env.EXPO_PUBLIC_WS_URL;
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const chatService = {
    getHistory: async () => {
        const response = await fetch(`${API_URL}/api/chats/sessions`, {
            method: "GET",
            headers: authService.getHeaders(),
        });

        if (!response.ok) throw new Error("Failed to fetch history");

        return await response.json();
    },

    getSessionMessages: async (sessionId: number) => {
        try {
            const response = await fetch(
                `${API_URL}/api/chats/sessions/${sessionId}/messages`,
                {
                    method: "GET",
                    headers: authService.getHeaders(),
                },
            );
            if (!response.ok) throw new Error("Failed to fetch messages");
            return await response.json();
        } catch (error) {
            console.error("getSessionMessages error:", error);
            return [];
        }
    },

    createChat: async () => {
        try {
            const response = await fetch(`${API_URL}/api/chats/sessions`, {
                method: "POST",
                headers: authService.getHeaders(),
            });

            if (!response.ok) throw new Error("Failed to create chat");
            return await response.json(); // Should return { id: 123 }
        } catch (error) {
            console.error("createChat error:", error);
            throw error;
        }
    },

    saveMessage: async (
        sessionId: number,
        role: "user" | "assistant",
        content: string,
    ) => {
        try {
            await fetch(`${API_URL}/api/chats/messages`, {
                method: "POST",
                headers: authService.getHeaders(),
                body: JSON.stringify({
                    session_id: sessionId,
                    role: role,
                    content: content,
                }),
            });
        } catch (error) {
            console.error("saveMessage error:", error);
        }
    },

    // src/services/chatService.ts
    sendMessage: (
        sessionId: number,
        text: string,
        onToken: (token: string, status: string | null) => void,
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            const token = authService.getToken();

            if (!token) {
                reject(new Error("No auth token"));
                return;
            }

            // ✅ sessionId is guaranteed to exist at this point
            const socketUrl = `ws://${WS_URL}/?token=${token}&session_id=${sessionId}`;

            if (ws) {
                ws.close();
            }

            ws = new WebSocket(socketUrl);

            ws.onopen = () => {
                ws?.send(
                    JSON.stringify({
                        message: text,
                        session_id: sessionId,
                    }),
                );
            };

            ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data as string);

                    if (data.type === "token") {
                        onToken(data.content, null);
                    } else if (data.type === "status") {
                        onToken("", data.state);
                    } else if (data.type === "tool_result") {
                        console.log("✅ Tool used:", data.toolName);
                    } else if (data.type === "done") {
                        ws?.close();
                        ws = null;
                        resolve();
                    } else if (data.type === "error") {
                        ws?.close();
                        reject(new Error(data.message));
                    }
                } catch (err) {
                    console.error("WS Parse error", err);
                }
            };

            ws.onerror = (e) => {
                const errorMessage =
                    (e as any).message || "WebSocket error occurred";
                console.error("WebSocket error:", e);
                reject(new Error(errorMessage));
            };

            ws.onclose = () => {
                console.log("Connection closed");
            };
        });
    },

    deleteMessage: async (messageId: string) => {
        try {
            await fetch(`${API_URL}/api/chats/messages/${messageId}`, {
                method: "DELETE",
                headers: authService.getHeaders(),
            });
        } catch (error) {
            console.error("Delete error", error);
        }
    },
};
