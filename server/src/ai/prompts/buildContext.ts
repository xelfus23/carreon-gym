export const buildContext = ({ inventory, summary, userProfile }: { inventory: string; summary: string, userProfile: {} }) => {
  
  const today = new Date().toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });


  return `
## TODAY
${today}

## USER PROFILE
${JSON.stringify(userProfile)}

## GYM INVENTORY
${inventory ? `## INVENTORY (ID:NAME)\n${inventory}\n` : ""}

## USER CONTEXT
${summary?.trim() || "No previous context"}

## INSTRUCTIONS
- Use the user context to personalize responses
- Do not repeat already answered questions
`.trim();
};