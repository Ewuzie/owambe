import { notFound } from "next/navigation";
import { EventWall } from "@/components/wall/EventWall";
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
  return { title: event ? `${event.title} · The wall` : "Not found · Owambe" };
}

export default async function WallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = findEvent(id);
  if (!event) notFound();
  return <EventWall event={event} />;
}
