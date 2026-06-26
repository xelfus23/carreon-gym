import { getEquipmentDomain } from "../../domain/equipments/getEquipmentsDomain.ts";
import { summaryQuery } from "../../repositories/user.repository.ts";
import { getUserDetails } from "../tools/functions/getUserDetails.ts";
import { formatInventory } from "../utils/formatInventory.ts";
import { BASE_SYSTEM_PROMPT } from "./baseSystemPrompt.ts";
import { buildContext } from "./buildContext.ts";


export type AiPersonalization = {
  tone?: string;
  language?: string;
  detailLevel?: string;
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  friendly: "Use a warm, approachable tone.",
  professional: "Use a clear, expert, professional tone.",
  motivational: "Use an energetic, encouraging coach tone.",
  casual: "Use a relaxed, gym-buddy conversational tone.",
};

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: "Respond in English.",
  tl: "Respond in Tagalog (Filipino).",
  es: "Respond in Spanish.",
};

const DETAIL_INSTRUCTIONS: Record<string, string> = {
  concise: "Keep answers short and to the point.",
  balanced: "Provide moderate detail — enough context without being verbose.",
  detailed: "Provide thorough, in-depth explanations when helpful.",
};

function buildPersonalizationBlock(prefs?: AiPersonalization): string {
  if (!prefs) return "";

  const parts = [
    prefs.tone && TONE_INSTRUCTIONS[prefs.tone],
    prefs.language && LANGUAGE_INSTRUCTIONS[prefs.language],
    prefs.detailLevel && DETAIL_INSTRUCTIONS[prefs.detailLevel],
  ].filter(Boolean);

  if (parts.length === 0) return "";

  return `\n## AI PERSONALIZATION\n${parts.map((p) => `- ${p}`).join("\n")}`;
}

export const buildSystemPrompt = async (
  userId: number,
  personalization?: AiPersonalization,
) => {
  const [summary, equipmentResult, userProfile] = await Promise.all([
    summaryQuery(userId),
    getEquipmentDomain(),
    getUserDetails(userId)
  ]);


  const inventory = formatInventory(equipmentResult);

  const context = buildContext({
    inventory,
    summary,
    userProfile,
  });

  const personalizationBlock = buildPersonalizationBlock(personalization);

  return `${BASE_SYSTEM_PROMPT}\n\n${context}${personalizationBlock}`;
};