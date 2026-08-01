import Link from "next/link";
import {
  OwambeEvent,
  eventCountry,
  eventCurrency,
  formatMoney,
  toLocal,
} from "@/lib/event";
import { makeGuests } from "@/lib/hall";

/*
  The permanent wall (upgrade prompt §9). What survives after the room
  empties: who came, who gave, how much, and the final total.

  This solves a real problem — families genuinely have no reliable record
  of who gave what, and thank-you notes are guesswork. It is also the
  most shareable surface in the product, so it renders as a static page
  with no client JavaScript.

  Persistence lands in U1.0; today this reads the same seeded data the
  hall does, so the numbers agree.
*/

export function EventWall({ event }: { event: OwambeEvent }) {
  const currency = eventCurrency(event);
  const country = eventCountry(event);
  const guests = makeGuests(event)
    .filter((g) => !g.isYou && g.givenUsd > 0)
    .sort((a, b) => b.givenUsd - a.givenUsd);

  const totalUsd = guests.reduce((s, g) => s + g.givenUsd, 0);
  const { ceremony } = event;
  const biggest = guests[0];
  const furthest = guests.find((g) => g.city !== event.city) ?? guests[0];

  return (
    <div className="min-h-dvh bg-ink-deep text-cream">
      <header className="border-b border-rule bg-ink">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3">
          <Link href="/" className="font-display text-[16px] tracking-wide text-cream">
            Owambe
          </Link>
          <Link
            href={`/e/${event.id}`}
            className="microlabel cursor-pointer !text-cream-faint transition-colors duration-200 hover:!text-cream"
          >
            The invitation
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-24">
        <section className="border-b border-rule-strong py-12 text-center">
          <div className="microlabel">
            {event.status === "ended" ? "This celebration has ended" : "The record so far"}
          </div>
          <h1 className="mt-3 font-display text-[clamp(26px,5vw,44px)] leading-[1.08] text-cream">
            {event.title}
          </h1>
          <p className="mt-3 text-[12.5px] text-cream-mute">
            {ceremony.label} · {event.venue}, {event.city}, {country.name}
          </p>

          <div className="mt-9">
            <div className="microlabel">{ceremony.totalLabel}</div>
            <div className="money mt-1 text-[38px] font-bold leading-none text-gold-bright">
              {formatMoney(toLocal(totalUsd, currency), currency)}
            </div>
            <div className="money mt-2 text-[11px] text-cream-faint">
              from {guests.length} givers · {event.guestCount} people present
            </div>
          </div>
        </section>

        {/* Milestones */}
        <section className="grid gap-0 border-b border-rule sm:grid-cols-3">
          <Milestone
            label="Largest single gift"
            value={formatMoney(toLocal(biggest?.givenUsd ?? 0, currency), currency)}
            sub={biggest?.name ?? "—"}
          />
          <Milestone
            label="First to give"
            value={guests[guests.length - 1]?.name ?? "—"}
            sub={guests[guests.length - 1]?.city ?? "—"}
          />
          <Milestone
            label="Furthest travelled"
            value={furthest?.city ?? "—"}
            sub={furthest?.name ?? "—"}
          />
        </section>

        {/* The ledger */}
        <section className="py-8">
          <div className="flex items-baseline justify-between border-b border-rule-strong pb-2">
            <h2 className="font-display text-[18px] text-cream">Everyone who gave</h2>
            <span className="microlabel">{guests.length} names</span>
          </div>
          <ol className="mt-1">
            {guests.map((g, i) => (
              <li key={g.id} className="ledger-row flex items-center gap-3 py-2.5">
                <span className="money w-6 flex-none text-[11px] text-cream-faint">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] text-cream">{g.name}</span>
                  <span className="block truncate text-[10.5px] text-cream-faint">
                    {ceremony.tierNames[g.tier]} · {g.city}
                  </span>
                </span>
                <span className="money flex-none text-right text-[13px] text-cream-mute">
                  {formatMoney(toLocal(g.givenUsd, currency), currency)}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-5 max-w-xl text-[11.5px] leading-relaxed text-cream-faint">
            Anyone who chose to give anonymously is counted in the total but not
            named here. Every amount shown is what the recipient received, in full.
          </p>
        </section>

        <section className="border-t border-rule py-8 text-center">
          <p className="text-[13px] text-cream-mute">
            {event.hostName} thanks everyone who stood with them.
          </p>
          <Link
            href="/"
            className="microlabel mt-5 inline-block cursor-pointer border border-rule-strong px-5 py-2.5 !text-cream transition-colors duration-200 hover:border-cream-mute"
          >
            See other celebrations
          </Link>
        </section>
      </main>
    </div>
  );
}

function Milestone({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border-b border-rule px-1 py-5 last:border-b-0 sm:border-b-0 sm:border-r sm:px-4 sm:last:border-r-0">
      <div className="microlabel">{label}</div>
      <div className="money mt-1.5 truncate text-[15px] text-cream">{value}</div>
      <div className="mt-0.5 truncate text-[11px] text-cream-faint">{sub}</div>
    </div>
  );
}
