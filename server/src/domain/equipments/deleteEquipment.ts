import pool from "../../config/pool.ts";

export const deleteEquipmentDomain = async (id: string) => {
    const result = await pool.query(
        `DELETE FROM equipment WHERE id = $1 RETURNING id`,
        [id],
    );

    if (result.rowCount === 0) {
        throw new Error("Equipment not found");
    }
    return { success: true };
};
