import pool from "../../config/pool.ts";

interface EquipmentProps {
  id: number;
  equipment_name: string;
  category: string;
  target_muscles: string;
  quantity?: number;
  icon_url?: string;
  type?: string;
  weight_lb?: number | null;
  is_available?: boolean;
}

export const updateEquipmentDomain = async (
  id: number,
  params: Partial<EquipmentProps>,
) => {
  const payload: Record<string, any> = {};
  if (params.equipment_name !== undefined) payload.name = params.equipment_name;
  if (params.icon_url !== undefined) payload.icon_url = params.icon_url;
  if (params.quantity !== undefined) payload.quantity = params.quantity;
  if (params.type !== undefined) payload.equipment_type = params.type;
  if (params.weight_lb !== undefined) payload.weight_lb = params.weight_lb;
  if (params.is_available !== undefined) payload.is_available = params.is_available;

  const entries = Object.entries(payload);

  // Category needs a subquery update (category_id), since admin sends the category name
  if (params.category !== undefined) {
    entries.push([
      "category_id",
      {
        __raw: true,
        value: params.category,
      },
    ]);
  }

  if (entries.length === 0) return { success: true };

  const updates: string[] = [];
  const values: any[] = [];

  for (const [key, value] of entries) {
    if (value && typeof value === "object" && value.__raw) {
      values.push(value.value);
      updates.push(`${key} = (SELECT id FROM equipment_category WHERE name = $${values.length})`);
    } else {
      values.push(value);
      updates.push(`${key} = $${values.length}`);
    }
  }

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
