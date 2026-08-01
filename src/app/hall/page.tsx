import { redirect } from "next/navigation";
import { DEMO_EVENT } from "@/lib/event";

/* The old single-room URL, kept working now that rooms live under /e/[id]. */
export default function LegacyHallPage() {
  redirect(`/e/${DEMO_EVENT.id}/hall`);
}
