import { WebSocket } from "ws";
import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";
import { subscriptionQuery } from "../repositories/user.repository.ts";

type JWTPayload = {
  sub: number;
  role: "member" | "admin";
  iat?: number;
  exp?: number;
};

const getTokenFromCookies = (cookieHeader?: string) => {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());

  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === "accessToken") return value;
  }

  return null;
};

export const WSAuthentication = async (
  ws: WebSocket,
  req: any,
  type: "chat" | "admin",
) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    let token = url.searchParams.get("token");

    if (!token) {
      token = getTokenFromCookies(req.headers.cookie)!;
    }

    if (!token) throw new Error("Missing token");

    const payload = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET!,
    ) as unknown as JWTPayload;

    const userId = payload.sub;

    if (type === "admin") {
      if (payload.role !== "admin") {
        ws.close(1008, "FORBIDDEN");
        return null;
      }

      console.log("Auth as Admin");
      return { userId };
    }

    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) throw new Error("Missing session_id");

    const res = await subscriptionQuery(userId);

    if (res.rows.length === 0) {
      console.log("No subscription");
      ws.close(1008, "SUBSCRIPTION_REQUIRED");
      return null;
    }

    return {
      userId,
      sessionId: parseInt(sessionId),
    };
  } catch (err) {
    console.error("WebSocket auth error:", err);
    ws.close(1008, "AUTHENTICATION_FAILED");
    return null;
  }
};
