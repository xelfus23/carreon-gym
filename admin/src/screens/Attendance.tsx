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
  Loader2,
} from "lucide-react";
import CustomHeader from "../components/CustomHeader";
import StatsCard from "../components/CustomStatsCard";
import ToolBar from "../components/ToolBar";
import CustomTable from "../components/CustomTable";
import { formatDuration } from "../utils/formatDuration";
import { formatTime } from "../utils/formatTime";
import { formatDate } from "../utils/formatDate";
import AttendanceRow from "../components/TableRows/AttendanceRow";

export default function Attendance() {
  const {
    logs,
    attempts,
    isLoading,
    refresh,
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
      // Using the formatter for the stats bar too
      value: formatDuration(stats.avgDuration),
      color: "border-indigo-500/20 bg-indigo-500/5 text-indigo-500",
      icon: <Timer size={16} />,
    },
    {
      label: "Error Log",
      value: failedAttempts.length,
      color: "border-red-400/20 bg-red-400/5 text-red-400",
      icon: <AlertTriangle size={16} />,
    },
  ];

  if (isLoading)
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4">
        <Loader2
          size={26}
          className="animate-spin text-primary stroke-primary"
        />
        <p className="text-text-secondary animate-pulse">
          Loading attendance log records...
        </p>
      </div>
    );

  return (
    <div className="space-y-4">
      <CustomHeader
        hasAction={true}
        isLoading={isLoading}
        refresh={refresh}
        icon={<Logs className="text-primary" />}
        title="Attendance Log"
        buttonLabel="Refresh"
        description="Manage and view carreon gym attendance log"
      />

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

        <div className="space-x-4">
          <label className="text-xs text-text-secondary font-semibold uppercase tracking-wide">
            Action
          </label>
          <select
            value={manualAction}
            onChange={(e) =>
              setManualAction(e.target.value as "check_in" | "check_out")
            }
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
      {manualStatus && <p className="text-sm text-red-500">{manualStatus}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {cards.map((props) => (
          <StatsCard key={props.label} {...props} />
        ))}
      </div>

      {latestFailureAlert && (
        <div className="px-4 py-3 border border-rose-300 bg-rose-50 text-rose-700 flex items-center justify-between">
          <p className="text-sm font-semibold">
            Failed {latestFailureAlert.action.replace("_", " ")} scan detected:{" "}
            {latestFailureAlert.last_name} (
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

      <div className="bg-surface border border-border shadow-sm overflow-hidden">
        <ToolBar
          placeholder="Search member name..."
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
            { label: "Check In", key: "check_in_time" },
            { label: "Check Out", key: "check_out_time" },
            { label: "Duration", key: "duration" },
            { label: "Method", key: "method" },
          ]}
          data={paginated}
          totalItems={totalPages}
          setPage={setPage}
          page={page}
          pageSize={PAGE_SIZE}
          renderRow={(log) => <AttendanceRow log={log} />}
        />
      </div>

      <div className="bg-surface border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-surface">
          <h2 className="text-lg font-bold text-rose-600">Error Log</h2>
          <p className="text-xs text-text-secondary mt-1">
            Shows failed QR scans like no subscription, invalid QR, or duplicate
            check-in.
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
