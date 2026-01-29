import type { Request, Response } from "express";

const sendMessage = async (req: Request, res: Response) => {
    const { message, userId } = req.body;

    if (!message) {
        console.error("Message is empty!");
        return res.status(400).json({ error: "Message is Empty!" });
    }

    console.log("sending message", message);

    try {
        const response = await fetch(process.env.MODEL_URL || "", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "mistralai/ministral-3-8b-reasoning",
                stream: false,
                messages: [
                    {
                        role: "user",
                        content: message,
                    },
                ],
            }),
        });

        if (!response.body) {
            throw new Error("No response body from LM Studio");
        }

        const data: any = await response.json();

        const aiMessage = {
            role: "assistant",
            content: data?.choices[0].message.content,
            timestamp: data?.created,
        };

        return res.status(200).json({ success: true, message: aiMessage });
    } catch (err) {
        if (err instanceof Error) {
            return res.status(500).json({ error: err.message });
        }
    }
};

export default sendMessage;
