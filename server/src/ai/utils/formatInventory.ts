export const formatInventory = (equipments: any[]) => {
  if (!equipments?.length) return "None";

  return equipments
    .map((e) => `${e.id}:${e.equipment_name}`)
    .join(", ");
};