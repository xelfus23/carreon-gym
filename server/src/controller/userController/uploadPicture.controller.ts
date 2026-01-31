import type { Request, Response } from "express";

const uploadPicture = async (req: Request, res: Response) => {
    try {

        const file = req.file as any;

        return res
            .status(200)
            .json({ success: false, message: "Upload Success" });
    } catch (err) {
        if (err instanceof Error) {
            return res
                .status(500)
                .json({ message: err.message, success: false });
        }
    }
};

export default uploadPicture;
