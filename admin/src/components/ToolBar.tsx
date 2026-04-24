import type { ChangeEventHandler } from "react";
import SearchInput from "./CustomSearchInput";

export type options = {
  label: string,
  value: string
}

export type SelectProps = {
  value: string,
  onChange: ChangeEventHandler<HTMLSelectElement>;
  options: options[]
}

interface ToolbarProps<T> {
  search: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  select?: SelectProps[];
  filtered: T[];
  placeholder: string
}


export default function ToolBar<T>({ search, handleSearchChange, select, filtered, placeholder }: ToolbarProps<T>) {
  return (
    <div className="p-4 border-b border-border bg-surface flex flex-wrap gap-3 items-center">
      <SearchInput
        placeholder={placeholder}
        value={search}
        onChange={handleSearchChange}
      />

      {select?.map((values) => (
        <select
          value={values.value}
          onChange={values.onChange}
          className="px-3 py-2 bg-surface border border-border text-sm text-text-primary focus:ring-2 focus:ring-primary outline-none cursor-pointer"
        >
          {values.options.map((v) => (
            <option value={v.value}>{v.label}</option>
          ))}
        </select>
      ))}

      <span className="ml-auto text-xs text-text-secondary font-medium whitespace-nowrap">
        {filtered.length} result
        {filtered.length !== 1 ? "s" : ""}
      </span>
    </div>
  )
}
