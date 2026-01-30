import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

export const setupWebSocket = (server: Server) => {
    const wss = new WebSocketServer({ server });

    wss.on("connection", (ws: WebSocket) => {
        console.log("Client connected");

        ws.on("message", async (message) => {
            try {
                const parsed = JSON.parse(message.toString());
                const userPrompt = parsed.message;

                const lmResponse = await fetch(process.env.MODEL_URL || "", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: "mistralai/ministral-3-8b-reasoning",
                        stream: true,
                        messages: [{ role: "user", content: userPrompt }],
                    }),
                });

                if (!lmResponse.body)
                    throw new Error("LM Response has no body");

                const reader = lmResponse.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split("\n");

                    for (const line of lines) {
                        if (
                            line.startsWith("data: ") &&
                            line !== "data: [DONE]"
                        ) {
                            try {
                                const data = JSON.parse(
                                    line.replace("data: ", ""),
                                );
                                const token = data.choices?.[0]?.delta?.content;

                                if (token) {
                                    ws.send(
                                        JSON.stringify({
                                            type: "token",
                                            content: token,
                                        }),
                                    );
                                }
                            } catch (e) {
                                if (e instanceof Error) {
                                    console.error(e.message);
                                }
                            }
                        }
                    }
                }

                ws.send(JSON.stringify({ type: "done" }));
            } catch (error) {
                console.error("Streaming error:", error);
                ws.send(JSON.stringify({ type: "error", message: "AI Error" }));
            }
        });

        ws.on("close", () => console.log("Client disconnected"));
    });
};
