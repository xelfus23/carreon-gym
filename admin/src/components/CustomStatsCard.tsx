interface StatsCardProps {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
}

export default function StatsCard(props: StatsCardProps) {
  const { label, value, color, icon } = props;

  return (
    <div
      className={`p-5 border ${color} shadow-sm flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between opacity-80">
        <span className="text-xs font-bold uppercase tracking-widest">
          {label}
        </span>
        {icon}
      </div>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
