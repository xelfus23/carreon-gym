import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.ts";
import { AppError } from "./appError.ts";

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
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as any,
    },
  );

  const refreshToken = jwt.sign(
    {
      sub,
      role,
    },
    env.JWT_REFRESH_SECRET!,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    },
  );

  return { accessToken, refreshToken };
};
