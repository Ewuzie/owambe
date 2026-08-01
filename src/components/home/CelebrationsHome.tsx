"use client";

import Link from "next/link";
import { CSSProperties, useState } from "react";
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
  The front door. White ground, type doing the shouting, and each
  celebration wearing its own cloth colour.
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
  const shown = filter === "all" ? EVENTS : EVENTS.filter((e) => e.ceremony.country === filter);

  const live = shown.filter((e) => e.status === "live");
  const upcoming = shown.filter((e) => e.status === "upcoming");
  const ended = shown.filter((e) => e.status === "ended");

  return (
    <div className="min-h-dvh bg-paper text-ink">
      {/* Masthead */}
      <header className="border-b-2 border-ink">
        <div className="mx-auto max-w-6xl px-5 pb-14 pt-10 sm:px-8">
          <div className="flex items-baseline justify-between">
            <span className="display text-[19px]">Owambe</span>
            <span className="microlabel">Africa</span>
          </div>

          <h1 className="stagger display mt-10 text-[clamp(42px,11vw,132px)]">
            <span className="block">Be there.</span>
            <span className="block">Be seen.</span>
            <span className="block text-accent">Give big.</span>
          </h1>

          <p className="rise mt-8 max-w-lg text-[15px] leading-relaxed text-ink-mute">
            Every culture on this continent has a way of putting money into a moment,
            in front of everybody. Owambe carries that across the distance, and it
            lands in a local account the same night.
          </p>
        </div>
      </header>

      {/* Country filter */}
      <nav
        aria-label="Filter by country"
        className="sticky top-0 z-10 flex overflow-x-auto border-b-2 border-ink bg-paper"
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={active}
              className={`microlabel flex-none cursor-pointer border-r border-rule px-6 py-4 transition-colors duration-150 ${
                active ? "bg-ink !text-paper" : "!text-ink-faint hover:bg-paper-2 hover:!text-ink"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </nav>

      <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
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
        <Section title="Already celebrated" count={ended.length}>
          {ended.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </Section>

        {shown.length === 0 && (
          <p className="py-24 text-center text-[14px] text-ink-faint">
            Nothing in {FILTERS.find((f) => f.key === filter)?.label} yet.
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
    <section className="pt-14">
      <div className="flex items-baseline justify-between">
        <h2 className="display text-[clamp(22px,3.4vw,34px)]">{title}</h2>
        <span className="microlabel">{count}</span>
      </div>
      <div className="stagger mt-5 border-t-2 border-ink">{children}</div>
    </section>
  );
}

function EventRow({ event }: { event: OwambeEvent }) {
  const currency = eventCurrency(event);
  const country = COUNTRIES[event.ceremony.country];
  const raised = formatMoney(toLocal(event.seedRaisedUsd, currency), currency);
  const style = { "--accent": event.accent } as CSSProperties;

  return (
    <Link
      href={`/e/${event.id}`}
      style={style}
      className="group ledger-row relative flex cursor-pointer flex-col gap-4 py-7 transition-colors duration-150 hover:bg-paper-2 sm:flex-row sm:items-center sm:gap-8"
    >
      {/* The cloth of the day, as a block of colour */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-0 bg-accent transition-all duration-200 group-hover:w-2"
      />

      <div className="flex flex-none items-center gap-2.5 sm:w-[112px]">
        <span
          className={`marker ${
            event.status === "live"
              ? "live-pulse bg-live"
              : event.status === "upcoming"
                ? "bg-accent"
                : "bg-ink-faint"
          }`}
          aria-hidden="true"
        />
        <span className="microlabel">
          {event.status === "live" ? "Live" : event.status === "upcoming" ? "Soon" : "Ended"}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="display text-[clamp(20px,2.6vw,30px)] leading-[1] group-hover:text-accent">
          {event.title}
        </h3>
        <p className="mt-2.5 text-[12px] font-semibold uppercase tracking-wider text-accent">
          {event.ceremony.givingVerb} · {event.ceremony.label}
        </p>
        <p className="mt-1 text-[12.5px] text-ink-faint">
          {event.city}, {country.name} · {event.guestCount} present
        </p>
      </div>

      <div className="flex flex-none items-baseline gap-4 sm:w-[200px] sm:flex-col sm:items-end sm:gap-1">
        <span className="money text-[clamp(18px,2.2vw,26px)] font-bold leading-none">{raised}</span>
        <span className="microlabel !text-ink-faint">{startsInLabel(event)}</span>
      </div>
    </Link>
  );
}
