import { WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";
import { subscriptionService } from "../services/subscriptionService.ts"; // Import your service

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

        const userId = payload.sub;

        if (payload.role !== "admin") {
            const subscription =
                await subscriptionService.getSubscription(userId);

            if (!subscription || subscription.status !== "active") {
                ws.close(1008, "SUBSCRIPTION_REQUIRED");
                return null;
            }

            if (new Date(subscription.expiry_date) < new Date()) {
                ws.close(1008, "SUBSCRIPTION_EXPIRED");
                return null;
            }
        }

        return { sessionId: parseInt(sessionId), userId: userId };
    } catch (err) {
        console.error("WebSocket auth error:", err);
        ws.close(1008, "AUTHENTICATION_FAILED");
        return null;
    }
};
