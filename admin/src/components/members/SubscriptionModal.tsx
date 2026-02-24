import React, { useState, useEffect } from "react";
import type { AdminMemberListItem } from "../../types";
import {
    subscriptionService,
    type SubscriptionPlan,
} from "../../services/subscriptionService";

const PAYMENT_METHODS = [
    { value: "cash",          label: "Cash",  icon: "💵" },
    { value: "gcash",         label: "GCash", icon: "📱" },
    { value: "maya",          label: "Maya",  icon: "💜" },
    { value: "bank_transfer", label: "Bank",  icon: "🏦" },
    { value: "card",          label: "Card",  icon: "💳" },
    { value: "other",         label: "Other", icon: "···" },
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
    const [plans, setPlans]               = useState<SubscriptionPlan[]>([]);
    const [plansLoading, setPlansLoading] = useState(true);
    const [plansError, setPlansError]     = useState<string | null>(null);

    const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
    const [amountOverride, setAmountOverride] = useState<string>("");
    const [customDays, setCustomDays]         = useState<string>("1");
    const [method, setMethod]                 = useState<string>("cash");
    const [referenceNo, setReferenceNo]       = useState<string>("");
    const [notes, setNotes]                   = useState<string>("");

    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    useEffect(() => {
        if (!member) return;
        setPlansLoading(true);
        setPlansError(null);

        subscriptionService
            .getPlans()
            .then((data) => {
                setPlans(data);
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
    const parsedAmount = parseFloat(amountOverride);
    const hasDiscount  =
        !isCustomPlan &&
        selectedPlan &&
        amountOverride !== "" &&
        !isNaN(parsedAmount) &&
        parsedAmount !== Number(selectedPlan.price);

    const handlePlanChange = (planId: number) => {
        setSelectedPlanId(planId);
        const plan = plans.find((p) => p.id === planId);
        if (plan && !plan.is_custom) {
            setAmountOverride(String(plan.price));
        } else {
            setAmountOverride("");
            setCustomDays("1");
        }
        setError(null);
    };

    const handleCreate = async () => {
        setError(null);
        if (!selectedPlanId) { setError("Please select a plan."); return; }
        if (isNaN(parsedAmount) || parsedAmount < 0) { setError("Please enter a valid amount."); return; }
        if (isCustomPlan) {
            const d = parseInt(customDays, 10);
            if (isNaN(d) || d <= 0) { setError("Please enter a valid number of days."); return; }
        }

        setLoading(true);
        try {
            await subscriptionService.createSubscription({
                user_id:           member.id,
                plan_id:           selectedPlanId,
                amount_override:   parsedAmount,
                duration_override: isCustomPlan ? parseInt(customDays, 10) : undefined,
                method,
                reference_no: referenceNo.trim() || undefined,
                notes:        notes.trim() || undefined,
            });
            onSuccess();
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Failed to update subscription");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelSub = async () => {
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
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-surface w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl border border-border shadow-2xl flex flex-col max-h-[92vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar: uses primary color as accent */}
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-black text-primary tracking-tight">
                                {member.first_name[0]}{member.last_name[0]}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-text-primary leading-tight truncate">
                                {member.first_name} {member.last_name}
                            </h3>
                            <p className="text-xs text-text-secondary truncate">{member.email}</p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-text-secondary hover:bg-border hover:text-text-primary transition-colors flex-shrink-0 ml-4"
                    >
                        <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M1 1l10 10M11 1L1 11"/>
                        </svg>
                    </button>
                </div>

                {/* ── Scrollable body ─────────────────────────────────────── */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
                    {plansLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            {/* Spinner uses primary color */}
                            <div className="w-8 h-8 border-[3px] border-border border-t-primary rounded-full animate-spin" />
                            <p className="text-xs text-text-secondary">Loading plans…</p>
                        </div>
                    ) : plansError ? (
                        <ErrorBanner message={plansError} />
                    ) : (
                        <>
                            {/* ── Plan grid ── */}
                            <section>
                                <SectionLabel>Select Plan</SectionLabel>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {plans.map((plan) => {
                                        const active = selectedPlanId === plan.id;
                                        return (
                                            <button
                                                key={plan.id}
                                                type="button"
                                                onClick={() => handlePlanChange(plan.id)}
                                                className={`relative px-4 py-3.5 rounded-2xl text-left border transition-all duration-150 ${
                                                    active
                                                        // Selected: primary green background
                                                        ? "bg-primary text-background border-primary shadow-md"
                                                        // Unselected: surface with border, primary tint on hover
                                                        : "bg-background border-border hover:border-primary/40 hover:bg-primary/5"
                                                }`}
                                            >
                                                {/* Checkmark badge */}
                                                {active && (
                                                    <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-background/20 rounded-full flex items-center justify-center">
                                                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-background">
                                                            <path d="M1 3l2 2 4-4"/>
                                                        </svg>
                                                    </span>
                                                )}
                                                <p className={`text-sm font-bold leading-tight ${
                                                    active ? "text-background" : "text-text-primary"
                                                }`}>
                                                    {plan.name}
                                                </p>
                                                <p className={`text-xs mt-1 ${
                                                    active ? "text-background/70" : "text-text-secondary"
                                                }`}>
                                                    {plan.is_custom
                                                        ? "Custom price & duration"
                                                        : `₱${Number(plan.price).toLocaleString()} · ${plan.duration_days}d`
                                                    }
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* ── Custom duration ── */}
                            {isCustomPlan && (
                                <section>
                                    <SectionLabel>Duration</SectionLabel>
                                    <div className="relative mt-2">
                                        <input
                                            type="number"
                                            min={1} max={730}
                                            value={customDays}
                                            onChange={(e) => setCustomDays(e.target.value)}
                                            placeholder="e.g. 45"
                                            className="w-full pl-4 pr-14 py-3 border border-border rounded-2xl text-sm bg-background text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-secondary pointer-events-none">
                                            days
                                        </span>
                                    </div>
                                </section>
                            )}

                            {/* ── Amount ── */}
                            <section>
                                <div className="flex items-center justify-between">
                                    <SectionLabel>Amount Collected</SectionLabel>
                                    {!isCustomPlan && selectedPlan && (
                                        <button
                                            type="button"
                                            onClick={() => setAmountOverride(String(selectedPlan.price))}
                                            className="text-[10px] font-semibold text-primary hover:text-primary-dark transition-colors mb-2"
                                        >
                                            Reset to ₱{Number(selectedPlan.price).toLocaleString()}
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-text-secondary pointer-events-none select-none">
                                        ₱
                                    </span>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        value={amountOverride}
                                        onChange={(e) => setAmountOverride(e.target.value)}
                                        placeholder={selectedPlan ? String(selectedPlan.price) : "0.00"}
                                        className="w-full pl-8 pr-4 py-3 border border-border rounded-2xl text-sm bg-background text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                {hasDiscount && (
                                    <p className="flex items-center gap-1.5 text-[11px] text-amber-400 mt-2">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                            <path fillRule="evenodd" d="M6 1a5 5 0 100 10A5 5 0 006 1zm0 3a.75.75 0 01.75.75v2a.75.75 0 01-1.5 0v-2A.75.75 0 016 4zm0 5.5a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
                                        </svg>
                                        Adjusted amount — discount or override applied
                                    </p>
                                )}
                            </section>

                            {/* ── Payment method ── */}
                            <section>
                                <SectionLabel>Payment Method</SectionLabel>
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                    {PAYMENT_METHODS.map((m) => {
                                        const active = method === m.value;
                                        return (
                                            <button
                                                key={m.value}
                                                type="button"
                                                onClick={() => setMethod(m.value)}
                                                className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border text-xs font-semibold transition-all duration-150 ${
                                                    active
                                                        ? "bg-primary border-primary text-background"
                                                        : "bg-background border-border text-text-secondary hover:border-primary/40 hover:text-text-primary"
                                                }`}
                                            >
                                                <span className="text-base leading-none">{m.icon}</span>
                                                <span>{m.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* ── Reference No. ── */}
                            {method !== "cash" && (
                                <section>
                                    <SectionLabel optional>Reference No.</SectionLabel>
                                    <input
                                        type="text"
                                        value={referenceNo}
                                        onChange={(e) => setReferenceNo(e.target.value)}
                                        placeholder="GCash / bank reference number"
                                        className="mt-2 w-full px-4 py-3 border border-border rounded-2xl text-sm bg-background text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    />
                                </section>
                            )}

                            {/* ── Notes ── */}
                            <section>
                                <SectionLabel optional>Notes</SectionLabel>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="e.g. Student discount, promo code used…"
                                    rows={2}
                                    className="mt-2 w-full px-4 py-3 border border-border rounded-2xl text-sm bg-background text-text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                                />
                            </section>

                            {/* ── Error ── */}
                            {error && <ErrorBanner message={error} />}
                        </>
                    )}
                </div>

                {/* ── Footer ──────────────────────────────────────────────── */}
                <div className="px-6 pb-6 pt-4 border-t border-border flex-shrink-0 space-y-2">
                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={loading || plansLoading || !!plansError}
                        className="w-full py-3 bg-primary hover:bg-primary-dark active:scale-[0.99] text-background font-bold rounded-2xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                                Saving…
                            </>
                        ) : (
                            <>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M7 1v12M1 7h12"/>
                                </svg>
                                Save & Record Payment
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleCancelSub}
                        disabled={loading}
                        className="w-full py-2.5 border border-danger/25 text-danger font-semibold rounded-2xl hover:bg-danger/8 hover:border-danger/40 disabled:opacity-50 transition-all text-sm"
                    >
                        Cancel Subscription
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function SectionLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
    return (
        <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary flex items-center gap-1">
            {children}
            {optional && (
                <span className="font-normal normal-case tracking-normal text-text-secondary/50">
                    (optional)
                </span>
            )}
        </p>
    );
}

function ErrorBanner({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-3 bg-danger/10 border border-danger/20 rounded-2xl px-4 py-3">
            <span className="text-danger flex-shrink-0 mt-px text-sm">⚠</span>
            <p className="text-sm text-danger leading-snug">{message}</p>
        </div>
    );
}