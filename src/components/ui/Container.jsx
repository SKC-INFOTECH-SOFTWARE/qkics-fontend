import { cn } from "./cn";

/**
 * Page width + responsive padding in ONE place, so every page shares an
 * identical shell. Change a width here → it changes on every page at once.
 *
 *   The wide sizes are FLUID: width tracks the viewport (a % of it) so the
 *   side margins stay small and proportional on every screen instead of
 *   snapping to a fixed cap. They only stop growing at a large max so the
 *   feed/text never gets unreadably wide on ultra-wide monitors.
 *     lg → min(94vw, 1500px)   xl → min(96vw, 1760px)
 *   e.g. xl on 1440 ≈ 1382, on 1920 ≈ 1760, on 2560 = 1760.
 *
 * size:
 *   sm   → forms / legal / reading   (max-w-3xl, fixed — readability)
 *   md   → wizards                    (max-w-5xl, fixed)
 *   lg   → profile / detail pages     (fluid → 1500 max)
 *   xl   → main app shell             (fluid → 1760 max)  [default]
 *   full → edge-to-edge
 *
 * padded: include the standard px-4 sm:px-6 lg:px-8 gutters (default true).
 *         Pass padded={false} for edge-to-edge views (e.g. chat).
 *
 * className: extra layout only — flex/grid/gap/vertical-padding. Do NOT pass
 *   max-w-* or px-* here (cn is a plain joiner, not tailwind-merge, so those
 *   would collide with the ones above); use `size`/`padded` instead.
 */
const widths = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-[min(94vw,1500px)]",
  xl: "max-w-[min(96vw,1760px)]",
  full: "max-w-full",
};

export default function Container({ size = "xl", padded = true, className, ...props }) {
  return (
    <div
      className={cn(
        "w-full mx-auto",
        padded && "px-4 sm:px-6 lg:px-8",
        widths[size] || widths.xl,
        className
      )}
      {...props}
    />
  );
}
