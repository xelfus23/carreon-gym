import { model } from "../../config/models.ts";

export type ModelProvider = "lmstudio" | "gemini";

/** Must stay in sync with streamModel.ts PROVIDER constant. */
export const ACTIVE_MODEL_PROVIDER: ModelProvider = "lmstudio";

const GEMINI_MODEL_NAME = "gemini-2.5-flash-lite";

export function getActiveModelMetadata(): {
  provider: ModelProvider;
  modelName: string;
} {
  if (ACTIVE_MODEL_PROVIDER === "lmstudio") {
    return { provider: "lmstudio", modelName: model.gema_12b };
  }

  return { provider: "gemini", modelName: GEMINI_MODEL_NAME };
}
