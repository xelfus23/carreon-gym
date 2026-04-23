// let ws: WebSocket | null = null;

import { API_URL } from "../constants";

export const chatService = {
  getHistory: async () => {
    const response = await fetch(`${API_URL}/api/chats/sessions`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
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
          headers: { "Content-Type": "application/json" },
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
      // const response = await fetch(`${API_URL}/api/chats/sessions`, {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      // });

      // if (!response.ok) {
      //     throw new Error("Failed to create chat");
      // }

      // return await response.json();
      console.log("Chat sessions");

      return { id: 2 };
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
      console.log("Chat", sessionId, text, onToken, onState, resolve, reject);
    });
  },

  deleteMessage: async (messageId: string) => {
    try {
      await fetch(`${API_URL}/api/chats/messages/${messageId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Delete error", error);
    }
  },
};
