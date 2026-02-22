import React, { useState } from "react";
import type { AdminMemberListItem } from "../../types";
import { subscriptionService, type PlanType } from "../../services/subscriptionService";

type DurationPreset = "1_day" | "1_week" | "1_month" | "custom";

interface SubscriptionModalProps {
    member: AdminMemberListItem | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function SubscriptionModal({
    member,
    onClose,
    onSuccess,
}: SubscriptionModalProps) {
    const [preset, setPreset] = useState<DurationPreset>("1_month");
    const [customDays, setCustomDays] = useState<string>("30");
    const [planName, setPlanName] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!member) return null;

    const handleCreate = async () => {
        setError(null);
        setLoading(true);
        try {
            const durationDays =
                preset === "custom"
                    ? Math.max(1, Math.min(365, parseInt(customDays, 10) || 1))
                    : undefined;
            await subscriptionService.createSubscription({
                user_id: member.id,
                planType: preset === "custom" ? undefined : (preset as PlanType),
                durationDays: preset === "custom" ? durationDays : undefined,
                planName: planName.trim() || undefined,
            });
            onSuccess();
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update subscription");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!confirm(`Cancel subscription for ${member.first_name} ${member.last_name}?`)) return;
        setError(null);
        setLoading(true);
        try {
            await subscriptionService.cancelSubscription(member.id);
            onSuccess();
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to cancel subscription");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
            <div
                className="bg-surface rounded-2xl border border-border shadow-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold text-text-primary mb-1">
                    Manage subscription
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                    {member.first_name} {member.last_name} · {member.email}
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                            Duration
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["1_day", "1_week", "1_month"] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPreset(p)}
                                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                                        preset === p
                                            ? "bg-primary-dark text-white border-primary-dark"
                                            : "bg-surface border-border hover:bg-primary/10"
                                    }`}
                                >
                                    {p === "1_day" ? "1 Day" : p === "1_week" ? "1 Week" : "1 Month"}
                                </button>
                            ))}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setPreset("custom")}
                                className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                                    preset === "custom"
                                        ? "bg-primary-dark text-white border-primary-dark"
                                        : "bg-surface border-border hover:bg-primary/10"
                                }`}
                            >
                                Custom
                            </button>
                            {preset === "custom" && (
                                <input
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={customDays}
                                    onChange={(e) => setCustomDays(e.target.value)}
                                    className="w-20 px-3 py-2 border border-border rounded-xl text-sm bg-surface"
                                />
                            )}
                            {preset === "custom" && (
                                <span className="text-xs text-text-secondary">days</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                            Plan name (optional)
                        </label>
                        <input
                            type="text"
                            value={planName}
                            onChange={(e) => setPlanName(e.target.value)}
                            placeholder="e.g. Premium Monthly"
                            className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-surface focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">
                            {error}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-2 mt-6">
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full py-2.5 bg-primary-dark text-white font-semibold rounded-xl hover:bg-primary-dark/90 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Saving…" : "Save subscription"}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancelSubscription}
                        disabled={loading}
                        className="w-full py-2.5 border border-rose-200 text-rose-600 font-semibold rounded-xl hover:bg-rose-50 disabled:opacity-50 transition-colors"
                    >
                        Cancel subscription
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2 text-text-secondary text-sm hover:text-text-primary"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
