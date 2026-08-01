"use client";

import Link from "next/link";
import { OwambeEvent, eventCountry } from "@/lib/event";
import { Guest, sideClasses } from "@/lib/hall";
import { FloatingEmote, Shoutout } from "./useHallEngine";

/*
  The live floor. The stage is a solid block of the celebration's cloth
  colour with the names set as large as they fit — the loudest thing on
  the screen, standing in for the video a provider will supply later.
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
    <div className="flex h-full min-h-0 min-w-0 flex-col bg-paper">
      {/* Programme strip */}
      <div
        className="flex items-center overflow-x-auto border-b border-rule bg-paper"
        aria-label="Programme"
      >
        {programme.map((item, i) => {
          const state = i < programmeIndex ? "done" : i === programmeIndex ? "now" : "next";
          return (
            <div
              key={item.label}
              className={`flex flex-none items-center gap-2 border-r border-rule px-4 py-2.5 ${
                state === "now" ? "bg-accent" : ""
              }`}
            >
              <span
                className={`marker ${
                  state === "done"
                    ? "bg-ink-faint"
                    : state === "now"
                      ? "bg-on-accent"
                      : "bg-rule-strong"
                }`}
                aria-hidden="true"
              />
              <span
                className={`whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider ${
                  state === "now"
                    ? "text-on-accent"
                    : state === "done"
                      ? "text-ink-faint line-through"
                      : "text-ink-mute"
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* The stage */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-accent text-on-accent">
        <div className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
          <span className="microlabel !text-on-accent/75">
            {event.venue}, {event.city}
          </span>
          <h1 className="display mt-4 text-[clamp(26px,6vw,72px)]">{event.title}</h1>
          <span className="microlabel mt-5 !text-on-accent/85">{now?.label}</span>
        </div>

        <div className="absolute left-4 top-4 flex items-center gap-2 border-2 border-on-accent px-2.5 py-1.5">
          <span className="marker live-pulse bg-on-accent" aria-hidden="true" />
          <span className="microlabel !text-on-accent">Live</span>
          <span className="money ml-1 text-[11px] font-bold text-on-accent">
            {event.guestCount}
          </span>
        </div>

        <div className="absolute right-4 top-4 border-2 border-on-accent px-2.5 py-1.5">
          <span className="microlabel !text-on-accent">{event.clothName}</span>
        </div>

        {/* Floating gestures */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {emotes.map((e) => (
            <span
              key={e.id}
              className="emote-float microlabel absolute bottom-[20%] bg-paper px-2.5 py-1.5 !text-ink"
              style={{ left: `${e.x * 100}%` }}
            >
              {e.label}
              <span className="ml-2 !normal-case !tracking-normal text-ink-faint">
                {e.guestName}
              </span>
            </span>
          ))}
        </div>

        {/* Announcement */}
        <div aria-live="polite" className="absolute inset-x-0 bottom-0">
          {shoutout && (
            <div className="shoutout-enter flex items-baseline gap-3 bg-ink px-4 py-3 text-paper">
              <span className="microlabel flex-none !text-paper/70">
                {event.ceremony.style === "donation" ? "The clerk reads" : "On the mic"}
              </span>
              <span className="display min-w-0 truncate text-[17px]">
                {shoutout.guestName}
              </span>
              <span className="money flex-none text-[16px] font-bold">
                ${shoutout.amountUsd}
              </span>
              {shoutout.message && (
                <span className="min-w-0 truncate text-[12px] italic text-paper/70">
                  “{shoutout.message}”
                </span>
              )}
            </div>
          )}
        </div>

        {surgeActive && (
          <div
            className="pointer-events-none absolute inset-0 bg-on-accent/15"
            style={{ animation: "rain-enter var(--t-ceremony) var(--ease-ceremony)" }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Tables */}
      <div className="flex overflow-x-auto border-t border-rule bg-paper" aria-label="Tables">
        {tableNumbers.map((t) => {
          const seated = tables.get(t)!;
          const isYours = t === you?.table;
          return (
            <div
              key={t}
              className={`flex flex-none flex-col gap-2 border-r border-rule px-4 py-3 ${
                isYours ? "bg-paper-2" : ""
              }`}
            >
              <span className="microlabel">
                Table {t}
                {isYours ? " · yours" : ""}
              </span>
              <div className="flex gap-1.5">
                {seated.map((g) => {
                  const sc = sideClasses(event, g.side);
                  const sideLabel = sides?.find((s) => s.key === g.side)?.label;
                  return (
                    <span
                      key={g.id}
                      title={`${g.name}${sideLabel ? ` · ${sideLabel}` : ""} · ${g.city}`}
                      className={`flex h-7 w-7 cursor-pointer items-center justify-center text-[9.5px] font-bold transition-colors duration-150 ${
                        g.isYou ? "bg-accent text-on-accent" : `${sc.bgFaint} text-ink`
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
          className="microlabel flex flex-none items-center border-r border-rule px-5 transition-colors duration-150 hover:bg-paper-2 hover:!text-ink"
        >
          {eventCountry(event).name} · invitation
        </Link>
      </div>
    </div>
  );
}
