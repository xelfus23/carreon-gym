import type { Request, Response } from "express";

const deleteChat = async (req: Request, res: Response) => {

    const chatId = req.params;

    try {

        console.log("")

        return res.status(200).json({success: true})
    } catch (err) {
        if (err instanceof Error) {
            return res.status(500).json({ error: err.message });
        }
    }
};

export default deleteChat