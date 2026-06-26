import type { Request, Response } from "express";
import { getSessionsDomain } from "../../domain/chat/getSessions.ts";
import { createSessionDomain } from "../../domain/chat/createSession.ts";
import { getSessionMessagesDomain } from "../../domain/chat/getSessionMessage.ts";
import { getSessionGenerationStatusDomain } from "../../domain/chat/getSessionGenerationStatus.ts";

export const getSession = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        const data = await getSessionsDomain({ userId: userId });

        return res.status(200).json({
            success: true,
            data: data,
            message: "Session retrieved",
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            return res
                .status(500)
                .json({ success: false, message: "Server Error" });
        }
    }
};

export const createSession = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const data = await createSessionDomain({ userId, type: "model" });

        return res.status(200).json({
            success: true,
            data: data,
            message: "Session Created",
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            return res
                .status(500)
                .json({ success: false, message: "Server Error" });
        }
    }
};

export const getSessionMessages = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const userId = (req as any).user?.id;

        if (!sessionId) {
            return res
                .status(400)
                .json({ success: false, message: "Session ID missing" });
        }

        const limit = req.query.limit
            ? Math.min(Number(req.query.limit), 100)
            : 50;
        const beforeId = req.query.beforeId
            ? Number(req.query.beforeId)
            : undefined;

        const data = await getSessionMessagesDomain({
            userId: userId,
            sessionId: Number(sessionId),
            limit,
            beforeId,
        });

        return res.status(200).json({
            success: true,
            message: "Message retrieved",
            data: data,
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            return res
                .status(500)
                .json({ success: false, message: "Server Error" });
        }
    }
};

export const getSessionGenerationStatus = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const userId = (req as any).user?.id;

        if (!sessionId) {
            return res
                .status(400)
                .json({ success: false, message: "Session ID missing" });
        }

        const data = await getSessionGenerationStatusDomain({
            userId: userId,
            sessionId: Number(sessionId),
        });

        return res.status(200).json({
            success: true,
            message: "Generation status retrieved",
            data: data,
        });
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            return res
                .status(500)
                .json({ success: false, message: "Server Error" });
        }
    }
};

export const deleteMessage = async (req: Request, res: Response) => {
    try {
    } catch (err) {
        if (err instanceof Error) {
            console.error(err.message);
            return res
                .status(500)
                .json({ success: false, message: "Server Error" });
        }
    }
};
