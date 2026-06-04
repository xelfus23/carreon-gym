import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
}

export default function SearchInput(props: SearchInputProps) {
  const { value, onChange, placeholder } = props;

  return (
    <div className="relative max-w-sm w-full">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
        <Search size={14} />
      </span>
      <input
        value={value}
        onChange={onChange}
        type="text"
        placeholder={placeholder}
        className="w-full pl-9 pr-4 rounded-lg py-2.5 bg-background border border-border text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
      />
    </div>
  );
}
