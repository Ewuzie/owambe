"use client";

import { useEffect, useRef } from "react";
import { OwambeEvent, eventCurrency, formatMoney, rateLine, toLocal } from "@/lib/event";
import { Guest, sideClasses } from "@/lib/hall";

/*
  The money rail: live total, the board, the family meter. Gold is used
  here and almost nowhere else — this rail is what gold is for.

  Every label comes from the ceremony, so a Ghanaian funeral shows a
  donation table rather than a leaderboard of spenders.
*/

function useTickingTotal(target: number, format: (n: number) => string) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = useRef(target);
  const formatRef = useRef(format);
  useEffect(() => {
    formatRef.current = format;
  }, [format]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const settle = () => {
      shown.current = target;
      el.textContent = formatRef.current(target);
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.hidden) {
      settle();
      return;
    }
    let raf = 0;
    const step = () => {
      const diff = target - shown.current;
      if (Math.abs(diff) < 50) {
        settle();
        return;
      }
      shown.current += diff * 0.12;
      el.textContent = formatRef.current(shown.current);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const onVisibility = () => {
      if (document.hidden) settle();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [target]);

  return ref;
}

export function MoneyRail({
  event,
  guests,
  totalUsd,
  outstandingUsd,
}: {
  event: OwambeEvent;
  guests: Guest[];
  totalUsd: number;
  outstandingUsd: number;
}) {
  const currency = eventCurrency(event);
  const fmt = (n: number) => formatMoney(n, currency);
  const totalRef = useTickingTotal(toLocal(totalUsd, currency), fmt);

  const board = [...guests].sort((a, b) => b.givenUsd - a.givenUsd).slice(0, 10);
  const crownId = board[0]?.id;
  const { tierNames, sides, totalLabel, boardLabel, pledgeBased } = event.ceremony;

  const usdA = sides
    ? guests.filter((g) => g.side === sides[0].key).reduce((s, g) => s + g.givenUsd, 0)
    : 0;
  const usdB = sides
    ? guests.filter((g) => g.side === sides[1].key).reduce((s, g) => s + g.givenUsd, 0)
    : 0;
  const pctA = Math.round((usdA / Math.max(1, usdA + usdB)) * 100);

  return (
    <aside
      aria-label="Money rail"
      className="flex h-full w-full flex-col overflow-y-auto rail-scroll bg-ink"
    >
      {/* Live total */}
      <div className="border-b border-rule px-4 pb-4 pt-4">
        <div className="microlabel">{totalLabel}</div>
        <div
          ref={totalRef}
          className="money mt-1 text-right text-[26px] font-bold leading-none text-gold-bright"
          aria-live="off"
        >
          {fmt(toLocal(totalUsd, currency))}
        </div>
        <div className="money mt-1 text-right text-[11px] text-cream-faint">
          rate locked · {rateLine(currency)}
        </div>
        {pledgeBased && (
          <div className="ledger-row mt-3 flex items-baseline justify-between border-b-0 border-t border-rule pt-2">
            <span className="microlabel">Still outstanding</span>
            <span className="money text-[12px] text-cream-mute">
              {fmt(toLocal(outstandingUsd, currency))}
            </span>
          </div>
        )}
      </div>

      {/* Two-sided meter */}
      {sides && (
        <div className="border-b border-rule px-4 py-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="microlabel">{sides[0].label}</span>
            <span className="microlabel">{sides[1].label}</span>
          </div>
          <div
            className="flex h-[10px] w-full overflow-hidden border border-rule-strong"
            role="img"
            aria-label={`${sides[0].label} ${pctA} percent, ${sides[1].label} ${100 - pctA} percent`}
          >
            <div className="h-full bg-side-a transition-all duration-700" style={{ width: `${pctA}%` }} />
            <div className="h-full flex-1 bg-side-b transition-all duration-700" />
          </div>
          <div className="money mt-1.5 flex justify-between text-[11px] text-cream-mute">
            <span>{fmt(toLocal(usdA, currency))}</span>
            <span>{fmt(toLocal(usdB, currency))}</span>
          </div>
        </div>
      )}

      {/* The board */}
      <div className="flex-1 px-4 py-4">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="font-display text-[15px] text-cream">{boardLabel}</h2>
          <span className="microlabel">Top 10</span>
        </div>
        <ol className="mt-2">
          {board.map((g, i) => {
            const isCrown = g.id === crownId;
            const sc = sideClasses(event, g.side);
            return (
              <li
                key={g.id}
                className={`ledger-row flex items-center gap-2.5 py-2 ${
                  isCrown ? "left-rule-gold pl-2.5" : "pl-[12px]"
                }`}
              >
                <span className="money w-4 flex-none text-[11px] text-cream-faint">{i + 1}</span>
                <span
                  className={`flex h-7 w-7 flex-none items-center justify-center border text-[11px] font-semibold ${
                    isCrown
                      ? "border-gold-deep bg-gold text-ink-well"
                      : `border-rule-strong ${sc.bgSoft} text-cream`
                  }`}
                  aria-hidden="true"
                >
                  {initials(g.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[13px] ${isCrown ? "text-gold-bright" : "text-cream"}`}>
                    {g.name}
                    {isCrown && (
                      <CrownIcon className="ml-1.5 inline-block h-3 w-3 align-baseline text-gold-bright" />
                    )}
                  </span>
                  <span className="block truncate text-[10.5px] text-cream-faint">
                    {tierNames[g.tier]} · {g.city}
                  </span>
                </span>
                <span
                  className={`money flex-none text-right text-[12px] ${
                    isCrown ? "text-gold-bright" : "text-cream-mute"
                  }`}
                >
                  {fmt(toLocal(g.givenUsd, currency))}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Leading giver">
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-1.8 10H4.8L3 8z" />
    </svg>
  );
}
