// ── REUSABLE RACK TABLE ──────────────────────────────────────────────────────
type RackColumn<T> = { label: string; render: (row: T) => React.ReactNode };

export default function RackTable<T>({
  title,
  rows,
  columns,
}: {
  title: string;
  rows: T[];
  columns: RackColumn<T>[];
}) {
  if (!rows.length) return null;

  return (
    <div className="bg-surface border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className="text-sm font-semibold text-text-primary tracking-wide">{title}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-background">
              {columns.map((col) => (
                <th
                  key={col.label}
                  className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border/50 last:border-0 hover:bg-border/30 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.label} className="px-4 py-3 text-text-primary">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}