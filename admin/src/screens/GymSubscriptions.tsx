import { useEffect, useMemo, useRef, useState } from "react";
import { useGymSubs } from "../hooks/useGymSubs";
import ConfirmDialog from "../components/members/ConfirmDialog";
import {
  Search,
  Calendar,
  Dumbbell,
  Plus,
  RotateCcw,
  Zap,
  Users,
  Layers,
  CheckCircle,
  EllipsisVertical,
} from "lucide-react";

export default function GymSubscriptionsAdmin() {
  const { membership, classes, addOns, personalTrainer, isLoading, refresh, formatCurrency } = useGymSubs();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    variant: "warning" | "danger";
    onConfirm: () => void;
  } | null>(null);

  const menuWrapRef = useRef<HTMLDivElement | null>(null);
  const PAGE_SIZE = 10;

  const allPlans = useMemo(() => {
    return [...(membership || []), ...(classes || []), ...(personalTrainer || []), ...(addOns || [])];
  }, [membership, classes, personalTrainer, addOns]);

  const filteredPlans = useMemo(() => {
    return allPlans.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [allPlans, search]);

  const paginated = filteredPlans.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filteredPlans.length / PAGE_SIZE) || 1;

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (menuWrapRef.current && !menuWrapRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  if (isLoading) return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-text-secondary animate-pulse">Loading system records...</p>
    </div>
  );


  return (
    <div className="relative space-y-6 pb-10">
      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight">
            <Dumbbell className="text-primary" size={28} /> Subscription Manager
          </h1>
          <p className="text-text-secondary text-sm mt-1">Manage and configure Careon Gym plan offerings</p>
        </div>

        <div className="flex gap-2">
          <button onClick={refresh} className="flex items-center justify-center gap-2 px-4 py-2 border border-border bg-surface text-text-primary text-sm font-bold hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-95 shadow-sm">
            <RotateCcw size={16} /> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-bold text-sm shadow-sm hover:opacity-90 active:scale-95 transition-all uppercase italic">
            <Plus size={18} /> Create New Plan
          </button>
        </div>
      </div>

      {/* ── Stats Grid (Identical to Transaction Stats) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Plans", value: allPlans.length, icon: <Layers size={16} />, color: "border-primary/20 bg-primary/5 text-primary" },
          { label: "Memberships", value: membership?.length || 0, icon: <Zap size={16} />, color: "border-blue-500/20 bg-blue-500/5 text-blue-500" },
          { label: "Class Tiers", value: classes?.length || 0, icon: <Dumbbell size={16} />, color: "border-amber-500/20 bg-amber-500/5 text-amber-500" },
          { label: "PT Sessions", value: personalTrainer?.length || 0, icon: <Users size={16} />, color: "border-purple-500/20 bg-purple-500/5 text-purple-500" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className={`p-5 border ${color} shadow-sm flex flex-col justify-between`}>
            <div className="flex items-center justify-between opacity-80">
              <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
              {icon}
            </div>
            <p className="text-3xl font-black mt-2 tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Table Container ── */}
      <div ref={menuWrapRef} className="bg-surface border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border bg-surface/50 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search plan name or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="px-3 py-1 bg-border/50">
            <span className="text-xs font-bold text-text-secondary uppercase">{filteredPlans.length} Results</span>
          </div>
        </div>

        <div className="overflow-x-auto h-[500px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface text-text-secondary font-bold text-[11px] uppercase tracking-wider border-b border-border">
                <th className="px-6 py-4 text-left">Plan Name</th>
                <th className="px-6 py-4 text-left">Category</th>
                <th className="px-6 py-4 text-left">Duration</th>
                <th className="px-6 py-4 text-left">Price</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginated.map((plan) => (
                <tr key={plan.id} className="hover:bg-border/10 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-sm tracking-tight text-text-primary">{plan.name}</p>
                    <p className="text-xs text-text-secondary line-clamp-1">{plan.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-black tracking-tighter ${plan.category === 'membership' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                      }`}>
                      {plan.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Calendar size={14} className="text-text-secondary" />
                      {plan.duration_days} {plan.duration_days > 1 ? "Days" : "Day"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-text-secondary">
                    {formatCurrency(plan.price)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-emerald-500 text-[11px] font-black">
                      <CheckCircle size={14} /> Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-flex">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === plan.id ? null : plan.id)}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-border/50 transition-colors"
                      >
                        <EllipsisVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Modern Pagination Footer (Identical) ── */}
        <div className="px-5 py-3 border-t border-border bg-surface/60 flex items-center justify-between">
          <span className="text-xs text-text-secondary">Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-semibold border border-border bg-surface hover:bg-border text-text-primary disabled:opacity-40 transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-semibold border border-border bg-surface hover:bg-border text-text-primary disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => { setConfirmDialog(null); setOpenMenuId(null); }}
        />
      )}
    </div>
  );
}