import pool from "../../config/pool.ts";

interface EquipmentProps {
  id: number;
  equipment_name: string;
  category: string;
  target_muscles: string;
  quantity?: number;
  icon_url?: string;
}

export const updateEquipmentDomain = async (
  id: number,
  params: Partial<EquipmentProps>,
) => {
  const payload: Record<string, any> = {};
  if (params.equipment_name !== undefined) payload.name = params.equipment_name;
  if (params.icon_url !== undefined) payload.icon_url = params.icon_url;
  if (params.quantity !== undefined) payload.quantity = params.quantity;

  const entries = Object.entries(payload);

  if (entries.length === 0) return { success: true };

  const updates = entries.map(([key], idx) => `${key} = $${idx + 1}`);
  const values = entries.map(([_, value]) => value);

  values.push(id);
  const idPlaceholder = `$${values.length}`;

  const queryText = `
    UPDATE equipment 
    SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ${idPlaceholder}
    RETURNING id;
  `;

  await pool.query(queryText, values);

  return { success: true };
};
