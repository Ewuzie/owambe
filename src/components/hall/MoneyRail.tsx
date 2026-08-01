"use client";

import { useEffect, useRef } from "react";
import { OwambeEvent, formatMoney, rateLine } from "@/lib/event";
import { Guest, sideClasses } from "@/lib/hall";

/*
  The money rail: live total, the Owambe Board top ten, the family war
  meter, milestones. Gold is used here and almost nowhere else — this
  rail is what gold is for.
*/

/**
 * Ticking total. The true figure is what React renders, so the number is
 * always correct even when frames are suspended (hidden tab) or motion is
 * reduced. The animation only paints the intermediate steps on the way
 * there — the total ticks up rather than jumping, and never lies.
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

    /* Snap to the truth whenever we cannot animate to it: reduced motion,
       or a hidden tab where frames are suspended. React has already
       rendered the true figure, so there is nothing to correct. */
    const settle = () => {
      shown.current = target;
      el.textContent = formatRef.current(target);
    };
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.hidden
    ) {
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

    /* Going away mid-tick would strand a half-counted number on screen. */
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
  totalLocal,
}: {
  event: OwambeEvent;
  guests: Guest[];
  totalLocal: number;
}) {
  const currency = event.currency;
  const fmt = (n: number) => formatMoney(n, currency);
  const totalRef = useTickingTotal(totalLocal, fmt);

  const board = [...guests].sort((a, b) => b.givenLocal - a.givenLocal).slice(0, 10);
  const crownId = board[0]?.id;
  const tierNames = event.ceremony.tierNames;
  const sides = event.ceremony.sides;

  const totalA = sides
    ? guests.filter((g) => g.side === sides[0].key).reduce((s, g) => s + g.givenLocal, 0)
    : 0;
  const totalB = sides
    ? guests.filter((g) => g.side === sides[1].key).reduce((s, g) => s + g.givenLocal, 0)
    : 0;
  const pctA = Math.round((totalA / Math.max(1, totalA + totalB)) * 100);

  return (
    <aside
      aria-label="Money rail"
      className="flex h-full w-full flex-col overflow-y-auto rail-scroll bg-ink"
    >
      {/* Live total */}
      <div className="border-b border-rule px-4 pb-4 pt-4">
        <div className="microlabel">Sprayed tonight</div>
        <div
          ref={totalRef}
          className="money mt-1 text-right text-[26px] font-bold leading-none text-gold-bright"
          aria-live="off"
        >
          {fmt(totalLocal)}
        </div>
        <div className="money mt-1 text-right text-[11px] text-cream-faint">
          rate locked · {rateLine(currency)}
        </div>
      </div>

      {/* Family war meter */}
      {sides && (
        <div className="border-b border-rule px-4 py-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="microlabel">{sides[0].label}</span>
            <span className="microlabel">{sides[1].label}</span>
          </div>
          <div
            className="flex h-[10px] w-full overflow-hidden border border-rule-strong"
            role="img"
            aria-label={`Family war meter: ${sides[0].label} ${pctA} percent, ${sides[1].label} ${100 - pctA} percent`}
          >
            <div
              className="h-full bg-side-a transition-all duration-700"
              style={{ width: `${pctA}%` }}
            />
            <div className="h-full flex-1 bg-side-b transition-all duration-700" />
          </div>
          <div className="money mt-1.5 flex justify-between text-[11px] text-cream-mute">
            <span>{fmt(totalA)}</span>
            <span>{fmt(totalB)}</span>
          </div>
        </div>
      )}

      {/* The Owambe Board */}
      <div className="flex-1 px-4 py-4">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="font-display text-[15px] text-cream">The Owambe Board</h2>
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
                <span className="money w-4 flex-none text-[11px] text-cream-faint">
                  {i + 1}
                </span>
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
                <span className={`money flex-none text-right text-[12px] ${isCrown ? "text-gold-bright" : "text-cream-mute"}`}>
                  {fmt(g.givenLocal)}
                </span>
              </li>
            );
          })}
        </ol>
        {crownId && (
          <p className="mt-3 text-[11px] leading-snug text-cream-faint">
            <span className="text-gold">Big Spender</span> holds the crown until they are
            overtaken. Losing it is a notification.
          </p>
        )}
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
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-label="Big Spender crown">
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-1.8 10H4.8L3 8z" />
    </svg>
  );
}
