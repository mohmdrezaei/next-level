import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AppProviders } from "@/providers/app-providers";
import { ScrollProgress } from "@/components/shared/scroll-progress";
import { SITE } from "@/lib/constants";
import "./globals.css";

const vazirmatn = localFont({
  src: [
    { path: "../assets/fonts/Vazirmatn-Light.woff2", weight: "300", style: "normal" },
    { path: "../assets/fonts/Vazirmatn-Regular.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/Vazirmatn-Medium.woff2", weight: "500", style: "normal" },
    { path: "../assets/fonts/Vazirmatn-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../assets/fonts/Vazirmatn-Bold.woff2", weight: "700", style: "normal" },
    { path: "../assets/fonts/Vazirmatn-ExtraBold.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "Tahoma", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.shortDescription,
  keywords: ["پوشاک مردانه", "بوتیک مردانه", "کت و شلوار", "پیراهن مردانه", "پالتو مردانه", "Next Level"],
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.shortDescription,
    type: "website",
    locale: "fa_IR",
    siteName: SITE.name,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0d" },
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`dark ${vazirmatn.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-ink font-sans text-ivory antialiased">
        <ScrollProgress />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
