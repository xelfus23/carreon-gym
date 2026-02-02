import type { Request, Response } from "express";
import { Instructions } from "../../utils/getInstructions.ts";

const sendMessage = async (req: Request, res: Response) => {
    const { message } = req.body;

    console.log(req.body)

    console.log(message)

    if (!req.user) {
        return res
            .status(401)
            .json({ success: false, message: "Unauthorized" });
    }

    const userId = req.user.id;

    if (!message) {
        return res.status(400).json({ error: "Message is Empty!" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

    try {
        const lmResponse = await fetch(process.env.MODEL_URL || "", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "mistralai/ministral-3-8b-reasoning",
                stream: true,
                messages: [
                    {
                        role: "system",
                        content: await Instructions(userId),
                    },
                    {
                        role: "user",
                        content: message,
                    },
                ],
            }),
        });

        if (!lmResponse.body) {
            throw new Error("No response body from LM Studio");
        }

        reader = lmResponse.body.getReader();
        const decoder = new TextDecoder();

        req.on("close", () => {
            reader?.cancel();
        });

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            res.write(chunk);
        }

        res.write("data: [DONE]\n\n");
        res.end();
    } catch (err) {
        console.error(err);

        res.write(
            `data: ${JSON.stringify({
                error: err instanceof Error ? err.message : "Streaming failed",
            })}\n\n`,
        );
        res.write("data: [DONE]\n\n");
        res.end();
    }
};

export default sendMessage;
