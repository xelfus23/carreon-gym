import pool from "../../config/pool.ts";

export const getEquipmentDomain = async () => {
  const query = `
    SELECT 
        e.id, 
        e.name AS equipment_name, 
        e.icon_url,
        e.quantity,
        ec.name AS category,
        -- Fetch variants as an array of JSON objects containing weight and quantity
        COALESCE(
          json_agg(
            json_build_object('weight_lb', ev.weight_lb, 'quantity', ev.quantity)
          ) FILTER (WHERE ev.id IS NOT NULL), '[]'
        ) AS weight_variants
    FROM 
        equipment e
    JOIN 
        equipment_category ec ON e.category_id = ec.id
    LEFT JOIN 
        equipment_weight_variants ev ON e.id = ev.equipment_id
    GROUP BY 
        e.id, 
        e.name, 
        e.quantity,
        ec.name
    ORDER BY e.id;
  `;

  const result = await pool.query(query);

  if (result.rowCount === 0) {
    throw new Error("Equipment not found");
  }

  return result.rows;
};
