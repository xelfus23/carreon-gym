type FormatOptions = Intl.DateTimeFormatOptions;

export const formatDate = (
  date: Date | string | null | undefined,
  options?: FormatOptions
) => {
  if (!date) return "N/A";

  const parsedDate = date instanceof Date ? date : new Date(date);

  return parsedDate.toLocaleDateString("en-US", options);
};