import { notFound } from "next/navigation";
import { Hall } from "@/components/hall/Hall";
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
  return { title: event ? `${event.title} · The hall` : "Not found · Owambe" };
}

export default async function HallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = findEvent(id);
  if (!event) notFound();
  return <Hall event={event} />;
}
