import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";

export const generateTokens = ({
    sub,
    role,
}: {
    sub: number;
    role: "member" | "admin";
}) => {
    const accessToken = jwt.sign(
        {
            sub,
            role,
        },
        env.JWT_ACCESS_SECRET!,
        {
            expiresIn: "15m",
        },
    );

    const refreshToken = jwt.sign(
        {
            sub,
            role,
        },
        env.JWT_REFRESH_SECRET!,
        {
            expiresIn: "7d",
        },
    );

    return { accessToken, refreshToken };
};
