import { useState, useEffect } from "react";
import { useGymDetails } from "../hooks/useGymDetails";
import { gymDetailService } from "../services/gymDetails.service";
import { Loader2, Settings } from "lucide-react";
import type { gymDetailsProps } from "../types";

export default function GymSettings() {
  const { gymDetails, isLoading, refresh, error } = useGymDetails();

  const [formValue, setFormValue] = useState<Partial<gymDetailsProps>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (gymDetails) {
      setFormValue(gymDetails);
    }
  }, [gymDetails]);

  const handleChange = (key: keyof gymDetailsProps, value: string) => {
    setFormValue((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await gymDetailService.updateGymDetails(formValue);
      alert("Settings updated successfully!");
      refresh(); // Get fresh data from the server
    } catch (err) {
      alert("Update failed. Please try again.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p className="p-6">Loading settings...</p>;
  if (error) return <p className="p-6 text-red-500">Error: {error}</p>;

  // Type-safe keys for our map
  const editableKeys: (keyof gymDetailsProps)[] = [
    "gym_name",
    "address",
    "contact_number",
    "email",
    "gcash_number",
    "gcash_name",
    "maya_number",
  ];


  if (isLoading)
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Loader2
          size={26}
          className="animate-spin text-primary stroke-primary"
        />
        <p className="text-text-secondary animate-pulse">
          Loading equipment records...
        </p>
      </div>
    );


  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="text-primary" /> {gymDetails?.gym_name}{" "}
          Settings
        </h1>
        <div className="flex items-center gap-2 ml-auto">
          {!isLoading && (
            <button
              onClick={refresh}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border
                                           text-text-secondary text-xs font-semibold uppercase tracking-wider
                                           hover:border-primary/40 hover:text-primary transition-all duration-150"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Refresh
            </button>
          )}
        </div>
      </div>

      <div className="max-w-md">
        <div className="space-y-4">
          {editableKeys.map((key) => (
            <div className="flex flex-col space-y-1" key={key}>
              <label className="capitalize font-medium text-text-secondary text-sm">
                {key.replace("_", " ")}
              </label>
              <input
                className="border border-border p-2 rounded focus:ring-2 text-text-primary focus:ring-primary outline-none transition-all"
                // Use type assertion or optional chaining to safely access keys
                value={(formValue[key] as string) || ""}
                onChange={(e) =>
                  handleChange(key, e.target.value)
                }
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`mt-6 w-full py-2 rounded text-background font-semibold transition-colors ${isSaving
            ? "bg-gray-400"
            : "bg-primary hover:bg-primary-dark"
            }`}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
