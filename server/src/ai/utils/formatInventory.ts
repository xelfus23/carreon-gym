export const formatInventory = (equipmentData: {
  equipment: any[];
  dumbbells: any[];
  barbell_plates: any[];
  barbell_rods: any[];
}) => {
  const { equipment, dumbbells, barbell_plates, barbell_rods } = equipmentData;
  let inventoryStr = "";

  if (equipment?.length) {
    inventoryStr += "### General Gym Equipment & Machines (ID:NAME)\n";
    inventoryStr += equipment
      .map((e) => `${e.id}: ${e.equipment_name} (Qty: ${e.quantity}, Type: ${e.type}, Available: ${e.is_available})`)
      .join("\n");
  }

  if (dumbbells?.length) {
    inventoryStr += "\n\n### Available Fixed-Weight Dumbbells Pairs\n";
    inventoryStr += dumbbells
      .map((d) => `- ${d.equipment_name}: ${d.quantity} pair(s) (Available: ${d.is_available})`)
      .join("\n");
  }

  if (barbell_rods?.length) {
    inventoryStr += "\n\n### Barbell Rods\n";
    inventoryStr += barbell_rods
      .map((r) => `${r.name} x${r.quantity}${r.is_available ? "" : " [OUT OF SERVICE]"}`)
      .join(", ");
  }

  if (barbell_plates?.length) {
    inventoryStr += "\n\n### Shared Loose Barbell Plates (Rack for all adjustable Barbells & plate-loaded machines)\n";
    inventoryStr += barbell_plates.map((p) => `${Number(p.weight_lb)}lb plate x${p.quantity}`).join(", ");
  }

  return inventoryStr;
};