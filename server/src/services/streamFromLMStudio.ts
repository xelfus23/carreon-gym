async function streamFromLMStudio(prompt: string, socket: WebSocket) {
    const response = await fetch(process.env.MODEL_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "mistralai/ministral-3-8b-reasoning",
            stream: true,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!response.body) {
        socket.send(JSON.stringify({ type: "error", error: "No stream" }));
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            const data = line.replace("data: ", "").trim();
            if (data === "[DONE]") {
                socket.send(JSON.stringify({ type: "done" }));
                return;
            }

            try {
                const json = JSON.parse(data);
                const token = json.choices?.[0]?.delta?.content;

                if (token) {
                    socket.send(
                        JSON.stringify({
                            type: "token",
                            value: token,
                        }),
                    );
                }
            } catch {
                // ignore malformed chunk
            }
        }
    }
}

export default streamFromLMStudio;
