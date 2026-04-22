import { useMemo, useState } from "react";
import { formatAttemptReason, useAttendanceLog } from "../hooks/useAttendance";
import { useMember } from "../hooks/useMember";
import { memberService } from "../services/member.service";
import {
  Search,
  Clock,
  Calendar,
  Logs,
  RotateCcw,
  Users,
  Activity,
  Timer,
  AlertTriangle,
} from "lucide-react";

export default function AttendanceLog() {
  const {
    logs,
    attempts,
    isLoading,
    formatDate,
    formatTime,
    refresh,
    latestFailureAlert,
    clearFailureAlert,
  } = useAttendanceLog();
  const { members } = useMember();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedMemberId, setSelectedMemberId] = useState<number | "">("");
  const [manualAction, setManualAction] = useState<"check_in" | "check_out">("check_in");
  const [manualStatus, setManualStatus] = useState<string | null>(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const PAGE_SIZE = 50;

  const handleManualAttendance = async () => {
    if (!selectedMemberId) {
      setManualStatus("Please select a member.");
      return;
    }

    setManualStatus(null);
    setIsSubmittingManual(true);
    try {
      await memberService.manualAttendance({
        userId: Number(selectedMemberId),
        action: manualAction,
      });
      setManualStatus(
        manualAction === "check_in"
          ? "Manual check-in logged."
          : "Manual check-out logged.",
      );
      refresh(true);
    } catch (err) {
      if (err instanceof Error) {
        setManualStatus(err.message);
      } else {
        setManualStatus("Failed to log manual attendance.");
      }
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // --- Helper Function to Format Duration ---
  const formatDuration = (totalMinutes: number) => {
    if (!totalMinutes || totalMinutes <= 0) return "--";

    let seconds = Math.floor(totalMinutes * 60);

    const days = Math.floor(seconds / (24 * 3600));
    seconds %= 24 * 3600;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
    if (minutes > 0)
      parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
    if (secs > 0 || parts.length === 0)
      parts.push(`${secs} second${secs !== 1 ? "s" : ""}`);

    return parts.join(", ");
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(
      (log) =>
        `${log.first_name} ${log.last_name}`
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        log.method.toLowerCase().includes(search.toLowerCase()),
    );
  }, [logs, search]);

  const failedAttempts = useMemo(
    () => attempts.filter((attempt) => attempt.result === "failed"),
    [attempts],
  );

  const stats = useMemo(
    () => ({
      total: logs.length,
      activeNow: logs.filter((l) => l.status === "checked_in").length,
      avgDuration: logs.length
        ? logs.reduce((acc, curr) => acc + (curr.duration || 0), 0) /
        logs.length
        : 0,
    }),
    [logs],
  );

  const paginated = filteredLogs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;

  if (isLoading)
    return (
      <div className="p-8 text-center text-text-secondary">
        Loading logs...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* ── Stats bar ── */}


      {/* ── Header Section ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight">
            <Logs className="text-primary" size={28} /> Attendance Log
          </h1>
          <p className="text-text-secondary text-sm mt-1">Manage and view Carreon Gym Attendance Log</p>
        </div>

        <button
          onClick={() => refresh(false)}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-border bg-surface text-text-primary text-sm font-bold hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-95 shadow-sm"
        >
          <RotateCcw size={16} />
          Refresh Data
        </button>
      </div>

      <div className="border border-border bg-surface p-4 flex flex-col md:flex-row md:items-end gap-3">
        <div className="flex-1">
          <label className="text-xs text-text-secondary font-semibold uppercase tracking-wide">
            Member
          </label>
          <select
            value={selectedMemberId}
            onChange={(e) =>
              setSelectedMemberId(e.target.value ? Number(e.target.value) : "")
            }
            className="mt-1 w-full px-3 py-2 bg-surface border border-border text-sm text-text-primary focus:ring-2 focus:ring-primary outline-none cursor-pointer"
          >
            <option value="">Select member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.first_name} {m.last_name} ({m.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-text-secondary font-semibold uppercase tracking-wide">
            Action
          </label>
          <select
            value={manualAction}
            onChange={(e) => setManualAction(e.target.value as "check_in" | "check_out")}
            className="mt-1 px-3 py-2 bg-surface border border-border text-sm text-text-primary focus:ring-2 focus:ring-primary outline-none cursor-pointer"
          >
            <option value="check_in">Check In</option>
            <option value="check_out">Check Out</option>
          </select>
        </div>

        <button
          onClick={handleManualAttendance}
          disabled={isSubmittingManual}
          className="px-4 py-2 bg-primary text-background text-sm font-semibold disabled:opacity-50"
        >
          {isSubmittingManual ? "Saving..." : "Log Attendance"}
        </button>
      </div>
      {manualStatus && <p className="text-sm text-text-secondary">{manualStatus}</p>}


      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Visits",
            value: stats.total,
            color: "border-slate-500/20 bg-slate-500/5 text-slate-500",
            icon: <Users size={16} />
          },
          {
            label: "Currently In",
            value: stats.activeNow,
            color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500",
            icon: <Activity size={16} />
          },
          {
            label: "Avg Session",
            // Using the formatter for the stats bar too
            value: formatDuration(stats.avgDuration),
            color: "border-indigo-500/20 bg-indigo-500/5 text-indigo-500",
            icon: <Timer size={16} />
          },
          {
            label: "Error Log",
            value: failedAttempts.length,
            color: "border-red-400/20 bg-red-400/5 text-red-400",
            icon: <AlertTriangle size={16} />
          },
        ].map(({ label, value, color, icon }) => (
          <div
            key={label}
            className={`p-5 border ${color} shadow-sm flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between opacity-80">
              <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
              {icon}
            </div>
            <p className="text-3xl font-black mt-2 tabular-nums">{value}</p>
          </div>
        ))}
      </div>


      {latestFailureAlert && (
        <div className="px-4 py-3 border border-rose-300 bg-rose-50 text-rose-700 flex items-center justify-between">
          <p className="text-sm font-semibold">
            Failed {latestFailureAlert.action.replace("_", " ")}{" "}
            scan detected: {latestFailureAlert.last_name} (
            {formatAttemptReason(latestFailureAlert.reason)})
          </p>
          <button
            onClick={clearFailureAlert}
            className="text-xs font-bold uppercase tracking-wide hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Main Table Card ── */}
      <div className="bg-surface border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-surface flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
              <Search size={14} />
            </span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search member name..."
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none text-text-primary"
            />
          </div>
          <span className="text-xs text-text-secondary font-medium">
            {filteredLogs.length} Records Found
          </span>
        </div>

        <div className="overflow-x-auto h-[500px]">
          <table className="text-left text-sm w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface text-text-primary font-bold uppercase tracking-wider border-b border-border">
                <th className="px-5 py-3.5 text-xs">Date</th>
                <th className="px-5 py-3.5 text-xs">Member</th>
                <th className="px-5 py-3.5 text-xs">
                  Check In
                </th>
                <th className="px-5 py-3.5 text-xs">
                  Check Out
                </th>
                <th className="px-5 py-3.5 text-xs">
                  Duration
                </th>
                <th className="px-5 py-3.5 text-xs">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginated.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-border/30 transition-colors"
                >
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar
                        size={14}
                        className="text-text-secondary"
                      />
                      <span className="font-medium">
                        {formatDate(log.check_in_time)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-bold text-text-primary">
                    {log.first_name} {log.last_name}
                  </td>
                  <td className="px-5 py-4 text-emerald-500 font-medium">
                    {formatTime(log.check_in_time)}
                  </td>
                  <td className="px-5 py-4 text-rose-500 font-medium">
                    {log.check_out_time ? (
                      formatTime(log.check_out_time)
                    ) : (
                      <span className="flex items-center gap-1 opacity-50 italic">
                        <Clock size={12} /> Active
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap font-mono text-xs">
                    {/* Applied the new formatter here */}
                    {formatDuration(log.duration!)}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase">
                      {log.method}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-border bg-surface/60 flex items-center justify-between">
          <span className="text-xs text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-border disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-border disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-surface">
          <h2 className="text-lg font-bold text-rose-600">
            Error Log
          </h2>
          <p className="text-xs text-text-secondary mt-1">
            Shows failed QR scans like no subscription, invalid QR,
            or duplicate check-in.
          </p>
        </div>

        <div className="overflow-x-auto h-[500px]">
          <table className="text-left text-sm w-full">
            <thead>
              <tr className="bg-surface text-text-primary font-bold uppercase tracking-wider border-b border-border">
                <th className="px-5 py-3.5 text-xs">Time</th>
                <th className="px-5 py-3.5 text-xs">Member</th>
                <th className="px-5 py-3.5 text-xs">Action</th>
                <th className="px-5 py-3.5 text-xs">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {failedAttempts.slice(0, 50).map((attempt) => (
                <tr
                  key={attempt.id}
                  className="hover:bg-border/30 transition-colors"
                >
                  <td className="px-5 py-4 whitespace-nowrap font-medium">
                    {formatDate(attempt.created_at)}{" "}
                    {formatTime(attempt.created_at)}
                  </td>
                  <td className="px-5 py-4 font-bold text-text-primary">
                    {attempt.first_name} {attempt.last_name}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">
                      {attempt.action.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-rose-600 font-semibold">
                    {formatAttemptReason(attempt.reason)}
                  </td>
                </tr>
              ))}
              {failedAttempts.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-6 text-center text-text-secondary"
                  >
                    No failed attendance attempts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
