import { Clock } from "lucide-react";
import type { AttendanceLogProps } from "../../hooks/useAttendance";
import { formatDate } from "../../utils/formatDate";
import { formatTime } from "../../utils/formatTime";
import { formatDuration } from "../../utils/formatDuration";

interface AttendanceRowProps {
  log: AttendanceLogProps;
}

export default function AttendanceRow({ log }: AttendanceRowProps) {
  const tdBase = "p-4";

  return (
    <tr className="hover:bg-border/30 transition-colors">
      <td className={`${tdBase} whitespace-nowrap text-xs text-text-secondary`}>
        {formatDate(log.check_in_time)}
      </td>

      <td className={`${tdBase} font-bold text-text-primary`}>
        {log.first_name} {log.last_name}
      </td>

      <td className={`${tdBase} text-emerald-500 font-medium`}>
        {formatTime(log.check_in_time)}
      </td>

      <td className={`${tdBase} text-rose-500 font-medium `}>
        {log.check_out_time ? (
          formatTime(log.check_out_time)
        ) : (
          <span className="flex items-center gap-1 opacity-50 italic">
            <Clock size={12} /> Active
          </span>
        )}
      </td>

      <td className={`${tdBase} whitespace-nowrap text-xs`}>
        {formatDuration(log.duration!)}
      </td>

      <td className={tdBase}>
        <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase">
          {log.method}
        </span>
      </td>
    </tr>
  );
}
