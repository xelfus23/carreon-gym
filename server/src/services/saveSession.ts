import pool from "../config/pool.ts";

interface saveSessionProps {
    userId: number;
    tokenHash: string;
    deviceInfo: null | string;
    ip: string | null;
}

export const saveSessionToDB = async ({
    userId,
    tokenHash,
    deviceInfo,
    ip,
}: saveSessionProps) => {
    const query = `
        INSERT INTO user_sessions
        (user_id, refresh_token_hash, device_info, ip_address, expires_at)
        VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')
    `;

    pool.query(query, [userId, tokenHash, deviceInfo, ip]);
};
