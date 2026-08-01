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

/*
  The Ìwé Ìpè — the invitation. One per celebration, the most shared URL
  in the product, and the thing a WhatsApp link preview shows.

  It is an engraved card: rules instead of boxes, the honouree set large
  in the display face, and the running total in mono underneath.
*/

export function Invitation({ event }: { event: OwambeEvent }) {
  const currency = eventCurrency(event);
  const country = eventCountry(event);
  const { ceremony } = event;
  const isEnded = event.status === "ended";

  /* The total drifts upward while the room is live, so the card feels awake. */
  const [raisedUsd, setRaisedUsd] = useState(event.seedRaisedUsd);
  useEffect(() => {
    if (event.status !== "live") return;
    const t = setInterval(
      () => setRaisedUsd((r) => r + Math.round(1 + Math.random() * 40)),
      4200,
    );
    return () => clearInterval(t);
  }, [event.status]);

  return (
    <div className="min-h-dvh bg-ink-deep text-cream">
      <header className="border-b border-rule bg-ink">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link href="/" className="font-display text-[16px] tracking-wide text-cream">
            Owambe
          </Link>
          <span className="microlabel">{country.name}</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24">
        {/* The card */}
        <section className="border-b border-rule-strong py-12 text-center">
          <div className="flex items-center justify-center gap-2">
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
            <span className="microlabel">{startsInLabel(event)}</span>
          </div>

          <div className="microlabel mt-8">You are invited to</div>
          <h1 className="mt-3 font-display text-[clamp(28px,5.5vw,50px)] leading-[1.08] text-cream">
            {event.title}
          </h1>
          <p className="mt-4 text-[13px] text-cream-mute">{event.honouree}</p>

          <div className="mx-auto mt-8 max-w-md border-y border-rule py-5">
            <dl className="grid grid-cols-2 gap-y-4 text-left">
              <Detail label="Ceremony" value={ceremony.label} />
              <Detail label="Hosted by" value={event.hostName} />
              <Detail label="Venue" value={event.venue} />
              <Detail label="City" value={`${event.city}, ${country.name}`} />
              <Detail label="Cloth of the day" value={event.clothName} />
              <Detail label="Hashtag" value={event.hashtag} />
            </dl>
          </div>

          {/* Running total */}
          <div className="mt-8">
            <div className="microlabel">{ceremony.totalLabel}</div>
            <div className="money mt-1 text-[34px] font-bold leading-none text-gold-bright">
              {formatMoney(toLocal(raisedUsd, currency), currency)}
            </div>
            <div className="money mt-1.5 text-[11px] text-cream-faint">
              from {event.guestCount} people, at home and abroad
            </div>
          </div>

          {/* Actions */}
          <div className="mt-9 flex flex-col items-center gap-3">
            {isEnded ? (
              <Link
                href={`/e/${event.id}/wall`}
                className="cursor-pointer border border-gold-deep bg-gold px-8 py-3 text-[14px] font-bold tracking-wide text-ink-well transition-colors duration-150 hover:bg-gold-bright"
              >
                SEE THE WALL
              </Link>
            ) : (
              <Link
                href={`/e/${event.id}/hall`}
                className="cursor-pointer border border-gold-deep bg-gold px-8 py-3 text-[14px] font-bold tracking-wide text-ink-well transition-colors duration-150 hover:bg-gold-bright"
              >
                ENTER THE HALL
              </Link>
            )}
            <Link
              href={`/e/${event.id}/wall`}
              className="microlabel cursor-pointer !text-cream-faint underline-offset-4 transition-colors duration-200 hover:!text-cream hover:underline"
            >
              {isEnded ? "Back to all celebrations" : "See who has given so far"}
            </Link>
          </div>
        </section>

        {/* How giving works here */}
        <section className="border-b border-rule py-8">
          <h2 className="font-display text-[18px] text-cream">
            How {ceremony.givingNoun} work at {ceremony.label.toLowerCase()}
          </h2>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-cream-mute">
            {ceremony.blurb}
          </p>
          <p className="mt-3 max-w-xl text-[12px] leading-relaxed text-cream-faint">
            Whatever you give lands in full. The platform fee is added on top of what
            you pay, never taken out of what {event.honouree} receives, and the rate
            is shown and locked before you confirm.
          </p>
        </section>

        {/* Programme */}
        <section className="py-8">
          <h2 className="font-display text-[18px] text-cream">Programme of the day</h2>
          <ol className="mt-3">
            {ceremony.programme.map((item, i) => (
              <li key={item.label} className="ledger-row flex items-baseline gap-3 py-2.5">
                <span className="money w-5 flex-none text-[11px] text-cream-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-[13px] text-cream">{item.label}</span>
                {item.local && (
                  <span className="flex-none text-[11px] italic text-cream-faint">
                    {item.local}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-1">
      <dt className="microlabel">{label}</dt>
      <dd className="mt-0.5 text-[12.5px] leading-snug text-cream">{value}</dd>
    </div>
  );
}
