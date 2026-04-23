import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  placeholder: string;
}

export default function SearchInput(props: SearchInputProps) {
  const { value, onChange, placeholder } = props;

  return (
    <div className="relative flex-1 min-w-48">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
        <Search size={14} />
      </span>
      <input
        value={value}
        onChange={onChange}
        type="text"
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2 bg-surface border border-border text-sm focus:ring-2 focus:ring-primary outline-none transition-all text-text-primary"
      />
    </div>
  );
}