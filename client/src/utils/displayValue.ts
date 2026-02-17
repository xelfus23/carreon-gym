export const displayValue = (value: any, fallback = "N/A") => {
    if (value === null || value === undefined || value === "") return fallback;
    return String(value);
};
