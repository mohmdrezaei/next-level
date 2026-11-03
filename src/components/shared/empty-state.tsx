import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-line bg-surface/40 px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <span className="grid size-14 place-items-center rounded-full border border-line bg-elevated text-mute [&_svg]:size-6">
          {icon}
        </span>
      ) : null}

      <div className="flex max-w-sm flex-col gap-2">
        <h3 className="text-base font-semibold tracking-tight text-ivory">{title}</h3>
        {description ? <p className="text-xs leading-6 text-mute">{description}</p> : null}
      </div>

      {children}

      {action ? (
        <Button asChild variant="outline" size="sm">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
