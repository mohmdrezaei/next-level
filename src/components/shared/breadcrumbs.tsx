import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Crumb {
  title: string;
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="مسیر صفحه" className={cn("flex items-center gap-2 text-[0.68rem]", className)}>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-mute transition-colors duration-300 hover:text-gold-soft"
      >
        <Home className="size-3.5" />
        خانه
      </Link>

      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${item.title}-${index}`} className="flex items-center gap-2">
            <ChevronLeft className="size-3 text-line" />
            {item.href && !last ? (
              <Link
                href={item.href}
                className="text-mute transition-colors duration-300 hover:text-gold-soft"
              >
                {item.title}
              </Link>
            ) : (
              <span className={last ? "text-smoke" : "text-mute"}>{item.title}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
