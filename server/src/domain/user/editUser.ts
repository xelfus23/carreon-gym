import type { Request, Response } from "express";

export const EditUserDomain = (req: Request, res: Response) => {
    try {
        res.status(200).json({ success: true, message: "Success", data: {} });
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            return res
                .status(500)
                .json({ success: false, message: err.message });
        }
    }
};
