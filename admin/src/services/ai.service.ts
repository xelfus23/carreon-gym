import { API_URL } from "../constants";

type StateCallback = (state: string) => void;
type TokenCallback = (token: string) => void;
type ResponseStartCallback = () => void;

const getWsUrl = (sessionId: number) => {
  const wsBase = API_URL.replace(/^http/i, "ws").replace(/\/+$/, "");
  return `${wsBase}/ws/chat?session_id=${sessionId}`;
};

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
      const response = await fetch(`${API_URL}/api/chats/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to create chat");
      }

      const payload = await response.json();
      return payload?.data;
    } catch (error) {
      console.error("createChat error:", error);
      throw error;
    }
  },

  sendMessage: (
    sessionId: number,
    text: string,
    onToken: TokenCallback,
    onState: StateCallback,
    onResponseStart?: ResponseStartCallback,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(getWsUrl(sessionId));
      let isSettled = false;

      const finish = (handler: () => void) => {
        if (isSettled) return;
        isSettled = true;
        handler();
      };

      ws.onopen = () => {
        ws.send(JSON.stringify({ message: text }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string);

          if (data.type === "assistant_response_start") {
            onResponseStart?.();
            return;
          }

          if (data.type === "state" && data.state) {
            onState(data.state);
            return;
          }

          if (data.type === "token" && data.content) {
            onToken(data.content);
            return;
          }

          if (data.type === "error") {
            finish(() => reject(new Error(data.message || "AI stream failed")));
            ws.close();
            return;
          }

          if (data.type === "done") {
            finish(() => resolve());
            ws.close();
          }
        } catch (err) {
          finish(() => reject(new Error("Invalid stream payload")));
          ws.close();
        }
      };

      ws.onerror = () => {
        finish(() => reject(new Error("WebSocket connection failed")));
      };

      ws.onclose = () => {
        if (!isSettled) {
          finish(() => reject(new Error("Connection closed before completion")));
        }
      };
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
