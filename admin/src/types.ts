import type { ComponentType, ReactElement } from "react";

export enum NavItem {
  ANALYTICS = "ANALYTICS",
  QR_CODE = "QR_CODE",
  ADMIN = "ADMIN",
  MEMBERS = "MEMBERS",
  ATTENDANCE_LOG = "ATTENDANCE_LOG",
  TRANSACTIONS = "TRANSACTIONS",
  GYM_EQUIPMENTS = "GYM_EQUIPMENTS",
  GYM_PRODUCTS = "GYM_PRODUCTS",
  // AI_INSIGHTS = "AI_INSIGHTS",
  GYM_SETTINGS = "GYM_SETTINGS",
  SUBSCRIPTIONS = "SUBSCRIPTIONS",
}

export type SubscriptionStatus = "active" | "expired" | "pending" | "cancelled";

export type AccountStatus = "active" | "suspended" | "banned" | "deleted";

export type AccountRegistrationProps = {
  first_name: string;
  last_name: string;
  password: string;
  email: string;
  phone_number: string;
};

export interface UserAccountProps {
  id: number;
  role: "member" | "admin" | "trainer";
  // Basic Info
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  verified: boolean;
  account_status: AccountStatus;
  last_login: string | null; // ISO string
  created_at: string; // ISO string

  // Subscription Info (nullable because LEFT JOIN)
  plan_name: string | null;
  subscription_status: SubscriptionStatus | null;
  expiry_date: string | null;

  // Latest Body Metric (nullable)
  weight_kg: number | null;
  weight_recorded_at: string | null;

  // Attendance
  last_check_in: string | null; // ISO string
  total_visits_all_time: number | null;
  total_visits_this_month: number | null;
  attendance_rate: number;
}

export interface SubscriptionModalProps {
  member: UserAccountProps | null;
  onClose: () => void;
  onSuccess: () => void;
}

export interface TrainerProps {
  id: string;
  name: string;
  specialty: string;
  activeClients: number;
  rating: number;
  image: string;
}

export interface GymClassProps {
  id: string;
  name: string;
  instructor: string;
  time: string;
  capacity: number;
  enrolled: number;
  type: "Yoga" | "HIIT" | "CrossFit" | "Boxing";
}

export interface DashboardStatsProps {
  totalMembers: number;
  activeRevenue: number;
  occupancyRate: number;
  trainerSatisfaction: number;
}

export interface ActionItemProps {
  label: string;
  icon: ReactElement;
  onClick: () => void;
  variant?: "default" | "danger" | "warning" | "success";
  dividerBefore?: boolean;
  disabled?: boolean;
}

export type EquipmentProps = {
  equipment_name: string;
  category: string;
  target_muscles: string;
  description?: string;
  quantity?: number;
};

export type gymDetailsProps = {
  id: number;
  gym_name: string;
  address: string;
  contact_number: string;
  email: string;
  gcash_name: string;
  gcash_number: string;
  maya_name: string;
  maya_number: string;
  bank_details: string;
  opening_time: string;
  closing_time: string;
  facebook_url: string;
  instagram_url: string;
  logo_url: string;
  updated_at: string;
};

export type ProductProps = {
  id: number;
  product_name: string;
  image_urls: string[];
  price: number;
  last_restock: string;
  available: boolean;
  stocks: number;
  status: "available" | "out_of_stock" | "unavailable";
  category: string;
  is_active?: boolean;
};

export interface PurchaseRequestProps {
  productId: number;
  quantity: number;
  method: string;
}

export interface SubscriptionPlanProps {
  id: number;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  category: "personal_training" | "class" | "membership" | "add_on";
  is_active: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "checkbox" | "select" | "image";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string | number }[]; // For select fields
  icon?: ComponentType<{ className?: string; size?: number }>; // Lucide prefix icon
  gridSpan?: "full" | "half";
  description?: string;
}

export interface UniversalEditModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  subtitle?: string;
  fields: FormField[];
  initialData: T | null;
  onSave: (data: T, imageFile: File | null) => Promise<void>; // Updated to handle image files
}

export interface UniversalAddModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string;
  subtitle?: string;
  fields: FormField[]; // Synchronized field properties
  submitButtonText?: string;
  onSave: (data: T, imageFile: File | null) => Promise<void>;
}

export type ConfirmDialogModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "success";
  isLoading?: boolean;
};

export type ConfirmDialogTypes = {
  title: string;
  message: string;
  confirmLabel: string;
  variant: "warning" | "danger" | "success";
  onConfirm: () => void;
  onClose: () => void;
} | null;
