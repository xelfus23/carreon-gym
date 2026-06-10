import pool from "../../config/pool.ts";

export const getEquipmentDomain = async () => {
  // 1. Queries all inventory EXCEPT dumbbell listings
  const coreEquipmentQuery = `
    SELECT 
      e.id, 
      e.name AS equipment_name, 
      e.icon_url,
      e.quantity,
      e.type,
      e.is_available,
      ec.name AS category
    FROM equipment e
    JOIN equipment_category ec ON e.category_id = ec.id
    WHERE LOWER(e.name) NOT LIKE '%dumbbell%'
    ORDER BY e.id;
  `;

  // 2. Queries ONLY dumbbell listings (Uses a string-casting sort logic to line up weights correctly)
  const dumbbellsQuery = `
    SELECT 
      e.id, 
      e.name AS equipment_name, 
      e.icon_url,
      e.quantity,
      e.type,
      e.is_available,
      ec.name AS category
    FROM equipment e
    JOIN equipment_category ec ON e.category_id = ec.id
    WHERE LOWER(e.name) LIKE '%dumbbell%'
    ORDER BY NULLIF(regexp_replace(e.name, '[^0-9]', '', 'g'), '')::numeric ASC, e.name ASC;
  `;

  const platesQuery = `
    SELECT weight_lb, quantity 
    FROM barbell_plates 
    ORDER BY weight_lb ASC;
  `;

  const rodsQuery = `
    SELECT id, name, quantity, is_available
    FROM barbell_rods
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

export const formatInventory = (equipmentData: {
  equipment: any[];
  dumbbells: any[];
  barbell_plates: any[];
  barbell_rods: any[];
}) => {
  const { equipment, dumbbells, barbell_plates, barbell_rods } = equipmentData;
  let inventoryStr = "";

  // 1. General Machinery Structure
  if (equipment?.length) {
    inventoryStr += "### General Gym Equipment & Fixed Machines (ID:NAME)\n";
    inventoryStr += equipment
      .map((e) => `${e.id}: ${e.equipment_name} (Qty: ${e.quantity}, Type: ${e.type}, Functional: ${e.is_available})`)
      .join("\n");
  } else {
    inventoryStr += "No general machines registered.\n";
  }

  // 2. Fixed Handheld Dumbbells Set
  if (dumbbells?.length) {
    inventoryStr += "\n\n### Tracked Fixed-Weight Handheld Dumbbells Racks\n";
    inventoryStr += dumbbells
      .map((d) => `- ${d.equipment_name}: ${d.quantity} units (${Math.floor(d.quantity / 2)} pair(s)) [In Service: ${d.is_available}]`)
      .join("\n");
  } else {
    inventoryStr += "\nNo fixed dumbbells indexed in database.\n";
  }

  // 3. Loose Barbell Structural Components
  if (barbell_rods?.length) {
    inventoryStr += "\n\n### Available Barbell Shafts & Rod Elements\n";
    inventoryStr += barbell_rods
      .map((r) => `${r.name} x${r.quantity}${r.is_available ? "" : " [OUT OF SERVICE / REPAIR]"}`)
      .join(", ");
  }

  // 4. Loose Weight Storage Pins
  if (barbell_plates?.length) {
    inventoryStr += "\n\n### Shared Loose Weight Plates Rack (For standard adjustable barbells & plate-loaded machines)\n";
    inventoryStr += barbell_plates.map((p) => `${Number(p.weight_lb)}lb plate x${p.quantity}`).join(", ");
  }

  return inventoryStr;
};