export type AiTone = "friendly" | "professional" | "motivational" | "casual";
export type AiLanguage = "en" | "tl";
export type AiDetailLevel = "concise" | "balanced" | "detailed";

export type AiPreferences = {
  tone: AiTone;
  language: AiLanguage;
  detailLevel: AiDetailLevel;
};

export const DEFAULT_AI_PREFERENCES: AiPreferences = {
  tone: "motivational",
  language: "en",
  detailLevel: "balanced",
};

export const TONE_OPTIONS: { value: AiTone; label: string; description: string }[] = [
  { value: "friendly", label: "Friendly", description: "Warm and approachable" },
  { value: "professional", label: "Professional", description: "Clear and expert" },
  { value: "motivational", label: "Motivational", description: "Energetic coach style" },
  { value: "casual", label: "Casual", description: "Relaxed gym buddy vibe" },
];

export const LANGUAGE_OPTIONS: { value: AiLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "tl", label: "Tagalog" },
];

export const DETAIL_OPTIONS: { value: AiDetailLevel; label: string; description: string }[] = [
  { value: "concise", label: "Concise", description: "Short, to-the-point answers" },
  { value: "balanced", label: "Balanced", description: "Moderate detail" },
  { value: "detailed", label: "Detailed", description: "In-depth explanations" },
];
