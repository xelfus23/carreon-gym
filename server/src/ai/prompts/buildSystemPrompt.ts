import { getEquipmentDomain } from "../../domain/equipments/getEquipmentsDomain.ts";
import { summaryQuery } from "../../repositories/user.repository.ts";
import { getUserDetails } from "../tools/functions/getUserDetails.ts";
import { formatInventory } from "../utils/formatInventory.ts";
import { BASE_SYSTEM_PROMPT } from "./baseSystemPrompt.ts";
import { buildContext } from "./buildContext.ts";


export const buildSystemPrompt = async (userId: number) => {
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

  return `${BASE_SYSTEM_PROMPT}\n\n${context}`;
};