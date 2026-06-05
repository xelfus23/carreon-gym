import pool from "../../config/pool.ts";

export const getEquipmentDomain = async () => {
  const query = `
          SELECT 
              e.id, 
              e.name AS equipment_name, 
              e.icon_url,
              e.quantity,
              ec.name AS category 
          FROM 
              equipment e
          JOIN 
              equipment_category ec ON e.category_id = ec.id
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
