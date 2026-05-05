import { meDomain } from "../../../domain/user/me.ts";
import { WebSocket } from "ws";

function getAge(birthdateStr: string) {
  const today = new Date();
  const birthdate = new Date(birthdateStr);

  let age = today.getFullYear() - birthdate.getFullYear();

  const hasHadBirthdayThisYear =
    today.getMonth() > birthdate.getMonth() ||
    (today.getMonth() === birthdate.getMonth() &&
      today.getDate() >= birthdate.getDate());

  if (!hasHadBirthdayThisYear) {
    age--;
  }

  return age;
}

export const getUserDetails = async (
  ws: WebSocket,
  args: any,
  userId: number,
) => {
  const result = await meDomain({ userId });

  const UserData = {
    full_name: `${result.firstName} ${result.lastName}`,
    birth_date: result.profile?.birthDate,
    age: getAge(result.profile?.birthDate),
    height: `${result.profile?.heightCm} cm`,
    gender: result.profile?.gender,
    fitness_goal: result.profile?.goal,
    activity_level: result.profile?.activityLevel,
    current_status: {
      weight: `${result.currentStats?.weightKg}`,
      body_fat_percent: result.currentStats?.bodyFatPercent,
      muscle_mass_kg: result.currentStats?.muscleMassKg,
      last_update: result.currentStats?.lastRecorded,
    },
  };

  return UserData;
};
