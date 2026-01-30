const API_URL = "http://192.168.1.150:6000/api";

let ws: WebSocket | null = null;

export const chatService = {
    getHistory: async (userId: string) => {
        try {
            const response = await fetch(`${API_URL}/chats/${userId}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching history:", error);
            throw error;
        }
    },

    sendMessage: (
        text: string,
        userId: string,
        onToken: (token: string) => void,
    ): Promise<void> => {
        return new Promise((resolve, reject) => {
            // Replace with your local IP if testing on device (e.g., 192.168.1.5:3000)
            // Do not use 'localhost' if running on a physical phone
            const socketUrl = `ws://192.168.1.150:3000`;

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
        await fetch(`${API_URL}/chat/${messageId}`, { method: "DELETE" });
    },
};
