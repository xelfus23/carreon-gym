import { stat } from "node:fs";
import pool from "../../config/pool.ts";

export const verifyMemberDomain = async (userId: number) => {
    const result = await pool.query(
        `
        SELECT verified FROM users
        WHERE id = $1`,
        [userId],
    );

    const status = result.rows[0];

    console.log(status);

    const res = await pool.query(
        status.verified
            ? `
            UPDATE users 
            SET verified = false, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 
            RETURNING id, email, verified
            `
            : `
            UPDATE users 
            SET verified = true, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $1 
            RETURNING id, email, verified`,
        [userId],
    );

    if (res.rowCount === 0) {
        throw new Error("User not found");
    }

    return res.rows[0];
};
