"use client";

import Link from "next/link";
import { useState } from "react";
import {
  COUNTRIES,
  CountryCode,
  EVENTS,
  OwambeEvent,
  eventCurrency,
  formatMoney,
  startsInLabel,
  toLocal,
} from "@/lib/event";

/*
  The front door. Celebrations across the continent, each with its own
  ceremony and its own way of moving money.
*/

const FILTERS: { key: CountryCode | "all"; label: string }[] = [
  { key: "all", label: "All Africa" },
  { key: "NG", label: "Nigeria" },
  { key: "KE", label: "Kenya" },
  { key: "GH", label: "Ghana" },
  { key: "ZA", label: "South Africa" },
];

export function CelebrationsHome() {
  const [filter, setFilter] = useState<CountryCode | "all">("all");
  const shown =
    filter === "all" ? EVENTS : EVENTS.filter((e) => e.ceremony.country === filter);

  const live = shown.filter((e) => e.status === "live");
  const upcoming = shown.filter((e) => e.status === "upcoming");
  const ended = shown.filter((e) => e.status === "ended");

  return (
    <div className="min-h-dvh bg-ink-deep text-cream">
      {/* Masthead */}
      <header className="border-b border-rule-strong bg-ink">
        <div className="mx-auto max-w-5xl px-5 py-10">
          <div className="microlabel">The money layer for African celebrations</div>
          <h1 className="mt-3 font-display text-[clamp(30px,5vw,52px)] leading-[1.05] text-cream">
            Be there, and be seen,
            <br />
            from wherever you are.
          </h1>
          <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-cream-mute">
            Every culture on this continent has a way of putting money into a moment
            of joy or grief in front of everybody. Owambe carries that act across
            the distance, and the money lands in a local bank account the same night.
          </p>
        </div>
      </header>

      {/* Country filter */}
      <nav
        aria-label="Filter by country"
        className="sticky top-0 z-10 flex overflow-x-auto border-b border-rule bg-ink-deep/95 backdrop-blur"
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className={`microlabel flex-none cursor-pointer border-b-2 border-r border-r-rule px-5 py-4 transition-colors duration-200 ${
                active ? "border-b-gold !text-cream" : "border-b-transparent !text-cream-faint hover:!text-cream-mute"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-5xl px-5 pb-20">
        <Section title="Happening now" count={live.length}>
          {live.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </Section>

        <Section title="Coming up" count={upcoming.length}>
          {upcoming.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </Section>

        {ended.length > 0 && (
          <Section title="Already celebrated" count={ended.length}>
            {ended.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </Section>
        )}

        {shown.length === 0 && (
          <p className="py-16 text-center text-[13px] text-cream-faint">
            No celebrations in {FILTERS.find((f) => f.key === filter)?.label} yet.
          </p>
        )}
      </main>
    </div>
  );
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;
  return (
    <section className="pt-10">
      <div className="flex items-baseline justify-between border-b border-rule-strong pb-2">
        <h2 className="font-display text-[19px] text-cream">{title}</h2>
        <span className="microlabel">
          {count} {count === 1 ? "celebration" : "celebrations"}
        </span>
      </div>
      <div>{children}</div>
    </section>
  );
}

function EventRow({ event }: { event: OwambeEvent }) {
  const currency = eventCurrency(event);
  const country = COUNTRIES[event.ceremony.country];
  const raised = formatMoney(toLocal(event.seedRaisedUsd, currency), currency);

  return (
    <Link
      href={`/e/${event.id}`}
      className="ledger-row group flex cursor-pointer flex-col gap-3 py-5 transition-colors duration-200 hover:bg-ink sm:flex-row sm:items-center sm:gap-5"
    >
      {/* Status marker */}
      <div className="flex flex-none items-center gap-2 sm:w-[104px]">
        <span
          className={`marker ${
            event.status === "live"
              ? "live-pulse bg-live"
              : event.status === "upcoming"
                ? "bg-aso"
                : "bg-cream-faint"
          }`}
          aria-hidden="true"
        />
        <span className="microlabel">
          {event.status === "live" ? "Live" : event.status === "upcoming" ? "Upcoming" : "Ended"}
        </span>
      </div>

      {/* Title and detail */}
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-[17px] leading-snug text-cream group-hover:text-gold-bright">
          {event.title}
        </h3>
        <p className="mt-1 text-[12px] text-cream-mute">
          {event.ceremony.label} · {event.city}, {country.name}
        </p>
        <p className="mt-1.5 max-w-lg text-[12px] leading-snug text-cream-faint">
          {event.ceremony.blurb}
        </p>
      </div>

      {/* Money */}
      <div className="flex flex-none items-baseline gap-4 sm:w-[190px] sm:flex-col sm:items-end sm:gap-0.5">
        <span className="money text-[15px] font-bold text-gold-bright">{raised}</span>
        <span className="microlabel">
          {event.ceremony.givingNoun} · {event.guestCount} present
        </span>
        <span className="microlabel !text-cream-faint">{startsInLabel(event)}</span>
      </div>
    </Link>
  );
}
