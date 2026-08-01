"use client";

import { useEffect, useRef, useState } from "react";
import {
  DENOMINATIONS_USD,
  FEE_RATE,
  OwambeEvent,
  celebrantReceives,
  eventCurrency,
  feeUsd,
  formatMoney,
  formatUsd,
  giverPaysUsd,
  rateLine,
  toLocal,
} from "@/lib/event";

/*
  The giving deck. Denominations, not amounts.

  The gesture matches the ceremony. You THROW at a wedding, because that
  is what spraying is. You do not throw money at a funeral or into a
  savings pot — there you confirm an entry at a table.

  Money model: the GIVER pays the fee, so the gift lands whole.
*/

export function SprayDeck({
  open,
  event,
  onClose,
  onGive,
}: {
  open: boolean;
  event: OwambeEvent;
  onClose: () => void;
  onGive: (amountUsd: number, opts: { message?: string; anonymous: boolean }) => void;
}) {
  if (!open) return null;
  return <GiveSheet event={event} onClose={onClose} onGive={onGive} />;
}

function GiveSheet({
  event,
  onClose,
  onGive,
}: {
  event: OwambeEvent;
  onClose: () => void;
  onGive: (amountUsd: number, opts: { message?: string; anonymous: boolean }) => void;
}) {
  const [denom, setDenom] = useState<number>(20);
  const [count, setCount] = useState(1);
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragStartY = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragDy, setDragDy] = useState(0);

  const amount = denom * count;
  const currency = eventCurrency(event);
  const { givingVerb, style, pledgeBased } = event.ceremony;
  const isThrow = style === "spray";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    sheetRef.current?.focus();
  }, []);

  const doGive = () => {
    onGive(amount, { message: message.trim() || undefined, anonymous });
    onClose();
  };

  const startHold = (clientY: number) => {
    if (!isThrow) return;
    dragStartY.current = clientY;
    setDragging(true);
    setDragDy(0);
    holdTimer.current = setInterval(() => setCount((c) => Math.min(20, c + 1)), 350);
  };

  const moveHold = (clientY: number) => {
    if (dragStartY.current === null) return;
    setDragDy(Math.max(0, dragStartY.current - clientY));
  };

  const endHold = () => {
    if (holdTimer.current) clearInterval(holdTimer.current);
    holdTimer.current = null;
    const threw = dragDy > 48;
    setDragging(false);
    setDragDy(0);
    dragStartY.current = null;
    if (threw) doGive();
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end" role="presentation">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-pointer bg-ink/60" />

      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${givingVerb} deck`}
        tabIndex={-1}
        className="relative z-10 w-full border-t-4 border-ink bg-paper outline-none"
      >
        {/* Header */}
        <div className="flex items-end justify-between gap-4 bg-accent px-5 py-4 text-on-accent">
          <div className="min-w-0">
            <div className="microlabel !text-on-accent/80">
              {givingVerb} for {event.honouree}
            </div>
            <div className="display mt-1.5 truncate text-[22px]">
              {count > 1 ? `${count} × ` : ""}
              {formatUsd(denom)}
            </div>
          </div>
          <div className="money flex-none text-right text-[26px] font-bold leading-none">
            {formatMoney(toLocal(amount, currency), currency)}
          </div>
        </div>

        {/* Denominations */}
        <div role="radiogroup" aria-label="Amount" className="grid grid-cols-5 border-b border-rule">
          {DENOMINATIONS_USD.map((d) => (
            <button
              key={d}
              role="radio"
              aria-checked={denom === d}
              aria-label={`${formatUsd(d)}, ${formatMoney(toLocal(d, currency), currency)}`}
              onClick={() => {
                setDenom(d);
                setCount(1);
              }}
              className={`cursor-pointer border-r border-rule px-2 py-4 text-center transition-colors duration-150 last:border-r-0 ${
                denom === d ? "bg-ink text-paper" : "hover:bg-paper-2"
              }`}
            >
              <span className="money block text-[17px] font-bold">${d}</span>
              <span
                className={`money block text-[10px] ${denom === d ? "text-paper/70" : "text-ink-faint"}`}
              >
                {formatMoney(toLocal(d, currency), currency)}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-stretch gap-5 px-5 py-5">
          <div className="flex flex-1 flex-col items-center justify-center">
            {isThrow ? (
              <>
                <div
                  role="button"
                  aria-label={`Bundle of ${count} ${formatUsd(denom)} notes. Hold and drag up to throw.`}
                  tabIndex={0}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    startHold(e.clientY);
                  }}
                  onPointerMove={(e) => moveHold(e.clientY)}
                  onPointerUp={endHold}
                  onPointerCancel={endHold}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      doGive();
                    }
                  }}
                  className="relative cursor-grab touch-none select-none active:cursor-grabbing"
                  style={{
                    transform: `translateY(${-Math.min(dragDy, 90)}px) rotate(${-Math.min(dragDy, 90) / 18}deg)`,
                    transition: dragging ? "none" : `transform var(--t-fast) var(--ease-snap)`,
                  }}
                >
                  {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute left-0 top-0 h-[56px] w-[118px] border-2 border-ink bg-accent"
                      style={{ transform: `translate(${i * -1.5}px, ${i * -3}px) rotate(${(i % 3) - 1}deg)` }}
                      aria-hidden="true"
                    />
                  ))}
                  <div className="relative flex h-[56px] w-[118px] items-center justify-center border-2 border-ink bg-accent">
                    <span className="money text-[18px] font-bold text-on-accent">${denom}</span>
                  </div>
                </div>
                <div className="microlabel mt-5">
                  {dragging ? (dragDy > 48 ? "Release!" : "Drag up…") : "Hold · drag up to throw"}
                </div>
              </>
            ) : (
              <div className="w-full border-l-4 border-accent bg-paper-2 py-3 pl-4">
                <div className="microlabel">{pledgeBased ? "Your pledge" : "Entry for the record"}</div>
                <div className="money mt-1.5 text-[24px] font-bold">
                  {formatMoney(toLocal(amount, currency), currency)}
                </div>
                <p className="mt-2 text-[11.5px] leading-snug text-ink-mute">
                  {pledgeBased
                    ? "Announced now and read back by the clerk. You settle it after the harambee."
                    : "Recorded at the table and read out with your name."}
                </p>
              </div>
            )}
          </div>

          <div className="flex w-[158px] flex-none flex-col justify-between border-l border-rule pl-5">
            <div>
              <label htmlFor="note-count" className="microlabel block">
                {isThrow ? "Notes" : "Multiple"}
              </label>
              <div className="mt-2 flex items-center gap-2">
                <button
                  aria-label="Decrease"
                  onClick={() => setCount((c) => Math.max(1, c - 1))}
                  className="h-9 w-9 cursor-pointer border-2 border-ink font-bold transition-colors duration-150 hover:bg-ink hover:text-paper"
                >
                  −
                </button>
                <output id="note-count" className="money w-8 text-center text-[16px] font-bold">
                  {count}
                </output>
                <button
                  aria-label="Increase"
                  onClick={() => setCount((c) => Math.min(20, c + 1))}
                  className="h-9 w-9 cursor-pointer border-2 border-ink font-bold transition-colors duration-150 hover:bg-ink hover:text-paper"
                >
                  +
                </button>
              </div>
            </div>
            <button
              onClick={doGive}
              className="display mt-4 cursor-pointer bg-ink px-3 py-4 text-[15px] text-paper transition-colors duration-150 hover:bg-accent"
            >
              {givingVerb}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t border-rule px-5 py-3">
          <label htmlFor="gift-message" className="sr-only">
            Message
          </label>
          <input
            id="gift-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={60}
            placeholder="Add a message (optional)"
            className="min-w-0 flex-1 bg-transparent text-[13px] placeholder:text-ink-faint focus:outline-none"
          />
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-ink-mute">
            <input
              type="checkbox"
              aria-label="Give anonymously — counted in the total, name kept off the board"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Anonymous
          </label>
        </div>

        <div className="border-t-2 border-ink bg-paper-2 px-5 py-3">
          <p className="money text-[11.5px] leading-relaxed text-ink-mute">
            <span className="font-bold text-ink">
              {pledgeBased ? "They receive" : "Recipient receives"}{" "}
              {formatMoney(celebrantReceives(amount, currency), currency)} in full
            </span>
            {" · "}
            You pay {formatUsd(giverPaysUsd(amount))} (incl. {formatUsd(feeUsd(amount))} fee,{" "}
            {Math.round(FEE_RATE * 100)}%) · rate {rateLine(currency)} locked
          </p>
        </div>
      </div>
    </div>
  );
}
