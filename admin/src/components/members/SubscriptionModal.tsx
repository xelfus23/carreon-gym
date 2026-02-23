import React, { useState, useEffect } from "react";
import type { AdminMemberListItem } from "../../types";
import {
    subscriptionService,
    type SubscriptionPlan,
} from "../../services/subscriptionService";

const PAYMENT_METHODS = [
    { value: "cash",          label: "💵 Cash" },
    { value: "gcash",         label: "📱 GCash" },
    { value: "maya",          label: "📱 Maya" },
    { value: "bank_transfer", label: "🏦 Bank Transfer" },
    { value: "card",          label: "💳 Card" },
    { value: "other",         label: "Other" },
];

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
    // Plans
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [plansLoading, setPlansLoading] = useState(true);
    const [plansError, setPlansError] = useState<string | null>(null);

    // Form state
    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [amountOverride, setAmountOverride] = useState<string>("");
    const [customDays, setCustomDays] = useState<string>("1");
    const [method, setMethod] = useState<string>("cash");
    const [referenceNo, setReferenceNo] = useState<string>("");
    const [notes, setNotes] = useState<string>("");

    // Submission
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch plans on mount
    useEffect(() => {
        if (!member) return;
        setPlansLoading(true);
        setPlansError(null);

        subscriptionService
            .getPlans()
            .then((data) => {
                setPlans(data);
                // Default to first non-custom plan
                const defaultPlan = data.find((p) => !p.is_custom);
                if (defaultPlan) {
                    setSelectedPlanId(defaultPlan.id);
                    setAmountOverride(String(defaultPlan.price));
                }
            })
            .catch((e) =>
                setPlansError(e instanceof Error ? e.message : "Failed to load plans"),
            )
            .finally(() => setPlansLoading(false));
    }, [member]);

    if (!member) return null;

    const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;
    const isCustomPlan = selectedPlan?.is_custom ?? false;

    const handlePlanChange = (planId: number) => {
        setSelectedPlanId(planId);
        const plan = plans.find((p) => p.id === planId);
        if (plan && !plan.is_custom) {
            // Pre-fill amount with plan's default price
            setAmountOverride(String(plan.price));
        } else {
            // Custom — clear so admin must enter
            setAmountOverride("");
            setCustomDays("1");
        }
        setError(null);
    };

    const handleCreate = async () => {
        setError(null);

        if (!selectedPlanId) {
            setError("Please select a plan.");
            return;
        }

        const parsedAmount = parseFloat(amountOverride);
        if (isNaN(parsedAmount) || parsedAmount < 0) {
            setError("Please enter a valid amount.");
            return;
        }

        if (isCustomPlan) {
            const parsedDays = parseInt(customDays, 10);
            if (isNaN(parsedDays) || parsedDays <= 0) {
                setError("Please enter a valid number of days for the custom plan.");
                return;
            }
        }

        setLoading(true);
        try {
            await subscriptionService.createSubscription({
                user_id: member.id,
                plan_id: selectedPlanId,
                amount_override: parsedAmount,
                duration_override: isCustomPlan ? parseInt(customDays, 10) : undefined,
                method,
                reference_no: referenceNo.trim() || undefined,
                notes: notes.trim() || undefined,
            });
            onSuccess();
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update subscription");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={onClose}
        >
            <div
                className="bg-surface rounded-2xl border border-border shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <h3 className="text-lg font-bold text-text-primary mb-1">
                    Manage Subscription
                </h3>
                <p className="text-sm text-text-secondary mb-5">
                    {member.first_name} {member.last_name} · {member.email}
                </p>

                {/* Plan loading / error state */}
                {plansLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" />
                    </div>
                ) : plansError ? (
                    <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-xl mb-4">
                        {plansError}
                    </p>
                ) : (
                    <div className="space-y-5">

                        {/* ── Plan selector ── */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                                Plan
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {plans.map((plan) => (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => handlePlanChange(plan.id)}
                                        className={`px-3 py-3 rounded-xl text-sm font-medium border transition-colors text-left ${
                                            selectedPlanId === plan.id
                                                ? "bg-primary-dark text-white border-primary-dark"
                                                : "bg-surface border-border hover:bg-primary/10 text-text-primary"
                                        }`}
                                    >
                                        <p className="font-bold">{plan.name}</p>
                                        {!plan.is_custom && (
                                            <p className={`text-xs mt-0.5 ${
                                                selectedPlanId === plan.id
                                                    ? "text-white/70"
                                                    : "text-text-secondary"
                                            }`}>
                                                ₱{Number(plan.price).toLocaleString()} · {plan.duration_days}d
                                            </p>
                                        )}
                                        {plan.is_custom && (
                                            <p className={`text-xs mt-0.5 ${
                                                selectedPlanId === plan.id
                                                    ? "text-white/70"
                                                    : "text-text-secondary"
                                            }`}>
                                                Set price & days
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Custom duration (only for custom plan) ── */}
                        {isCustomPlan && (
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                                    Duration (days)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={730}
                                    value={customDays}
                                    onChange={(e) => setCustomDays(e.target.value)}
                                    placeholder="e.g. 45"
                                    className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-surface focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        )}

                        {/* ── Amount ── */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                                Amount Collected (₱)
                                {!isCustomPlan && (
                                    <span className="ml-1 text-text-secondary font-normal normal-case tracking-normal">
                                        — override to apply discount
                                    </span>
                                )}
                            </label>
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={amountOverride}
                                onChange={(e) => setAmountOverride(e.target.value)}
                                placeholder={selectedPlan ? `Default: ₱${selectedPlan.price}` : "0.00"}
                                className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-surface focus:ring-2 focus:ring-primary outline-none"
                            />
                        </div>

                        {/* ── Payment method ── */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                                Payment Method
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {PAYMENT_METHODS.map((m) => (
                                    <button
                                        key={m.value}
                                        type="button"
                                        onClick={() => setMethod(m.value)}
                                        className={`px-2 py-2 rounded-xl text-xs font-medium border transition-colors ${
                                            method === m.value
                                                ? "bg-primary-dark text-white border-primary-dark"
                                                : "bg-surface border-border hover:bg-primary/10 text-text-primary"
                                        }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Reference No. (shown for non-cash methods) ── */}
                        {method !== "cash" && (
                            <div>
                                <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                                    Reference No. <span className="font-normal normal-case">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={referenceNo}
                                    onChange={(e) => setReferenceNo(e.target.value)}
                                    placeholder="GCash / bank reference number"
                                    className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-surface focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                        )}

                        {/* ── Notes ── */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
                                Notes <span className="font-normal normal-case">(optional)</span>
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="e.g. Student discount applied"
                                rows={2}
                                className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-surface focus:ring-2 focus:ring-primary outline-none resize-none"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <p className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-xl">
                                {error}
                            </p>
                        )}
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="flex flex-col gap-2 mt-6">
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={loading || plansLoading || !!plansError}
                        className="w-full py-2.5 bg-primary-dark text-white font-semibold rounded-xl hover:bg-primary-dark/90 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Saving…" : "Save Subscription & Record Payment"}
                    </button>
                    <button
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        className="w-full py-2.5 border border-rose-200 text-rose-600 font-semibold rounded-xl hover:bg-rose-50 disabled:opacity-50 transition-colors"
                    >
                        Cancel Subscription
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