import { authService } from "./authService";

let ws: WebSocket | null = null;

const BASE_URL = "192.168.1.150:6000";
const WS_URL = `ws://${BASE_URL}`;
const API_URL = `http://${BASE_URL}`;

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
            return await response.json();
        } catch (error) {
            console.error("createChat error:", error);
            throw error;
        }
    },

    sendMessage: (
        sessionId: number,
        text: string,
        onToken: (token: string) => void,
        onState: (state: string) => void,
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            const token = authService.getToken();
            if (!token) {
                reject(new Error("No auth token"));
                return;
            }

            const socketUrl = `${WS_URL}?token=${token}&session_id=${sessionId}`;

            if (
                ws &&
                (ws.readyState === WebSocket.OPEN ||
                    ws.readyState === WebSocket.CONNECTING)
            ) {
                ws.close();
            }

            ws = new WebSocket(socketUrl);

            ws.onopen = () => {
                ws?.send(
                    JSON.stringify({
                        message: text,
                    }),
                );
            };

            ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data as string);

                    // Mapping backend types to the internal handlers
                    if (data.type === "token") {
                        onToken(data.content);
                    }

                    if (data.type === "state") {
                        onState(data.state);
                    }

                    if (data.type === "done" || data.done) {
                        onState("Done");
                        resolve();
                        ws?.close();
                    }

                    if (data.type === "error") {
                        onState(`Error: ${data.content}`);
                        reject(new Error(data.content));
                        ws?.close();
                    }
                } catch (err) {
                    console.error("WS Parse error", err);
                }
            };

            ws.onerror = (e) => {
                console.error("WebSocket error:", e);
                onState(`Error connecting to AI service`);
                reject(new Error("WebSocket error"));
            };

            ws.onclose = () => {
                console.log("WS closed");
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
