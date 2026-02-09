import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";

export const generateToken = async (userId: number) => {
    const SECRET_KEY = env.JWT_SECRET!;
    const payload = { id: userId };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });
    return token;
};
