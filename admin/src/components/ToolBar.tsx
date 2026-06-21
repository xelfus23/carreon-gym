import type { ChangeEventHandler } from "react";
import SearchInput from "./CustomSearchInput";
import { PlusCircle, RefreshCw } from "lucide-react";

export type options = {
  label: string;
  value: string;
};

export type SelectProps = {
  value: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
  options: options[];
  label: string;
};

interface ToolbarProps {
  search: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  select?: SelectProps[];
  placeholder: string;
  action?: {
    label: string,
    loading: boolean
    function: () => void;
  };
}

export default function ToolBar({
  search,
  handleSearchChange,
  select,
  placeholder,
  action,
}: ToolbarProps) {
  return (
    <div className="p-4 border-b border-border bg-surface flex flex-wrap gap-3 items-center">
      <SearchInput
        placeholder={placeholder}
        value={search}
        onChange={handleSearchChange}
      />

      {select?.map((values) => (
        <div key={values.label} className="space-x-2">
          <label className="text-xs">{values.label}:</label>
          <select
            value={values.value}
            onChange={values.onChange}
            className="px-2 py-1 rounded-md bg-surface border border-border text-sm text-text-primary focus:ring-2 focus:ring-primary outline-none cursor-pointer"
          >
            {values.options.map((v) => (
              <option key={v.label} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className="flex items-center gap-2 ml-auto">
        {!action?.loading && (
          <button
            // onClick={action.function}
            className="flex rounded-full cursor-pointer items-center justify-center gap-2 p-2 border border-border bg-surface text-text-primary text-sm font-bold hover:bg-border transition-all active:scale-90"
          >
            <RefreshCw className="text-text-secondary" size={14} />
          </button>
        )}
        {action && (
          <button
            onClick={action.function}
            className="flex rounded-md cursor-pointer items-center justify-center gap-2 px-4 py-2 bg-primary text-background text-sm font-bold hover:bg-primary-dark transition-all active:scale-90"
          >
            <PlusCircle size={16} /> {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
