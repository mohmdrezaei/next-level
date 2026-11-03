import { permanentRedirect } from "next/navigation";

/**
 * Seasonal collections were replaced by curated "sets" (complete looks).
 * The route is kept as a permanent redirect so existing links keep working.
 */
export default function CollectionsPage() {
  permanentRedirect("/sets");
}
