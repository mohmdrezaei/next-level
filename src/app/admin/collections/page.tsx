import { permanentRedirect } from "next/navigation";

/** Admin collections were replaced by the sets manager at `/admin/sets`. */
export default function AdminCollectionsPage() {
  permanentRedirect("/admin/sets");
}
