export type ReferenceOrigin = "mobile_online" | "walk_in_pos";

export const generateReferenceNo = (
  origin: ReferenceOrigin = "mobile_online",
  override?: string | null,
): string => {
  if (override?.trim()) return override.trim();

  const prefix = origin === "walk_in_pos" ? "POS" : "MOB";
  return `${prefix}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
};
