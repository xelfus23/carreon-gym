import React from "react";
import {
  CATEGORIES,
  getMuscleStyle,
  MUSCLE_GROUPS,
  type FormState,
} from "./equipmentConstants";

// ─── Equipment Form ───────────────────────────────────────────────────────────

export function EquipmentForm({
  form,
  setForm,
  error,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  error: string | null;
}) {
  const toggleMuscle = (m: string) =>
    setForm((f) => ({
      ...f,
      target_muscles: f.target_muscles.includes(m)
        ? f.target_muscles.filter((x) => x !== m)
        : [...f.target_muscles, m],
    }));

  const inputClass =
    "w-full bg-background border border-border px-3 py-2 text-text-primary text-sm outline-none transition-colors duration-150 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 placeholder:text-text-secondary/50";
  const labelClass =
    "block text-xs font-bold tracking-widest uppercase text-text-secondary mb-1.5";

  return (
    <>
      {/* Name */}
      <div>
        <label className={labelClass}>Equipment Name *</label>
        <input
          className={inputClass}
          placeholder="e.g. Leg Press"
          value={form.equipment_name}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              equipment_name: e.target.value,
            }))
          }
        />
      </div>

      {/* Category */}
      <div>
        <label className={labelClass}>Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const active = form.category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setForm((f) => ({ ...f, category: cat }))}
                className={`px-3 py-1 text-xs font-semibold border transition-all duration-150 cursor-pointer
                                    ${
                                      active
                                        ? "bg-primary/10 border-primary/50 text-primary"
                                        : "bg-transparent border-border text-text-secondary hover:text-text-primary hover:border-border/80"
                                    }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Muscle Groups */}
      <div>
        <label className={labelClass}>Target Muscles *</label>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((m) => {
            const active = form.target_muscles.includes(m);
            const s = getMuscleStyle(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleMuscle(m)}
                className={`px-3 py-1 text-xs font-semibold border transition-all duration-150 cursor-pointer
                                    ${
                                      active
                                        ? `${s.text} ${s.bg} ${s.border}`
                                        : "bg-transparent border-border text-text-secondary hover:border-border/80 hover:text-text-primary"
                                    }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description</label>
        <textarea
          rows={3}
          className={`${inputClass} resize-none leading-relaxed`}
          placeholder="Brief description of the equipment..."
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
        />
      </div>

      {/* Quantity */}
      <div>
        <label className={labelClass}>Quantity</label>
        <input
          type="number"
          min={1}
          className={`${inputClass} w-24`}
          value={form.quantity}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              quantity: Math.max(1, Number(e.target.value)),
            }))
          }
        />
      </div>

      {/* Inline error */}
      {error && (
        <div className="flex items-center gap-2 bg-danger/8 border border-danger/30 px-3.5 py-2.5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ff3b3b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}
    </>
  );
}
