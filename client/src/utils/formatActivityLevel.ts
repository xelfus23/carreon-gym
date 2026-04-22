export const formatActivityLevel = (level: string | undefined) => {
  if (!level) return "N/A";
  return level
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
