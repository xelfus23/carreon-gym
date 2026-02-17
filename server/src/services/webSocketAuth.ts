import { WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";

type JWTPayload = {
    sub: number;
    role: "member" | "admin";
    iat?: number;
    exp?: number;
};

export const WSAuthentication = async (ws: WebSocket, req: any) => {
    try {
        const url = new URL(req.url, `http://${req.headers.host}`);

        const token = url.searchParams.get("token");
        const sessionId = url.searchParams.get("session_id");

        if (!token || !sessionId) throw new Error("Missing auth params");

        const payload = jwt.verify(
            token,
            env.JWT_ACCESS_SECRET!,
        ) as unknown as JWTPayload;

        return { sessionId: parseInt(sessionId), userId: payload.sub };
    } catch (err) {
        if (err instanceof Error) {
            console.error("WebSocket auth error:", err);
            ws.close(1008, "Invalid token");
        }
    }
};
