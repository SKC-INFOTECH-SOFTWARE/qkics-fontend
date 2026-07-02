import { forwardRef } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";
import { cn } from "./cn";

/**
 * Shared pill-shaped search input — use this everywhere a search box is needed
 * so every search looks identical. Token-themed, auto-flips in dark mode.
 *
 *   <SearchInput value={q} onChange={setQ} placeholder="Search Documents..." />
 *
 * `onChange` receives the raw string value (not the event) for convenience.
 */
const SearchInput = forwardRef(function SearchInput(
  { value = "", onChange, onClear, placeholder = "Search...", className = "w-full sm:w-80", ...props },
  ref
) {
  return (
    <div className={cn("relative", className)}>
      <FaSearch className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-input bg-muted py-3 pl-12 pr-11 text-sm font-bold text-foreground placeholder:font-normal placeholder:text-muted-foreground outline-none transition-all hover:bg-muted/70 focus:border-primary"
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => (onClear ? onClear() : onChange?.(""))}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
          aria-label="Clear search"
        >
          <FaTimes size={13} />
        </button>
      )}
    </div>
  );
});

export default SearchInput;
