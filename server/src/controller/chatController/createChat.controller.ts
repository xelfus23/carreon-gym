import type { Request, Response } from "express";

const createChat = async (req: Request, res: Response) => {
    try {
        return res.status(200).json({ success: true });
    } catch (err) {
        if (err instanceof Error) {
            return res.status(500).json({ error: err.message });
        }
    }
};

export default createChat;
