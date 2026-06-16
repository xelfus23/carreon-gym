import { useMemo, useRef, useEffect, useState } from "react";

interface CalendarStripProps {
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  activeDates: Set<string>;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
// Format local date as YYYY-MM-DD
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function CalendarStrip({
  selectedDate,
  activeDates,
  onSelectDate,
}: CalendarStripProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const days = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(selectedYear, selectedMonth, i + 1);

      return {
        dateStr: formatLocalDate(d),
        dayLabel: DAY_LABELS[d.getDay()],
        dayNum: d.getDate(),
      };
    });
  }, [selectedMonth, selectedYear]);
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  useEffect(() => {
    const today = new Date();

    if (
      today.getMonth() !== selectedMonth ||
      today.getFullYear() !== selectedYear
    ) {
      return;
    }

    const container = scrollContainerRef.current;

    if (!container) return;

    const todayElement = container.querySelector(
      `[data-date="${todayStr}"]`,
    ) as HTMLElement | null;

    if (todayElement) {
      requestAnimationFrame(() => {
        todayElement.scrollIntoView({
          behavior: "smooth",
          inline: "center",
        });
      });
    }
  }, [todayStr, selectedMonth, selectedYear]);

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap gap-2">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="px-2 py-1 rounded-md bg-surface border border-border text-sm text-text-primary focus:ring-2 focus:ring-primary outline-none cursor-pointer"
        >
          {MONTHS.map((month, index) => (
            <option key={month} value={index}>
              {month}
            </option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-2 py-1 rounded-md bg-surface border border-border text-sm text-text-primary focus:ring-2 focus:ring-primary outline-none cursor-pointer"
        >
          {Array.from({ length: 10 }, (_, i) => {
            const year = now.getFullYear() - 5 + i;

            return (
              <option key={year} value={year}>
                {year}
              </option>
            );
          })}
        </select>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="truncate text-xs font-bold uppercase tracking-wider text-text-primary">
          Attendance Timeline
        </h3>

        {selectedDate && (
          <button
            onClick={() => onSelectDate("")}
            className="shrink-0 text-xs font-semibold text-primary hover:underline"
          >
            Show All Logs
          </button>
        )}
      </div>

      <div className="grid">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto overflow-y-hidden scrollbar-none pb-2"
          style={{
            scrollbarWidth: "none",
          }}
        >
          <div className="flex w-max gap-2">
            {days.map((item) => {
              const isSelected = item.dateStr === selectedDate;
              const isToday = item.dateStr === todayStr;
              const hasLogs = activeDates.has(item.dateStr);

              return (
                <button
                  key={item.dateStr}
                  data-date={item.dateStr}
                  onClick={() => onSelectDate(item.dateStr)}
                  className={`flex w-16 shrink-0 flex-col items-center justify-center rounded-xl border py-2.5 transition-all ${
                    isSelected
                      ? "border-primary bg-primary text-background shadow-md"
                      : isToday
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-background/40 text-text-primary hover:bg-white/5"
                  }`}
                >
                  <span className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    {item.dayLabel}
                  </span>

                  <span className="text-base font-bold">{item.dayNum}</span>

                  <div
                    className={`mt-1.5 h-1.5 w-1.5 rounded-full ${
                      hasLogs ? "bg-primary" : "bg-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
