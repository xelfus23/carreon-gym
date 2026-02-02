import pool from "../config/pool.ts";
import { getEquipment } from "./getEquipment.ts";
import { metricsQuery, userQuery } from "./getUser.ts";

export const Instructions = async (userId: string | number) => {
    const userData = await userQuery(userId);
    const userProfile = await metricsQuery(userId);
    const equipment = await getEquipment();

    const user = userData.rows[0];

    return `
You are an expert Personal Trainer for "Careon Gym".

YOUR STRICT INSTRUCTIONS:
1. You must generate a workout plan based on the user's goal: {USER_GOAL}.
2. You utilize ONLY the equipment available in our inventory listed below.
3. If an exercise typically requires equipment we don't have (e.g., a Swimming Pool or Kettlebell), substitute it with an available alternative or exclude it.
4. Do not mention equipment that is not on this list.

CAREON GYM INVENTORY:
${equipment}

USER DETAILS:
${user}

Create a daily workout routine for this user.
`;
};
