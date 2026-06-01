export const API_URL = import.meta.env.VITE_SERVER_URL;

export const COLORS = {
  // Brand
  primary: "#7CFF00", // Neon green (main brand color)
  primaryDark: "#5ECC00",

  // Backgrounds
  background: "#0F0F0F", // App background
  surface: "#1A1A1A", // Cards, modals, sections

  // Text
  textPrimary: "#FFFFFF",
  textSecondary: "#B3B3B3",

  // UI Elements
  border: "#2A2A2A",
  danger: "#FF3B3B",

  // Optional extras (nice to have)
  disabled: "#3A3A3A",
  success: "#7CFF00",
};

export const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "gcash", label: "GCash", icon: "📱" },
  // { value: "maya", label: "Maya", icon: "💜" },
  // { value: "bank_transfer", label: "Bank", icon: "🏦" },
  // { value: "card", label: "Card", icon: "💳" },
  // { value: "other", label: "Other", icon: "···" },
];

export function getMuscleStyle(muscle: string): { text: string; bg: string } {
  // Normalize input string for consistent lookups
  const m = muscle.trim().toLowerCase();

  // ── Push / Chest / Shoulders / Triceps ──
  if (m.includes("chest") || m.includes("pectoral")) {
    return {
      text: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40 border border-blue-200/30",
    };
  }
  if (m.includes("shoulder") || m.includes("delt")) {
    return {
      text: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-50 dark:bg-sky-950/40 border border-sky-200/30",
    };
  }
  if (m.includes("tricep")) {
    return {
      text: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/30",
    };
  }

  // ── Pull / Back / Biceps ──
  if (
    m.includes("back") ||
    m.includes("lat") ||
    m.includes("trapezius") ||
    m.includes("rhomboid")
  ) {
    return {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/30",
    };
  }
  if (
    m.includes("bicep") ||
    m.includes("forearm") ||
    m.includes("brachialis")
  ) {
    return {
      text: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950/40 border border-green-200/30",
    };
  }

  // ── Legs / Lower Body ──
  if (m.includes("quad") || m.includes("thigh") || m.includes("squat")) {
    return {
      text: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-200/30",
    };
  }
  if (m.includes("hamstring") || m.includes("glute")) {
    return {
      text: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/40 border border-orange-200/30",
    };
  }
  if (m.includes("calf") || m.includes("calves")) {
    return {
      text: "text-yellow-600 dark:text-yellow-400",
      bg: "bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200/30",
    };
  }

  // ── Core ──
  if (
    m.includes("abs") ||
    m.includes("core") ||
    m.includes("abdominal") ||
    m.includes("oblique")
  ) {
    return {
      text: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950/40 border border-purple-200/30",
    };
  }
  if (m.includes("cardio") || m.includes("heart") || m.includes("full body")) {
    return {
      text: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40 border border-rose-200/30",
    };
  }

  // ── Global Fallback Style (Gray badge) ──
  return {
    text: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-950/40 border border-slate-200/30",
  };
}
