"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  OwambeEvent,
  eventCountry,
  eventCurrency,
  formatMoney,
  startsInLabel,
  toLocal,
} from "@/lib/event";
import { AccentScope } from "@/components/AccentScope";

/*
  The invitation. One per celebration, the most shared URL in the product.

  The whole top of the page is a solid block of the celebration's cloth
  colour with the names set as large as they will go — an invitation card
  that fills the screen rather than a form.
*/

export function Invitation({ event }: { event: OwambeEvent }) {
  const currency = eventCurrency(event);
  const country = eventCountry(event);
  const { ceremony } = event;
  const isEnded = event.status === "ended";

  const [raisedUsd, setRaisedUsd] = useState(event.seedRaisedUsd);
  useEffect(() => {
    if (event.status !== "live") return;
    const t = setInterval(() => setRaisedUsd((r) => r + Math.round(1 + Math.random() * 40)), 4200);
    return () => clearInterval(t);
  }, [event.status]);

  return (
    <AccentScope event={event} className="min-h-dvh bg-paper text-ink">
      {/* The card: a full block of the cloth colour */}
      <header className="bg-accent text-on-accent">
        <div className="mx-auto max-w-5xl px-5 pb-16 pt-6 sm:px-8">
          <div className="flex items-baseline justify-between">
            <Link href="/" className="display text-[17px]">
              Owambe
            </Link>
            <span className="microlabel !text-on-accent/80">{country.name}</span>
          </div>

          <div className="mt-14 flex items-center gap-2.5">
            <span
              className={`marker ${event.status === "live" ? "live-pulse bg-on-accent" : "bg-on-accent/70"}`}
              aria-hidden="true"
            />
            <span className="microlabel !text-on-accent">{startsInLabel(event)}</span>
          </div>

          <p className="microlabel rise mt-8 !text-on-accent/80">You are invited to</p>
          <h1 className="rise display mt-3 text-[clamp(38px,9.5vw,116px)]">{event.title}</h1>
          <p className="rise mt-6 text-[15px] text-on-accent/90">{event.honouree}</p>

          <div className="rise mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link
              href={isEnded ? `/e/${event.id}/wall` : `/e/${event.id}/hall`}
              className="display cursor-pointer bg-paper px-9 py-5 text-center text-[18px] text-ink transition-colors duration-150 hover:bg-paper-3"
            >
              {isEnded ? "See the wall" : `Enter and ${ceremony.givingVerb.toLowerCase()}`}
            </Link>
            <Link
              href={`/e/${event.id}/wall`}
              className="microlabel cursor-pointer border-2 border-on-accent px-7 py-5 text-center !text-on-accent transition-colors duration-150 hover:bg-on-accent hover:!text-accent"
            >
              Who has given
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        {/* Running total, set enormous */}
        <section className="border-b-2 border-ink py-14">
          <span className="microlabel">{ceremony.totalLabel}</span>
          <div className="money mt-3 text-[clamp(40px,12vw,140px)] font-bold leading-[0.85] tracking-tighter">
            {formatMoney(toLocal(raisedUsd, currency), currency)}
          </div>
          <p className="mt-5 text-[13px] text-ink-mute">
            from {event.guestCount} people, at home and abroad. Whatever you give lands
            in full — the fee is added on top of what you pay, never taken out of what{" "}
            {event.honouree} receives.
          </p>
        </section>

        {/* Details */}
        <section className="grid gap-0 border-b-2 border-ink sm:grid-cols-3">
          <Detail label="Ceremony" value={ceremony.label} />
          <Detail label="Hosted by" value={event.hostName} />
          <Detail label="Cloth of the day" value={event.clothName} />
          <Detail label="Venue" value={event.venue} />
          <Detail label="City" value={`${event.city}, ${country.name}`} />
          <Detail label="Hashtag" value={event.hashtag} />
        </section>

        {/* How giving works here */}
        <section className="border-b-2 border-ink py-14">
          <h2 className="display text-[clamp(24px,4vw,44px)]">
            How it works
            <br />
            <span className="text-accent">at this one</span>
          </h2>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink-mute">
            {ceremony.blurb}
          </p>
        </section>

        {/* Programme */}
        <section className="py-14">
          <h2 className="display text-[clamp(24px,4vw,44px)]">Programme</h2>
          <ol className="stagger mt-6 border-t-2 border-ink">
            {ceremony.programme.map((item, i) => (
              <li key={item.label} className="ledger-row flex items-baseline gap-5 py-4">
                <span className="money w-8 flex-none text-[13px] text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-[15px] font-medium">{item.label}</span>
                {item.local && (
                  <span className="flex-none text-[12px] italic text-ink-faint">{item.local}</span>
                )}
              </li>
            ))}
          </ol>
        </section>
      </main>
    </AccentScope>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-rule px-1 py-6 sm:border-b-0 sm:border-r sm:px-5 sm:last:border-r-0">
      <dt className="microlabel">{label}</dt>
      <dd className="mt-1.5 text-[14px] font-medium leading-snug">{value}</dd>
    </div>
  );
}
