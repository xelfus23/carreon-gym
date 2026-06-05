import { object, success } from "zod";
import type { SubscriptionTypes } from "../../types/index.ts";
import pool from "../../config/pool.ts";

export const updateSubscriptionDomain = async (
  id: number,
  data: Partial<SubscriptionTypes>,
) => {
  const entries = Object.entries(data);

  if (entries.length === 0) return { success: true };

  const updates = entries.map(([key], idx) => `${key} = $${idx + 1}`);
  const values = entries.map(([_, value]) => value);

  values.push(id);
  const idPlaceholder = `$${values.length}`;

  const queryText = `
  UPDATE subscription_plans
  SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
  WHERE id = ${idPlaceholder}
  RETURNING id;
  `;

  await pool.query(queryText, values);

  return { success: true };
};
