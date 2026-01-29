import type { Request, Response } from "express";

const sendMessage = async (req: Request, res: Response) => {
    const { prompt, session_id } = req.body;

    try {

        const modelResponse = await fetch(process.env.MODEL_URL || "", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify("")
        })

        return res.status(200).json({ success: true });
    } catch (err) {
        if (err instanceof Error) {
            return res.status(500).json({ error: err.message });
        }
    }
};

export default sendMessage;
