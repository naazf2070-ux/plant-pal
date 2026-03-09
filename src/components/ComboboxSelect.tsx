import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const ComboboxSelect = ({ options, value, onChange, placeholder = "Select or type to add new" }: ComboboxSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  const showAddNew = search.trim() && !options.some((o) => o.toLowerCase() === search.trim().toLowerCase());

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer",
          open && "ring-2 ring-ring ring-offset-2"
        )}
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
      >
        <input
          ref={inputRef}
          className="bg-transparent outline-none w-full placeholder:text-muted-foreground"
          placeholder={value || placeholder}
          value={open ? search : value}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        <ChevronDown className={cn("h-4 w-4 shrink-0 opacity-50 transition-transform", open && "rotate-180")} />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md animate-in fade-in-0 zoom-in-95">
          {filtered.map((option) => (
            <div
              key={option}
              className={cn(
                "relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                value === option && "bg-accent/50"
              )}
              onClick={() => { onChange(option); setOpen(false); setSearch(""); }}
            >
              {option}
            </div>
          ))}
          {showAddNew && (
            <div
              className="flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm text-primary hover:bg-accent hover:text-accent-foreground border-t border-border mt-1 pt-2"
              onClick={() => { onChange(search.trim()); setOpen(false); setSearch(""); }}
            >
              + Add "{search.trim()}"
            </div>
          )}
          {!filtered.length && !showAddNew && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No options found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ComboboxSelect;
