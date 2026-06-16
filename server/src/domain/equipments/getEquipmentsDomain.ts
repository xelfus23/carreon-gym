import pool from "../../config/pool.ts";

export const getEquipmentDomain = async () => {
  // Schema note (2026-06): barbell rods/plates are now in unified `equipment` table.
  // We keep response keys stable for the admin UI: equipment_name + type + category.
  const coreEquipmentQuery = `
    SELECT 
      e.id, 
      e.name AS equipment_name, 
      e.icon_url,
      e.quantity,
      e.equipment_type AS type,
      e.is_available,
      ec.name AS category
    FROM equipment e
    LEFT JOIN equipment_category ec ON e.category_id = ec.id
    WHERE e.equipment_type IN ('machine','accessory','cardio')
    ORDER BY e.id;
  `;

  // 2. Queries ONLY dumbbell listings (Uses numeric sort logic to line up weights correctly)
  const dumbbellsQuery = `
    SELECT 
      e.id, 
      e.name AS equipment_name, 
      e.icon_url,
      e.quantity,
      e.equipment_type AS type,
      e.is_available,
      ec.name AS category
    FROM equipment e
    LEFT JOIN equipment_category ec ON e.category_id = ec.id
    WHERE e.equipment_type = 'dumbbell'
    ORDER BY COALESCE(e.weight_lb, NULLIF(regexp_replace(e.name, '[^0-9]', '', 'g'), '')::numeric) ASC, e.name ASC;
  `;

  const platesQuery = `
    SELECT weight_lb, quantity
    FROM equipment
    WHERE equipment_type = 'plate' AND weight_lb IS NOT NULL
    ORDER BY weight_lb ASC;
  `;

  const rodsQuery = `
    SELECT id, name, quantity, is_available
    FROM equipment
    WHERE equipment_type = 'barbell'
    ORDER BY name ASC;
  `;

  const [coreResult, dumbbellResult, platesResult, rodsResult] = await Promise.all([
    pool.query(coreEquipmentQuery),
    pool.query(dumbbellsQuery),
    pool.query(platesQuery),
    pool.query(rodsQuery),
  ]);

  return {
    equipment: coreResult.rows,
    dumbbells: dumbbellResult.rows,
    barbell_plates: platesResult.rows,
    barbell_rods: rodsResult.rows,
  };
};