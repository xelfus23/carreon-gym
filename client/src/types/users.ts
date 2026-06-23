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
export type SubscriptionStatus = "active" | "expired" | "pending" | "cancelled";

export type Subscription = {
  id?: string;
  status: SubscriptionStatus;
  planName: string;
  category?: string;
  expiryDate?: Date | string | null;
  startDate?: Date | string | null;
  autoRenew?: boolean;
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
  subscription?: Subscription | null;
  subscriptions?: Subscription[];
  createdAt: string;
};
