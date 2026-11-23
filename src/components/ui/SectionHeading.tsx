import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  action,
  as: Tag = "h2",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string | null;
  align?: "center" | "left";
  action?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
}) {
  const centred = align === "center";
  return (
    <div
      className={cn(
        "mb-10 flex flex-col gap-4 sm:mb-14",
        centred ? "items-center text-center" : "items-start sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-4", centred && "items-center")}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <Tag className={Tag === "h1" ? "display-1" : "display-2"}>{title}</Tag>
        {description && <p className={cn("body-lg max-w-2xl", centred && "mx-auto")}>{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
