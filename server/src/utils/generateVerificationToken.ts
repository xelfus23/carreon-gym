// utils/generateVerificationToken.ts
import crypto from "crypto";
import pool from "../config/pool.ts";

export const generateVerificationToken = async (
    userId: number,
): Promise<string> => {
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await pool.query(
        `INSERT INTO verification_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) 
         DO UPDATE SET token_hash = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP`,
        [userId, hashedToken, expiresAt],
    );

    return token;
};
