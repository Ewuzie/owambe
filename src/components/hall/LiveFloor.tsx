"use client";

import Link from "next/link";
import { OwambeEvent, eventCountry } from "@/lib/event";
import { Guest, sideClasses } from "@/lib/hall";
import { FloatingEmote, Shoutout } from "./useHallEngine";

/*
  The live floor. Host video is the centre of gravity but not the whole
  screen. The mock stream stands in for a provider (the prompt forbids
  building streaming ourselves).
*/

export function LiveFloor({
  event,
  guests,
  emotes,
  shoutout,
  programmeIndex,
  surgeActive,
}: {
  event: OwambeEvent;
  guests: Guest[];
  emotes: FloatingEmote[];
  shoutout: Shoutout | null;
  programmeIndex: number;
  surgeActive: boolean;
}) {
  const you = guests.find((g) => g.isYou);
  const tables = new Map<number, Guest[]>();
  for (const g of guests) tables.set(g.table, [...(tables.get(g.table) ?? []), g]);
  const tableNumbers = [...tables.keys()].sort((a, b) => a - b);
  const { sides, programme } = event.ceremony;
  const now = programme[programmeIndex];

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      {/* Programme strip */}
      <div
        className="flex items-center gap-0 overflow-x-auto border-b border-rule bg-ink"
        aria-label="Programme"
      >
        {programme.map((item, i) => {
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
        <div className="absolute inset-0" aria-hidden="true">
          <AdireBackdrop />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
            <div className="microlabel mb-3 !text-cream-faint">
              Live from {event.venue}, {event.city}
            </div>
            <h1 className="text-center font-display text-[clamp(24px,4.2vw,42px)] leading-tight text-cream">
              {event.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <span className="microlabel !text-cream-mute">{event.ceremony.label}</span>
              <span className="microlabel !text-aso">{event.hashtag}</span>
            </div>
            <div className="mt-5 border-t border-rule pt-3">
              <span className="microlabel !text-cream-faint">{now?.label}</span>
            </div>
          </div>
        </div>

        <div className="absolute left-3 top-3 flex items-center gap-1.5 border border-rule-strong bg-ink-well/80 px-2 py-1">
          <span className="marker live-pulse bg-live" aria-hidden="true" />
          <span className="microlabel !text-cream">Live</span>
          <span className="money ml-1 text-[10px] text-cream-faint">
            {event.guestCount} watching
          </span>
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-1.5 border border-rule-strong bg-ink-well/80 px-2 py-1">
          <span className="marker bg-aso" aria-hidden="true" />
          <span className="marker bg-gold" aria-hidden="true" />
          <span className="microlabel !text-cream">{event.clothName}</span>
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
              <span className="ml-1.5 !normal-case !tracking-normal text-cream-faint">
                {e.guestName}
              </span>
            </span>
          ))}
        </div>

        {/* Announcement banner */}
        <div aria-live="polite" className="absolute inset-x-0 bottom-0">
          {shoutout && (
            <div className="shoutout-enter flex items-baseline gap-2 border-t-2 border-gold bg-ink-well/92 px-4 py-2.5">
              <span className="microlabel flex-none !text-gold">
                {event.ceremony.style === "donation" ? "The clerk reads" : "On the mic"}
              </span>
              <span className="min-w-0 truncate font-display text-[15px] text-cream">
                {shoutout.guestName}
                {shoutout.pledged ? " has pledged" : ""}!
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

        {surgeActive && (
          <div
            className="pointer-events-none absolute inset-0 bg-gold/10"
            style={{ animation: "rain-enter var(--t-ceremony) var(--ease-ceremony)" }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Tables */}
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
                {seated.map((g) => {
                  const sc = sideClasses(event, g.side);
                  const sideLabel = sides?.find((s) => s.key === g.side)?.label;
                  return (
                    <span
                      key={g.id}
                      title={`${g.name}${sideLabel ? ` · ${sideLabel}` : ""} · ${g.city}`}
                      className={`flex h-6 w-6 cursor-pointer items-center justify-center border text-[9px] font-semibold transition-colors duration-150 ${
                        g.isYou
                          ? "border-aso bg-aso/25 text-cream"
                          : `border-rule-strong ${sc.bgFaint} text-cream-mute hover:text-cream`
                      }`}
                    >
                      {g.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
        <Link
          href={`/e/${event.id}`}
          className="microlabel flex flex-none items-center border-r border-rule px-4 !text-cream-faint transition-colors duration-200 hover:!text-cream"
        >
          {eventCountry(event).name} · view invitation
        </Link>
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
