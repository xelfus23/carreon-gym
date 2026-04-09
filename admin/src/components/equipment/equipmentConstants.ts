// ─── Equipment Constants ───────────────────────────────────────────────────────

export const CATEGORIES = ["Free Weight", "Machine", "Accessory", "Cardio"];

export const MUSCLE_GROUPS = [
    "Chest",
    "Back",
    "Legs",
    "Shoulders",
    "Arms",
    "Core",
    "Cardio",
];

export const MUSCLE_STYLE: Record<
    string,
    { text: string; bg: string; border: string }
> = {
    chest: {
        text: "text-red-400",
        bg: "bg-red-400/10",
        border: "border-red-400/40",
    },
    back: {
        text: "text-teal-400",
        bg: "bg-teal-400/10",
        border: "border-teal-400/40",
    },
    legs: {
        text: "text-yellow-300",
        bg: "bg-yellow-300/10",
        border: "border-yellow-300/40",
    },
    shoulders: {
        text: "text-violet-400",
        bg: "bg-violet-400/10",
        border: "border-violet-400/40",
    },
    arms: {
        text: "text-pink-400",
        bg: "bg-pink-400/10",
        border: "border-pink-400/40",
    },
    core: {
        text: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/40",
    },
    cardio: {
        text: "text-blue-400",
        bg: "bg-blue-400/10",
        border: "border-blue-400/40",
    },
    default: {
        text: "text-gray-400",
        bg: "bg-gray-400/10",
        border: "border-gray-400/40",
    },
};

export const getMuscleStyle = (muscle: string) =>
    MUSCLE_STYLE[muscle.toLowerCase().trim()] ?? MUSCLE_STYLE.default;

export type FormState = {
    equipment_name: string;
    category: string;
    target_muscles: string[];
    description: string;
    quantity: number;
};

export const EMPTY_FORM: FormState = {
    equipment_name: "",
    category: CATEGORIES[0],
    target_muscles: [],
    description: "",
    quantity: 1,
};
