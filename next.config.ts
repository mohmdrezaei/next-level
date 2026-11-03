import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy.
 *
 * `unsafe-inline` / `unsafe-eval` are still required by the Next.js runtime and
 * by Radix's inline positioning styles. Tightening this further needs a
 * nonce-based `script-src` (see the security notes in `SECURITY.md`).
 *
 * `img-src` allows `https:` so the catalogue can keep loading Unsplash imagery;
 * restrict it to the exact hosts from `images.remotePatterns` once the store is
 * serving first-party assets only.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

/** Headers applied to every response, in both dev and production. */
const baseSecurityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/**
 * Headers that would break local HTTP development, so they only ship to
 * production (where TLS terminates in front of the app).
 */
const productionSecurityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  // Allow overriding the build output directory (useful in sandboxed/CI
  // environments where the project root is read-only for renames/deletes).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactCompiler: true,
  // Do not advertise the framework version to attackers.
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion", "radix-ui"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...baseSecurityHeaders, ...(isProduction ? productionSecurityHeaders : [])],
      },
    ];
  },
};

export default nextConfig;
