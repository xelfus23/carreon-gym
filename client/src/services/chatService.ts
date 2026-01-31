let ws: WebSocket | null = null;

const WS_URL = process.env.EXPO_PUBLIC_WS_URL;
const API_URL = process.env.EXPO_PUBLIC_API_URL;

console.log(WS_URL, API_URL);

export const chatService = {
    getHistory: async (userId: string) => {
        const response = await fetch(`${API_URL}/api/chats/${userId}`);
        return await response.json();
    },

    sendMessage: (
        text: string,
        userId: string,
        onToken: (token: string) => void,
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            // Replace with your local IP if testing on device (e.g., 192.168.1.5:3000)
            // Do not use 'localhost' if running on a physical phone
            const socketUrl = `ws://${WS_URL}`;

            ws = new WebSocket(socketUrl);

            ws.onopen = () => {
                // Send the prompt once connection is open
                ws?.send(JSON.stringify({ message: text, userId }));
            };

            ws.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data as string);

                    if (data.type === "token") {
                        onToken(data.content);
                    } else if (data.type === "done") {
                        ws?.close();
                        resolve();
                    } else if (data.type === "error") {
                        reject(new Error(data.message));
                    }
                } catch (err) {
                    console.error("WS Parse error", err);
                }
            };

            ws.onerror = (e) => {
                if (e instanceof Error) {
                    console.error("WebSocket error:", e.message);
                    reject(new Error(e.message));
                }
            };

            ws.onclose = () => {
                console.log("Connection closed");
            };
        });
    },

    deleteMessage: async (messageId: string) => {
        await fetch(`${API_URL}/chat/${messageId}`, {
            method: "DELETE",
        });
    },
};
