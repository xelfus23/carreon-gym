import jwt from "jsonwebtoken";

export function generateToken(userId: string | number) {
    const SECRET_KEY = process.env.JWT_SECRET_KEY!;

    const payload = { id: userId };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "7d" });

    return token;
}
