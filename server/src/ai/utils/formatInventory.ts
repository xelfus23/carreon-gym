export const formatInventory = (equipments: any[]) => {
  if (!equipments?.length) return "None";

  return equipments
    .map((e) => {
      let variantStr = "";
      if (e.weight_variants && e.weight_variants.length > 0) {
        // Formats variants cleanly like: (Plates: 5lb x10, 10lb x30)
        const variants = e.weight_variants
          .map((v: any) => `${v.weight_lb}lb x${v.quantity}`)
          .join(", ");
        variantStr = ` (Variants: ${variants})`;
      }
      return `${e.id}:${e.equipment_name}${variantStr}`;
    })
    .join("\n"); // Using newline (\n) makes it much easier for the AI to read list-style items
};
