import pool from "../../config/pool.ts";

interface EquipmentProps {
    id: number;
    equipment_name: string;
    category: string;
    target_muscles: string;
    description?: string;
    quantity?: number;
}

// --- UPDATE (PATCH) ---
export const updateEquipmentDomain = async (
    id: string,
    params: Partial<EquipmentProps>,
) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const updates: string[] = [];
        const values: any[] = [];
        let count = 1;

        if (params.equipment_name) {
            updates.push(`name = $${count++}`);
            values.push(params.equipment_name);
        }
        if (params.description !== undefined) {
            updates.push(`description = $${count++}`);
            values.push(params.description);
        }
        if (params.quantity !== undefined) {
            updates.push(`quantity = $${count++}`);
            values.push(params.quantity);
        }

        if (updates.length > 0) {
            values.push(id);
            await client.query(
                `UPDATE equipment SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${count} `,
                values,
            );
        }

        // 2. If target_muscles are provided, sync the many-to-many table
        if (params.target_muscles) {
            // Remove old mappings
            await client.query(
                `DELETE FROM equipment_muscle WHERE equipment_id = $1`,
                [id],
            );

            // Add new mappings
            const muscles = params.target_muscles
                .split(",")
                .map((m) => m.trim());
            const muscleRes = await client.query(
                `SELECT id FROM muscle_group WHERE name = ANY($1)`,
                [muscles],
            );

            for (const row of muscleRes.rows) {
                await client.query(
                    `INSERT INTO equipment_muscle (equipment_id, muscle_group_id) VALUES ($1, $2)`,
                    [id, row.id],
                );
            }
        }

        await client.query("COMMIT");
        return { success: true };
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

