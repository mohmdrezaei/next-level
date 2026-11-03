import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";

interface LogoProps {
  className?: string;
  /** Hide the Persian wordmark, keeping only the monogram + latin name. */
  compact?: boolean;
  href?: string | null;
}

export function Logo({ className, compact = false, href = "/" }: LogoProps) {
  const content = (
    <span className={cn("group inline-flex items-center gap-3", className)}>
      <span className="relative grid size-10 shrink-0 place-items-center rounded-full border border-gold/35 bg-[radial-gradient(circle_at_30%_25%,rgba(200,162,76,0.28),transparent_65%)]">
        <span className="text-sm font-semibold tracking-tight text-gold-soft">NL</span>
        <span className="absolute inset-0 rounded-full border border-gold/20 transition-transform duration-700 ease-[var(--ease-silk)] group-hover:scale-110" />
      </span>

      <span className="flex flex-col leading-none">
        <span className="text-base font-semibold tracking-[0.22em] text-ivory transition-colors duration-300 group-hover:text-gold-soft">
          {SITE.latinName}
        </span>
        {!compact ? (
          <span className="mt-1 text-[0.6rem] tracking-[0.22em] text-mute">
            {SITE.tagline}
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label={`${SITE.name} — صفحه اصلی`} className="outline-hidden">
      {content}
    </Link>
  );
}
