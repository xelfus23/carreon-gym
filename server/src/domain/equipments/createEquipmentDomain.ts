import pool from "../../config/pool.ts";

interface EquipmentProps {
  equipment_name: string;
  category: string;
  quantity: number;
  icon_url: string;
}

export const createEquipmentDomain = async (params: EquipmentProps) => {
  const payload: Record<string, any> = {
    name: params.equipment_name,
    icon_url: params.icon_url,
    quantity: params.quantity || 1,
  };

  const columns = Object.keys(payload);
  const values = Object.values(payload);

  const placeholders = columns.map((_, idx) => `$${idx + 1}`);

  columns.push("category_id");
  placeholders.push(`(SELECT id FROM equipment_category WHERE name = $${columns.length})`);
  values.push(params.category);

  const queryText = `
    INSERT INTO equipment (${columns.join(", ")})
    VALUES (${placeholders.join(", ")})
    RETURNING id;
  `;

  const equipRes = await pool.query(queryText, values);

  return { equipmentId: equipRes.rows[0].id };
};