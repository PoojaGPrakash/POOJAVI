import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Subtle lift-in as a section scrolls into view, implemented with CSS
 * scroll-driven animations (progressive enhancement). Content is never
 * hidden: browsers without support, reduced-motion users, crawlers and
 * print all see it immediately.
 */
export function Reveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <div className={cn("reveal", className)} style={delay ? { animationRangeStart: `entry ${Math.min(delay / 20, 20)}%` } : undefined}>
      {children}
    </div>
  );
}
