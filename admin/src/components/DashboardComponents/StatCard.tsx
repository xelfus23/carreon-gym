const StatCard: React.FC<{
  title: string;
  value: string;
  trend: string;
  color: string;
  loading?: boolean;
}> = ({ title, value, trend, color, loading }) => {
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };

  return (
    <div className="bg-surface p-6 border border-border shadow-sm">
      <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
      <h2
        className={`text-3xl font-black text-text-primary mb-3 transition-opacity ${loading ? "opacity-30 animate-pulse" : "opacity-100"
          }`}
      >
        {value}
      </h2>
      <p
        className={`text-xs font-semibold ${colorMap[color] ?? "text-text-secondary"}`}
      >
        {trend}
      </p>
    </div>
  );
};

export default StatCard