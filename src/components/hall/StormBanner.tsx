"use client";

import { useEffect, useRef, useState } from "react";
import { OwambeEvent, eventCurrency, formatMoney, formatUsd, toLocal } from "@/lib/event";
import { Storm } from "./useHallEngine";

/*
  The takeover. While a big gift is falling, the giver's name blinks over
  the room and a bar drains for the full length of the storm, so everyone
  can see both whose money it is and how long it is going to last.

  A million naira buys three minutes of the room's attention.
*/

export function StormBanner({ event, storm }: { event: OwambeEvent; storm: Storm }) {
  const currency = eventCurrency(event);
  const barRef = useRef<HTMLDivElement>(null);
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((storm.endsAt - Date.now()) / 1000)),
  );

  /*
    The bar is written straight to the node. Re-rendering this every frame
    for three minutes would be absurd, so React only sees the second count.
  */
  useEffect(() => {
    let raf = 0;
    const total = storm.endsAt - storm.startedAt;
    const tick = () => {
      const left = Math.max(0, storm.endsAt - Date.now());
      if (barRef.current) {
        barRef.current.style.width = `${(left / total) * 100}%`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const secs = setInterval(
      () => setRemaining(Math.max(0, Math.ceil((storm.endsAt - Date.now()) / 1000))),
      500,
    );
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(secs);
    };
  }, [storm.endsAt, storm.startedAt]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  return (
    <div
      className="storm-in pointer-events-none absolute inset-x-0 top-[16%] z-30 px-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="inline-block max-w-full bg-ink px-6 py-5 text-paper sm:px-12 sm:py-7">
        <div className="microlabel !text-paper/60">
          {event.ceremony.givingVerb}ing now
        </div>

        <div className="name-blink display mt-2 break-words text-[clamp(28px,7vw,84px)] leading-[0.92]">
          {storm.giverName}
        </div>

        <div className="money mt-4 text-[clamp(20px,3.4vw,40px)] font-bold leading-none">
          {formatMoney(toLocal(storm.amountUsd, currency), currency)}
        </div>
        <div className="money mt-1.5 text-[12px] text-paper/60">
          {formatUsd(storm.amountUsd)}
        </div>

        {/* How long the room belongs to them */}
        <div className="mt-5 h-1.5 w-full overflow-hidden bg-paper/25">
          <div ref={barRef} className="h-full bg-accent" style={{ width: "100%" }} />
        </div>
        <div className="money mt-2 text-[11px] tabular-nums text-paper/60">
          {mins}:{String(secs).padStart(2, "0")} remaining
        </div>
      </div>
    </div>
  );
}
