import Link from "next/link";
import { OwambeEvent, eventCountry, eventCurrency, formatMoney, toLocal } from "@/lib/event";
import { makeGuests } from "@/lib/hall";
import { AccentScope } from "@/components/AccentScope";

/*
  The permanent wall (upgrade prompt §9). What survives after the room
  empties: who came, who gave, how much, and the final total.

  Static, no client JavaScript, because this is the page that gets shared
  and it has to open instantly on a bad connection.
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
  const first = guests[guests.length - 1];
  const furthest = guests.find((g) => g.city !== event.city) ?? biggest;

  return (
    <AccentScope event={event} className="min-h-dvh bg-paper text-ink">
      <header className="bg-accent text-on-accent">
        <div className="mx-auto max-w-5xl px-5 pb-14 pt-6 sm:px-8">
          <div className="flex items-baseline justify-between">
            <Link href="/" className="display text-[17px]">
              Owambe
            </Link>
            <Link href={`/e/${event.id}`} className="microlabel !text-on-accent/80">
              The invitation
            </Link>
          </div>

          <p className="microlabel mt-14 !text-on-accent/80">
            {event.status === "ended" ? "This celebration has ended" : "The record so far"}
          </p>
          <h1 className="display mt-3 text-[clamp(34px,8.5vw,104px)]">{event.title}</h1>
          <p className="mt-5 text-[14px] text-on-accent/90">
            {ceremony.label} · {event.venue}, {event.city}, {country.name}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pb-24 sm:px-8">
        <section className="border-b-2 border-ink py-14">
          <span className="microlabel">{ceremony.totalLabel}</span>
          <div className="money mt-3 text-[clamp(40px,12vw,140px)] font-bold leading-[0.85] tracking-tighter">
            {formatMoney(toLocal(totalUsd, currency), currency)}
          </div>
          <p className="mt-5 text-[13px] text-ink-mute">
            from {guests.length} givers · {event.guestCount} people present
          </p>
        </section>

        <section className="grid gap-0 border-b-2 border-ink sm:grid-cols-3">
          <Milestone
            label="Largest single gift"
            value={formatMoney(toLocal(biggest?.givenUsd ?? 0, currency), currency)}
            sub={biggest?.name ?? "—"}
          />
          <Milestone label="First to give" value={first?.name ?? "—"} sub={first?.city ?? "—"} />
          <Milestone
            label="Furthest travelled"
            value={furthest?.city ?? "—"}
            sub={furthest?.name ?? "—"}
          />
        </section>

        <section className="py-14">
          <div className="flex items-baseline justify-between">
            <h2 className="display text-[clamp(24px,4vw,44px)]">Everyone who gave</h2>
            <span className="microlabel">{guests.length} names</span>
          </div>
          <ol className="mt-6 border-t-2 border-ink">
            {guests.map((g, i) => (
              <li key={g.id} className="ledger-row flex items-center gap-5 py-4">
                <span className="money w-8 flex-none text-[13px] text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[16px] font-semibold">{g.name}</span>
                  <span className="block truncate text-[11.5px] text-ink-faint">
                    {ceremony.tierNames[g.tier]} · {g.city}
                  </span>
                </span>
                <span className="money flex-none text-right text-[15px] font-bold">
                  {formatMoney(toLocal(g.givenUsd, currency), currency)}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-8 max-w-xl text-[12px] leading-relaxed text-ink-faint">
            Anyone who gave anonymously is counted in the total but not named here.
            Every amount shown is what the recipient received, in full.
          </p>
        </section>

        <section className="border-t-2 border-ink py-14 text-center">
          <p className="display text-[clamp(20px,3.2vw,34px)]">
            {event.hostName}
            <br />
            <span className="text-accent">thank you all</span>
          </p>
          <Link
            href="/"
            className="microlabel mt-9 inline-block cursor-pointer border-2 border-ink px-7 py-4 transition-colors duration-150 hover:bg-ink hover:!text-paper"
          >
            Other celebrations
          </Link>
        </section>
      </main>
    </AccentScope>
  );
}

function Milestone({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border-b border-rule px-1 py-7 last:border-b-0 sm:border-b-0 sm:border-r sm:px-5 sm:last:border-r-0">
      <div className="microlabel">{label}</div>
      <div className="money mt-2 truncate text-[19px] font-bold">{value}</div>
      <div className="mt-1 truncate text-[12px] text-ink-faint">{sub}</div>
    </div>
  );
}
