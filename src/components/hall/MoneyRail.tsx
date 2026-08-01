"use client";

import { useEffect, useRef } from "react";
import { OwambeEvent, eventCurrency, formatMoney, rateLine, toLocal } from "@/lib/event";
import { Guest, sideClasses } from "@/lib/hall";

/*
  The money rail. The total is the biggest number on the page, because
  the total is the point.
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
  const leadId = board[0]?.id;
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
      className="flex h-full w-full flex-col overflow-y-auto rail-scroll bg-paper"
    >
      {/* The total */}
      <div className="border-b-2 border-ink px-4 pb-5 pt-4">
        <div className="microlabel">{totalLabel}</div>
        <div
          ref={totalRef}
          className="money mt-2 text-[clamp(26px,3.6vw,38px)] font-bold leading-[0.9] tracking-tighter"
          aria-live="off"
        >
          {fmt(toLocal(totalUsd, currency))}
        </div>
        <div className="money mt-2 text-[10.5px] text-ink-faint">
          rate locked · {rateLine(currency)}
        </div>
        {pledgeBased && (
          <div className="mt-3 flex items-baseline justify-between border-t border-rule pt-2.5">
            <span className="microlabel">Outstanding</span>
            <span className="money text-[12px] font-bold text-accent">
              {fmt(toLocal(outstandingUsd, currency))}
            </span>
          </div>
        )}
      </div>

      {/* Two sides */}
      {sides && (
        <div className="border-b border-rule px-4 py-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="microlabel !text-accent">{sides[0].label}</span>
            <span className="microlabel !text-ink">{sides[1].label}</span>
          </div>
          <div
            className="flex h-3 w-full overflow-hidden"
            role="img"
            aria-label={`${sides[0].label} ${pctA} percent, ${sides[1].label} ${100 - pctA} percent`}
          >
            <div className="h-full bg-accent transition-all duration-700" style={{ width: `${pctA}%` }} />
            <div className="h-full flex-1 bg-ink transition-all duration-700" />
          </div>
          <div className="money mt-2 flex justify-between text-[11px] text-ink-mute">
            <span>{fmt(toLocal(usdA, currency))}</span>
            <span>{fmt(toLocal(usdB, currency))}</span>
          </div>
        </div>
      )}

      {/* The board */}
      <div className="flex-1 px-4 py-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="display text-[15px]">{boardLabel}</h2>
          <span className="microlabel">Top 10</span>
        </div>
        <ol className="border-t-2 border-ink">
          {board.map((g, i) => {
            const isLead = g.id === leadId;
            const sc = sideClasses(event, g.side);
            return (
              <li
                key={g.id}
                className={`ledger-row flex items-center gap-2.5 py-2.5 ${
                  isLead ? "bg-accent px-2 text-on-accent" : ""
                }`}
              >
                <span
                  className={`money w-4 flex-none text-[11px] ${
                    isLead ? "text-on-accent/80" : "text-ink-faint"
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className={`flex h-7 w-7 flex-none items-center justify-center text-[10px] font-bold ${
                    isLead ? "bg-on-accent text-accent" : `${sc.bgFaint} text-ink`
                  }`}
                  aria-hidden="true"
                >
                  {initials(g.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">{g.name}</span>
                  <span
                    className={`block truncate text-[10px] ${
                      isLead ? "text-on-accent/75" : "text-ink-faint"
                    }`}
                  >
                    {tierNames[g.tier]} · {g.city}
                  </span>
                </span>
                <span className="money flex-none text-right text-[12px] font-bold">
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
