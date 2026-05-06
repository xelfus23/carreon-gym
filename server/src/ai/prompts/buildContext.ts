export const buildContext = ({
  inventory,
  summary,
}: {
  inventory: string;
  summary: string;
}) => {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
## TODAY
${today}

## INVENTORY (ID:NAME)
${inventory}

## USER CONTEXT
${summary || "No previous context"}

## INSTRUCTIONS
- Use the user context to personalize responses
- Do not repeat already answered questions
`;
};