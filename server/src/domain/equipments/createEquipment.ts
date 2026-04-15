import pool from "../../config/pool.ts";

interface EquipmentProps {
    equipment_name: string;
    category: string;
    target_muscles: string;
    description?: string;
    quantity?: number;
}

export const createEquipmentDomain = async (params: EquipmentProps) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const categoryRes = await client.query(
            `SELECT id FROM equipment_category WHERE name = $1`,
            [params.category],
        );

        if (categoryRes.rows.length === 0) {
            throw new Error(`Category "${params.category}" not found.`);
        }

        const categoryId = categoryRes.rows[0].id;

        const equipRes = await client.query(
            `INSERT INTO equipment (name, category_id, description, quantity) VALUES ($1, $2, $3, $4) RETURNING id`,
            [
                params.equipment_name,
                categoryId,
                params.description || "",
                params.quantity || 1,
            ],
        );

        const equipmentId = equipRes.rows[0].id;

        const muscles = params.target_muscles.split(`,`).map((m) => m.trim());

        const muscleRes = await client.query(
            `SELECT id FROM muscle_group WHERE name = ANY($1)`,
            [muscles],
        );

        for (const row of muscleRes.rows) {
            await client.query(
                `INSERT INTO equipment_muscle (equipment_id, muscle_group_id) VALUES ($1, $2)`,
                [equipmentId, row.id],
            );
        }

        await client.query("COMMIT");
        return { equipmentId };
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error inserting equipment:", err);
        throw err;
    } finally {
        client.release();
    }
};
