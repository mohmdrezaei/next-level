import type { Metadata } from "next";
import { HomeSections } from "@/features/home/components/home-sections";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${SITE.name} — ${SITE.tagline}`,
  description: SITE.shortDescription,
};

export default function HomePage() {
  return <HomeSections />;
}
