import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

export const setupWebSocket = (server: Server) => {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    console.log("Client connected");

    ws.on("message", async (message) => {
      try {
        // 1. Parse incoming message from React Native
        const parsed = JSON.parse(message.toString());
        const userPrompt = parsed.message;

        // 2. Call the LLM (Mistral/OpenAI)
        const lmResponse = await fetch(process.env.MODEL_URL || "", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "mistralai/ministral-3-8b-reasoning",
            stream: true,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        if (!lmResponse.body) throw new Error("LM Response has no body");

        // 3. Read the stream from LLM and forward to WebSocket
        const reader = lmResponse.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.replace("data: ", ""));
                const token = data.choices?.[0]?.delta?.content;
                
                // 4. Send ONLY the token text to the client
                if (token) {
                  ws.send(JSON.stringify({ type: "token", content: token }));
                }
              } catch (e) {
                // Ignore parsing errors for partial chunks
              }
            }
          }
        }

        // 5. Notify client stream is done
        ws.send(JSON.stringify({ type: "done" }));

      } catch (error) {
        console.error("Streaming error:", error);
        ws.send(JSON.stringify({ type: "error", message: "AI Error" }));
      }
    });

    ws.on("close", () => console.log("Client disconnected"));
  });
};