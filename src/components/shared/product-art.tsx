import { mediaClassFor } from "@/lib/media";
import { cn } from "@/lib/utils";

interface ProductArtProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Product imagery is served from locally generated SVG art, so a plain
 * <img> keeps the pipeline simple and renders identically offline.
 *
 * Generated art carries the `media-invertible` class (see globals.css), which
 * is what light mode is allowed to invert. Everything else — remote URLs and
 * admin uploads (data URLs) — is a real photograph and must keep its true
 * colours, so it opts out via `media-natural`.
 */
export function ProductArt({ src, alt, className, imageClassName }: ProductArtProps) {
  return (
    <span className={cn("relative block overflow-hidden bg-carbon", className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={cn("size-full object-cover", mediaClassFor(src), imageClassName)}
      />
    </span>
  );
}
