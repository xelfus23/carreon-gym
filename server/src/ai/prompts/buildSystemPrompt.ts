import { getEquipmentDomain } from "../../domain/equipments/getEquipments.ts";
import { summaryQuery } from "../../repositories/user.repository.ts";
import { formatInventory } from "../utils/formatInventory.ts";
import { BASE_SYSTEM_PROMPT } from "./baseSystemPrompt.ts";
import { buildContext } from "./buildContext.ts";


export const buildSystemPrompt = async (userId: number) => {
  const [summary, equipmentResult] = await Promise.all([
    summaryQuery(userId),
    getEquipmentDomain(),
  ]);

  const inventory = formatInventory(equipmentResult);

  const context = buildContext({
    inventory,
    summary,
  });

  return `${BASE_SYSTEM_PROMPT}\n\n${context}`;
};