"use client";

import { Guest, PARTY, PROGRAMME } from "@/lib/hall";
import { FloatingEmote, Shoutout } from "./useHallEngine";

/*
  The live floor: host video is the centre of gravity but not the whole
  screen. Mock stream stands in for WebRTC/HLS. Emotes float over the
  floor; the MC shout-out banner sits at the base of the video.
*/

export function LiveFloor({
  guests,
  emotes,
  shoutout,
  programmeIndex,
  rainActive,
}: {
  guests: Guest[];
  emotes: FloatingEmote[];
  shoutout: Shoutout | null;
  programmeIndex: number;
  rainActive: boolean;
}) {
  const you = guests.find((g) => g.isYou);
  const tables = new Map<number, Guest[]>();
  for (const g of guests) {
    tables.set(g.table, [...(tables.get(g.table) ?? []), g]);
  }
  const tableNumbers = [...tables.keys()].sort((a, b) => a - b);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      {/* Programme strip */}
      <div
        className="flex items-center gap-0 overflow-x-auto border-b border-rule bg-ink"
        aria-label="Programme of the day"
      >
        {PROGRAMME.map((item, i) => {
          const state = i < programmeIndex ? "done" : i === programmeIndex ? "now" : "next";
          return (
            <div
              key={item.label}
              className={`flex flex-none items-center gap-1.5 border-r border-rule px-3 py-2 ${
                state === "now" ? "bg-ink-raised" : ""
              }`}
            >
              <span
                className={`marker ${
                  state === "done" ? "bg-cream-faint" : state === "now" ? "bg-aso" : "bg-rule-strong"
                }`}
                aria-hidden="true"
              />
              <span
                className={`whitespace-nowrap text-[11px] ${
                  state === "now"
                    ? "font-semibold text-cream"
                    : state === "done"
                      ? "text-cream-faint line-through decoration-rule-strong"
                      : "text-cream-mute"
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Video well */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-ink-well">
        {/* mock live stream: adire-derived backdrop for ceremonial moments only */}
        <div className="absolute inset-0" aria-hidden="true">
          <AdireBackdrop />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="microlabel mb-3 !text-cream-faint">Live from {PARTY.venue}</div>
            <h1 className="px-4 text-center font-display text-[clamp(26px,4.5vw,44px)] leading-tight text-cream">
              {PARTY.title}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="microlabel !text-cream-mute">{PARTY.type}</span>
              <span className="microlabel !text-aso">{PARTY.hashtag}</span>
            </div>
            <div className="mt-5 border-t border-rule pt-3">
              <span className="microlabel !text-cream-faint">
                First dance · the floor is open for spraying
              </span>
            </div>
          </div>
        </div>

        {/* LIVE marker */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 border border-rule-strong bg-ink-well/80 px-2 py-1">
          <span className="marker live-pulse bg-live" aria-hidden="true" />
          <span className="microlabel !text-cream">Live</span>
          <span className="money ml-1 text-[10px] text-cream-faint">{guests.length + 187} watching</span>
        </div>

        {/* Aso-ebi of the party */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5 border border-rule-strong bg-ink-well/80 px-2 py-1">
          <span className="marker bg-aso" aria-hidden="true" />
          <span className="marker bg-gold" aria-hidden="true" />
          <span className="microlabel !text-cream">Aso-ebi · {PARTY.asoEbiName}</span>
        </div>

        {/* Floating emotes */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {emotes.map((e) => (
            <span
              key={e.id}
              className="emote-float microlabel absolute bottom-[18%] border border-rule-strong bg-ink-well/85 px-2 py-1 !text-cream"
              style={{ left: `${e.x * 100}%` }}
            >
              {e.label}
              <span className="ml-1.5 !normal-case !tracking-normal text-cream-faint">{e.guestName}</span>
            </span>
          ))}
        </div>

        {/* MC shout-out banner */}
        <div aria-live="polite" className="absolute inset-x-0 bottom-0">
          {shoutout && (
            <div className="shoutout-enter flex items-baseline gap-2 border-t-2 border-gold bg-ink-well/92 px-4 py-2.5">
              <span className="microlabel flex-none !text-gold">MC on the mic</span>
              <span className="min-w-0 truncate font-display text-[15px] text-cream">
                Gbedu for {shoutout.guestName}!
              </span>
              <span className="money flex-none text-[14px] font-bold text-gold-bright">
                ${shoutout.amountUsd}
              </span>
              {shoutout.message && (
                <span className="min-w-0 truncate text-[12px] italic text-cream-mute">
                  “{shoutout.message}”
                </span>
              )}
            </div>
          )}
        </div>

        {/* Rain wash */}
        {rainActive && (
          <div
            className="pointer-events-none absolute inset-0 bg-gold/10"
            style={{ animation: "rain-enter var(--t-ceremony) var(--ease-ceremony)" }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Tables: guests seated, your table highlighted */}
      <div className="flex gap-0 overflow-x-auto border-t border-rule bg-ink" aria-label="Tables">
        {tableNumbers.map((t) => {
          const seated = tables.get(t)!;
          const isYours = t === you?.table;
          return (
            <div
              key={t}
              className={`flex flex-none flex-col gap-1.5 border-r border-rule px-3 py-2.5 ${
                isYours ? "left-rule-aso bg-ink-raised" : ""
              }`}
            >
              <span className="microlabel">
                Table {t}
                {isYours ? " · yours" : ""}
              </span>
              <div className="flex gap-1">
                {seated.map((g) => (
                  <span
                    key={g.id}
                    title={`${g.name} · ${g.side === "bride" ? "Bride's side" : "Groom's side"} · ${g.city}`}
                    className={`flex h-6 w-6 cursor-pointer items-center justify-center border text-[9px] font-semibold transition-colors duration-150 ${
                      g.isYou
                        ? "border-aso bg-aso/25 text-cream"
                        : g.side === "bride"
                          ? "border-rule-strong bg-bride/15 text-cream-mute hover:text-cream"
                          : "border-rule-strong bg-groom/15 text-cream-mute hover:text-cream"
                    }`}
                  >
                    {g.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Adire-derived pattern, low contrast, ceremonial backdrop only. */
function AdireBackdrop() {
  return (
    <svg className="absolute inset-0 h-full w-full opacity-[0.05]" aria-hidden="true">
      <defs>
        <pattern id="adire" width="56" height="56" patternUnits="userSpaceOnUse">
          <circle cx="14" cy="14" r="9" fill="none" stroke="#efe7d6" strokeWidth="1" />
          <circle cx="14" cy="14" r="4" fill="none" stroke="#efe7d6" strokeWidth="1" />
          <circle cx="42" cy="42" r="9" fill="none" stroke="#efe7d6" strokeWidth="1" />
          <circle cx="42" cy="42" r="4" fill="none" stroke="#efe7d6" strokeWidth="1" />
          <path d="M28 0v56M0 28h56" stroke="#efe7d6" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#adire)" />
    </svg>
  );
}
