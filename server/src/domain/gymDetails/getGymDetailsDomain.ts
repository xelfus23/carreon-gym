import pool from "../../config/pool.ts";

export const getGymDetailsDomain = async () => {
    const result = await pool.query(`SELECT * FROM gym_details LIMIT 1`);
    return result.rows[0];
};
