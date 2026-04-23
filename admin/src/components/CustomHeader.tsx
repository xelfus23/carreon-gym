import { Plus, RefreshCw } from "lucide-react";
import type { ReactElement } from "react";

interface CustomHeaderProps {
  title: string;
  description: string;
  icon: ReactElement;
  isLoading: boolean;
  refresh: () => void;
  onClick?: () => void;
  buttonLabel?: string;
  hasAction: boolean;
}

export default function CustomHeader({
  title,
  description,
  icon,
  isLoading,
  refresh,
  onClick,
  buttonLabel,
  hasAction,
}: CustomHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {icon}
          {title}
        </h1>
        <p className="text-text-secondary text-sm mt-1">{description}</p>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {!isLoading && (
          <button
            onClick={refresh}
            className="flex items-center justify-center gap-2 px-4 py-2 border border-border bg-surface text-text-primary text-sm font-bold hover:bg-border transition-all active:scale-90"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        )}
        {hasAction && (
          <button
            onClick={onClick}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-background text-sm font-bold hover:bg-primary-dark transition-all active:scale-90"
          >
            <Plus size={16} /> {buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
}
