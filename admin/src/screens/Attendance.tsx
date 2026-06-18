import { useMemo, useState } from "react";
import {
  formatAttemptReason,
  useAttendanceLog,
  type AttendanceLogProps,
} from "../hooks/useAttendance";
import { useMember } from "../hooks/useMember";
import { memberService } from "../services/member.service";
import {
  Logs,
  Users,
  Activity,
  Timer,
  AlertTriangle,
  UserCheck,
  UserX,
  X,
  RefreshCw,
} from "lucide-react";
import CustomHeader from "../components/CustomHeader";
import StatsCard from "../components/CustomStatsCard";
import ToolBar from "../components/ToolBar";
import CustomTable from "../components/CustomTable";
import { formatDuration } from "../utils/formatDuration";
import { formatTime } from "../utils/formatTime";
import { formatDate } from "../utils/formatDate";
import AttendanceRow from "../components/TableRows/AttendanceRow";
import CalendarStrip from "../components/CalendarStrip";


const toLocalDateStr = (isoString: string) => {
  const d = new Date(isoString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Attendance() {
  const {
    logs,
    attempts,
    isLoading,
    refresh,
    selectedDate,
    setSelectedDate,
    latestFailureAlert,
    clearFailureAlert,
  } = useAttendanceLog();

  const { members } = useMember();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedMemberId, setSelectedMemberId] = useState<number | "">("");
  const [manualAction, setManualAction] = useState<"check_in" | "check_out">(
    "check_in",
  );
  const [manualStatus, setManualStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const PAGE_SIZE = 50;

  const handleManualAttendance = async () => {
    if (!selectedMemberId) {
      setManualStatus({ type: "error", message: "Please select a member." });
      return;
    }

    setManualStatus(null);
    setIsSubmittingManual(true);
    try {
      await memberService.manualAttendance({
        userId: Number(selectedMemberId),
        action: manualAction,
      });
      setManualStatus({
        type: "success",
        message:
          manualAction === "check_in"
            ? "Check-in logged successfully."
            : "Check-out logged successfully.",
      });
      refresh(true);
    } catch (err) {
      setManualStatus({
        type: "error",
        message:
          err instanceof Error ? err.message : "Failed to log attendance.",
      });
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        `${log.first_name} ${log.last_name}`
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        log.method.toLowerCase().includes(search.toLowerCase());

      const matchesDate = selectedDate
        ? toLocalDateStr(log.check_in_time) === selectedDate
        : true;

      return matchesSearch && matchesDate;
    });
  }, [logs, search, selectedDate]);


  const failedAttempts = useMemo(() => {
    return attempts.filter((a) => {
      const isFailed = a.result === "failed";
      const matchesDate = selectedDate
        ? toLocalDateStr(a.created_at) === selectedDate
        : true;
      return isFailed && matchesDate;
    });
  }, [attempts, selectedDate]);

  const activeDates = useMemo(() => {
    const dates = new Set<string>();
    logs.forEach((log) => {
      if (log.check_in_time) {
        dates.add(toLocalDateStr(log.check_in_time));
      }
    });
    return dates;
  }, [logs]);

  const stats = useMemo(() => {
    const relevantLogs = selectedDate
      ? logs.filter((l) => l.check_in_time.startsWith(selectedDate))
      : logs;

    return {
      total: relevantLogs.length,
      activeNow: relevantLogs.filter((l) => l.status === "checked_in").length,
      avgDuration: relevantLogs.length
        ? relevantLogs.reduce((acc, curr) => acc + (curr.duration || 0), 0) /
        relevantLogs.length
        : 0,
    };
  }, [logs, selectedDate]);

  const paginated = filteredLogs.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE) || 1;

  const cards = [
    {
      label: "Total Visits",
      value: stats.total,
      color: "border-slate-500/20 bg-slate-500/5 text-slate-500",
      icon: <Users size={16} />,
    },
    {
      label: "Currently In",
      value: stats.activeNow,
      color: "border-emerald-500/20 bg-emerald-500/5 text-emerald-500",
      icon: <Activity size={16} />,
    },
    {
      label: "Avg Session",
      value: formatDuration(stats.avgDuration),
      color: "border-indigo-500/20 bg-indigo-500/5 text-indigo-500",
      icon: <Timer size={16} />,
    },
    {
      label: "Failed Scans",
      value: failedAttempts.length,
      color: "border-red-400/20 bg-red-400/5 text-red-400",
      icon: <AlertTriangle size={16} />,
    },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <CustomHeader
        hasAction={false}
        isLoading={isLoading}
        refresh={refresh}
        icon={<Logs className="text-primary" />}
        title="Attendance Log"
        buttonLabel="Refresh"
        description="Manage and view Careon Gym attendance log"
      />

      {/* ── Failure alert banner ── */}
      {latestFailureAlert && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 border border-rose-500/30 bg-rose-500/10 rounded-none">
          <div className="flex items-center gap-3">
            <AlertTriangle size={16} className="text-rose-400 shrink-0" />
            <p className="text-sm font-semibold text-rose-400">
              Failed {latestFailureAlert.action.replace("_", " ")} —{" "}
              <span className="font-normal text-rose-300">
                {latestFailureAlert.last_name}:{" "}
                {formatAttemptReason(latestFailureAlert.reason)}
              </span>
            </p>
          </div>
          <button
            onClick={clearFailureAlert}
            className="text-rose-400 hover:text-rose-300 transition-colors shrink-0"
            aria-label="Dismiss alert"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((props) => (
          <StatsCard key={props.label} {...props} />
        ))}
      </div>

      {/* ── Manual attendance panel ── */}
      <div className="border border-border bg-surface">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <UserCheck size={15} className="text-primary" />
          <h2 className="text-sm font-bold text-text-primary">
            Manual attendance
          </h2>
          <span className="ml-auto text-xs text-text-secondary">
            For walk-ins or QR failures
          </span>
        </div>

        <div className="p-4 flex flex-col sm:flex-row sm:items-end gap-3">
          {/* Member selector */}
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Member
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) =>
                setSelectedMemberId(
                  e.target.value ? Number(e.target.value) : "",
                )
              }
              className="w-full px-3 py-2 bg-surface border border-border text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">Select a member…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.first_name} {m.last_name} — {m.email}
                </option>
              ))}
            </select>
          </div>

          {/* Action toggle */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
              Action
            </label>
            <div className="flex border border-border overflow-hidden">
              <button
                onClick={() => setManualAction("check_in")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${manualAction === "check_in"
                  ? "bg-emerald-500/15 text-emerald-400 border-r border-emerald-500/30"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5 border-r border-border"
                  }`}
              >
                <UserCheck size={13} />
                Check in
              </button>
              <button
                onClick={() => setManualAction("check_out")}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${manualAction === "check_out"
                  ? "bg-amber-500/15 text-amber-400"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                  }`}
              >
                <UserX size={13} />
                Check out
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleManualAttendance}
            disabled={isSubmittingManual || !selectedMemberId}
            className="flex items-center gap-2 px-4 rounded-md py-2 bg-primary hover:bg-primary/90 transition-colors text-background text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSubmittingManual ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                Saving…
              </>
            ) : (
              "Log attendance"
            )}
          </button>
        </div>

        {/* Inline status feedback */}
        {manualStatus && (
          <div
            className={`mx-4 mb-4 px-3 py-2 text-xs font-semibold border ${manualStatus.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-rose-500/30 bg-rose-500/10 text-rose-400"
              }`}
          >
            {manualStatus.message}
          </div>
        )}
      </div>

      <CalendarStrip
        selectedDate={selectedDate}
        activeDates={activeDates}
        onSelectDate={(dateStr) => {
          setSelectedDate(dateStr);
          setPage(1); // Reset page numbers upon scoping a new day
        }}
      />

      {/* ── Attendance log table ── */}
      <div className="bg-surface border border-border shadow-sm overflow-hidden">
        <ToolBar
          placeholder="Search by member name or method…"
          search={search}
          filtered={filteredLogs}
          handleSearchChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <CustomTable<AttendanceLogProps>
          columns={[
            { label: "Date", key: "check_in_time" },
            { label: "Member", key: "first_name" },
            { label: "Check in", key: "check_in_time" },
            { label: "Check out", key: "check_out_time" },
            { label: "Duration", key: "duration" },
            { label: "Method", key: "method" },
          ]}
          data={paginated}
          totalItems={totalPages}
          setPage={setPage}
          page={page}
          pageSize={PAGE_SIZE}
          renderRow={(log) => <AttendanceRow key={log.id} log={log} />}
        />
      </div>

      {/* ── Error / failed scans log ── */}
      <div className="bg-surface border border-border shadow-sm overflow-hidden">
        {/* Section header */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-rose-400" />
            <h2 className="text-sm font-bold text-text-primary">
              Failed scan log
            </h2>
          </div>
          {failedAttempts.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">
              {failedAttempts.length}
            </span>
          )}
          <p className="ml-auto text-xs text-text-secondary hidden sm:block">
            QR errors, missing subscriptions, duplicate scans
          </p>
        </div>

        <div className="overflow-x-auto max-h-[480px]">
          <table className="text-left text-sm w-full">
            <thead className="sticky top-0 z-10">
              <tr className="bg-surface border-b border-border">
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Time
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Member
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Action
                </th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {failedAttempts.slice(0, 50).map((attempt) => (
                <tr
                  key={attempt.id}
                  className="hover:bg-white/2 transition-colors group"
                >
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="text-xs text-text-secondary">
                      {formatDate(attempt.created_at)}
                    </span>
                    <span className="text-xs text-text-secondary/60 ml-1.5">
                      {formatTime(attempt.created_at)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-semibold text-text-primary">
                      {attempt.first_name} {attempt.last_name}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 border ${attempt.action === "check_in"
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        }`}
                    >
                      {attempt.action === "check_in" ? (
                        <UserCheck size={10} />
                      ) : (
                        <UserX size={10} />
                      )}
                      {attempt.action.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                      <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />
                      {formatAttemptReason(attempt.reason)}
                    </span>
                  </td>
                </tr>
              ))}

              {failedAttempts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Activity size={20} className="text-text-secondary/40" />
                      <p className="text-sm text-text-secondary">
                        No failed scans — all clear
                      </p>
                    </div>
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
