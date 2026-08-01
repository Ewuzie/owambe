import { notFound } from "next/navigation";
import { Invitation } from "@/components/invite/Invitation";
import { EVENTS, findEvent } from "@/lib/event";

export function generateStaticParams() {
  return EVENTS.map((e) => ({ id: e.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = findEvent(id);
  if (!event) return { title: "Not found · Owambe" };
  return {
    title: `${event.title} · Owambe`,
    description: `${event.ceremony.label} in ${event.city}. ${event.ceremony.blurb}`,
  };
}

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = findEvent(id);
  if (!event) notFound();
  return <Invitation event={event} />;
}
