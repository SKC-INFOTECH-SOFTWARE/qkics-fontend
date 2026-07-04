import { Link } from "react-router-dom";
import { FiChevronRight, FiHome } from "react-icons/fi";
import { cn } from "./cn";

/**
 * Trail shown above a page title.
 *
 * <Breadcrumb
 *   items={[
 *     { label: "Experts", to: "/experts" },
 *     { label: "Book Session" },      // last item = current page (no `to`)
 *   ]}
 * />
 *
 * A leading Home crumb (→ "/") is added automatically unless home={false}.
 */
export function Breadcrumb({ items = [], home = true, className }) {
  const crumbs = home
    ? [{ label: "Home", to: "/", icon: <FiHome size={13} /> }, ...items]
    : items;

  return (
    <nav aria-label="Breadcrumb" className={cn("mb-3", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-2xs font-black uppercase tracking-widest">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;

          return (
            <li key={i} className="inline-flex items-center gap-1.5">
              {crumb.to && !isLast ? (
                <Link
                  to={crumb.to}
                  className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                >
                  {crumb.icon}
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    isLast ? "text-primary" : "text-muted-foreground"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {crumb.icon}
                  {crumb.label}
                </span>
              )}

              {!isLast && (
                <FiChevronRight
                  size={12}
                  className="text-muted-foreground/50"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
