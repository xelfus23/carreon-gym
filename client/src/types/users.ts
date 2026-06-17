export type AuthUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: "member" | "trainer" | "admin";
  token?: string;
};

export type Profile = {
  heightCm: number;
  gender: "male" | "female" | "other";
  birthDate: string;
  goal: string;
  activityLevel:
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";
  experienceLevel: "beginner" | "intermediate" | "advanced"
};
export type Subscription = {
  status: "active" | "expired" | "pending" | "cancelled";
  planName: string;
  expiryDate: Date;
  startDate: Date;
};

export type CurrentStats = {
  weightKg: number;
  bodyFatPercent: number | null;
  muscleMassKg: number | null;
  lastRecorded?: Date;
  recorded_at?: Date;
};

export type UserProfile = {
  id: number;
  firstName: string;
  lastName: string;
  verified: boolean;
  email: string;
  role: string;
  phoneNumber: string;
  profileImageUrl?: string;
  profile: Profile;
  currentStats?: CurrentStats;
  subscription?: Subscription;
  createdAt: string;
};
