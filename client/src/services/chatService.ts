const API_URL = "http://192.168.1.150:6000/api";

export const chatService = {
    getHistory: async (userId: string) => {
        try {
            const response = await fetch(`${API_URL}/chat/${userId}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching history:", error);
            throw error;
        }
    },

    sendMessage: async (text: string, userId: string) => {
        try {
            const response = await fetch(`${API_URL}/ai/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: text, userId }),
            });

            const data = await response.json()

            console.log(data)

            return data;
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    },

    deleteMessage: async (messageId: string) => {
        await fetch(`${API_URL}/chat/${messageId}`, { method: "DELETE" });
    },
};
