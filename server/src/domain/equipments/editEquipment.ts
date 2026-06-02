import pool from "../../config/pool.ts";

interface EquipmentProps {
  id: number;
  equipment_name: string;
  category: string;
  target_muscles: string;
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


    await client.query("COMMIT");
    return { success: true };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

