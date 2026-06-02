import pool from "../../config/pool.ts";

interface EquipmentProps {
  equipment_name: string;
  category: string;
  target_muscles: string;
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
      `INSERT INTO equipment (name, category_id, quantity) VALUES ($1, $2, $3 ) RETURNING id`,
      [
        params.equipment_name,
        categoryId,
        params.quantity || 1,
      ],
    );

    const equipmentId = equipRes.rows[0].id;

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
