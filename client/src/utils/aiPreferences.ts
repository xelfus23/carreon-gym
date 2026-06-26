import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AiPreferences,
  DEFAULT_AI_PREFERENCES,
} from "../types/aiPreferences";

const STORAGE_KEY = "ai_personalization_prefs";
const PROFILE_PROMPT_KEY = "profile_accuracy_prompt_dismissed";

export async function getAiPreferences(): Promise<AiPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_PREFERENCES;
    const parsed = { ...DEFAULT_AI_PREFERENCES, ...JSON.parse(raw) };
    if (parsed.language !== "en" && parsed.language !== "tl") {
      parsed.language = DEFAULT_AI_PREFERENCES.language;
    }
    return parsed;
  } catch {
    return DEFAULT_AI_PREFERENCES;
  }
}

export async function saveAiPreferences(
  prefs: AiPreferences,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export async function isProfilePromptDismissed(): Promise<boolean> {
  const value = await AsyncStorage.getItem(PROFILE_PROMPT_KEY);
  return value === "true";
}

export async function dismissProfilePrompt(): Promise<void> {
  await AsyncStorage.setItem(PROFILE_PROMPT_KEY, "true");
}

export function hasBodyCompositionData(profile: {
  currentStats?: { bodyFatPercent?: number | null; muscleMassKg?: number | null };
} | null): boolean {
  if (!profile?.currentStats) return false;
  const { bodyFatPercent, muscleMassKg } = profile.currentStats;
  return (
    bodyFatPercent != null &&
    bodyFatPercent > 0 &&
    muscleMassKg != null &&
    muscleMassKg > 0
  );
}
