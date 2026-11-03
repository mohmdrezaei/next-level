import { permanentRedirect } from "next/navigation";

/** See `../page.tsx` — collections now live under `/sets`. */
export default function CollectionPage() {
  permanentRedirect("/sets");
}
