export const formatSlug = (text: string): string => {
  if (!text) return "";

  return text
    .split('_')
    .map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
};
