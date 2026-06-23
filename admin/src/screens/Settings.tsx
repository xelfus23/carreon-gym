import { useState, useEffect } from "react";
import { useGymDetails } from "../hooks/useGymDetails";
import { gymDetailService } from "../services/gymDetails.service";
import {
  Loader2,
  RefreshCw,
  Settings as Sett,
  Building2,
  MapPin,
  Phone,
  Mail,
  Wallet,
  User,
  Check,
} from "lucide-react";
import type { gymDetailsProps } from "../types";

// Field metadata: groups related inputs and carries display info per key
interface FieldConfig {
  key: keyof gymDetailsProps;
  label: string;
  icon: typeof Building2;
  type: "text" | "tel" | "email";
  placeholder: string;
}

const GYM_INFO_FIELDS: FieldConfig[] = [
  { key: "gym_name", label: "Gym name", icon: Building2, type: "text", placeholder: "e.g. Iron Forge Fitness" },
  { key: "address", label: "Address", icon: MapPin, type: "text", placeholder: "Street, city, province" },
  { key: "contact_number", label: "Contact number", icon: Phone, type: "tel", placeholder: "09XX XXX XXXX" },
  { key: "email", label: "Email address", icon: Mail, type: "email", placeholder: "gym@example.com" },
];

const PAYMENT_FIELDS: FieldConfig[] = [
  { key: "gcash_number", label: "GCash number", icon: Phone, type: "tel", placeholder: "09XX XXX XXXX" },
  { key: "gcash_name", label: "GCash account name", icon: User, type: "text", placeholder: "Registered account name" },
];

function FieldGroup({
  title,
  description,
  icon: GroupIcon,
  fields,
  formValue,
  onChange,
}: {
  title: string;
  description: string;
  icon: typeof Building2;
  fields: FieldConfig[];
  formValue: Partial<gymDetailsProps>;
  onChange: (key: keyof gymDetailsProps, value: string) => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <div className="flex items-start gap-3 pb-4 mb-4 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <GroupIcon className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-text-primary text-sm">{title}</h2>
          <p className="text-xs text-text-secondary mt-0.5">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map(({ key, label, icon: FieldIcon, type, placeholder }) => (
          <div className="flex flex-col gap-1.5" key={key}>
            <label htmlFor={key} className="font-medium text-text-secondary text-xs">
              {label}
            </label>
            <div className="relative">
              <FieldIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
              <input
                id={key}
                type={type}
                placeholder={placeholder}
                className="w-full border border-border bg-background pl-9 pr-3 py-2.5 rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                value={(formValue[key] as string) || ""}
                onChange={(e) => onChange(key, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const { gymDetails, isLoading, refresh, error } = useGymDetails();

  const [formValue, setFormValue] = useState<Partial<gymDetailsProps>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (gymDetails) {
      setFormValue(gymDetails);
      console.log(gymDetails)
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
      setJustSaved(true);
      refresh(); // Get fresh data from the server
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      alert("Update failed. Please try again.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Loader2 size={26} className="animate-spin text-primary stroke-primary" />
        <p className="text-text-secondary animate-pulse">Loading gym settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-md">
        <p className="text-danger font-medium">Couldn't load settings</p>
        <p className="text-text-secondary text-sm mt-1">{error}</p>
        <button
          onClick={refresh}
          className="mt-3 text-sm font-bold text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div className="py-4 flex flex-wrap gap-3 items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-text-primary">
          <Sett className="text-primary" /> {gymDetails?.gym_name} Settings
        </h1>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={refresh}
            aria-label="Refresh settings"
            className="flex rounded-full cursor-pointer items-center justify-center gap-2 p-2 border border-border bg-surface text-text-primary text-sm font-bold hover:bg-border transition-all active:scale-90"
          >
            <RefreshCw className="text-text-secondary" size={14} />
          </button>
        </div>
      </div>

      {/* ── FIELD GROUPS ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <FieldGroup
          title="Gym Information"
          description="Shown to members and on receipts"
          icon={Building2}
          fields={GYM_INFO_FIELDS}
          formValue={formValue}
          onChange={handleChange}
        />

        <FieldGroup
          title="GCash Payment Details"
          description="Used for member subscription payments"
          icon={Wallet}
          fields={PAYMENT_FIELDS}
          formValue={formValue}
          onChange={handleChange}
        />
      </div>

      {/* ── SAVE ACTION ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-5 py-2.5 rounded-lg cursor-pointer active:scale-95 text-background font-semibold text-sm transition-all disabled:cursor-not-allowed flex items-center gap-2 ${
            isSaving ? "bg-text-secondary/40" : "bg-primary hover:bg-primary-dark"
          }`}
        >
          {isSaving && <Loader2 size={14} className="animate-spin" />}
          {isSaving ? "Saving..." : "Save changes"}
        </button>

        {justSaved && (
          <span className="flex items-center gap-1.5 text-sm text-primary font-medium">
            <Check size={16} /> Saved
          </span>
        )}
      </div>
    </div>
  );
}