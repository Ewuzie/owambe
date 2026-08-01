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
  The giving deck: opens as a sheet from the bottom, never a new page.
  Denominations, not amounts.

  The gesture matches the ceremony. You THROW at a wedding, because that
  is what spraying is. You do not throw money at a funeral or into a
  savings pot — there you confirm an amount at a table. Same sheet, same
  speed, different physical metaphor.

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

  const recipientNoun = pledgeBased ? "They receive" : "Recipient receives";

  return (
    <div className="absolute inset-0 z-40 flex items-end" role="presentation">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-ink-well/70"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${givingVerb} deck`}
        tabIndex={-1}
        className="relative z-10 w-full border-t-2 border-gold-deep bg-ink-raised outline-none"
      >
        <div className="flex items-start justify-between border-b border-rule px-5 pb-3 pt-4">
          <div>
            <div className="microlabel">
              {givingVerb} for {event.honouree}
            </div>
            <div className="mt-1 font-display text-[18px] text-cream">
              {count > 1 ? `${count} × ` : ""}
              {formatUsd(denom)} {isThrow ? "notes" : ""}
            </div>
          </div>
          <div className="text-right">
            <div className="money text-[18px] font-bold text-gold-bright">{formatUsd(amount)}</div>
            <div className="money text-[11px] text-cream-mute">
              = {formatMoney(toLocal(amount, currency), currency)}
            </div>
          </div>
        </div>

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
              className={`cursor-pointer border-r border-rule px-2 py-3 text-center transition-colors duration-150 last:border-r-0 ${
                denom === d ? "bg-ink text-gold-bright" : "text-cream-mute hover:text-cream"
              }`}
            >
              <span className="money block text-[15px] font-bold">${d}</span>
              <span className="money block text-[10px] opacity-70">
                {formatMoney(toLocal(d, currency), currency)}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-stretch gap-4 px-5 py-4">
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
                      className="absolute left-0 top-0 h-[52px] w-[110px] border border-gold-deep bg-gold"
                      style={{ transform: `translate(${i * -1.5}px, ${i * -3}px) rotate(${(i % 3) - 1}deg)` }}
                      aria-hidden="true"
                    />
                  ))}
                  <div className="relative flex h-[52px] w-[110px] items-center justify-center border border-gold-deep bg-gold">
                    <span className="money text-[16px] font-bold text-ink-well">${denom}</span>
                    <span className="pointer-events-none absolute inset-[3px] border border-gold-deep/50" />
                  </div>
                </div>
                <div className="microlabel mt-4">
                  {dragging
                    ? dragDy > 48
                      ? "Release to throw!"
                      : "Drag up…"
                    : "Hold to load · drag up to throw"}
                </div>
              </>
            ) : (
              /* Recorded, not thrown: the ledger entry the clerk would write. */
              <div className="w-full">
                <div className="left-rule-gold border-b border-rule py-2 pl-3">
                  <div className="microlabel">
                    {pledgeBased ? "Your pledge" : "Entry for the record"}
                  </div>
                  <div className="money mt-1 text-[20px] font-bold text-gold-bright">
                    {formatMoney(toLocal(amount, currency), currency)}
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-snug text-cream-faint">
                  {pledgeBased
                    ? "Announced now and read back by the clerk. You settle it after the harambee."
                    : "Recorded at the table and read out with your name."}
                </p>
              </div>
            )}
          </div>

          <div className="flex w-[150px] flex-none flex-col justify-between border-l border-rule pl-4">
            <div>
              <label htmlFor="note-count" className="microlabel block">
                {isThrow ? "Notes" : "Multiple"}
              </label>
              <div className="mt-1 flex items-center gap-2">
                <button
                  aria-label="Decrease"
                  onClick={() => setCount((c) => Math.max(1, c - 1))}
                  className="h-8 w-8 cursor-pointer border border-rule-strong text-cream transition-colors duration-150 hover:border-cream-mute"
                >
                  −
                </button>
                <output id="note-count" className="money w-8 text-center text-[15px] text-cream">
                  {count}
                </output>
                <button
                  aria-label="Increase"
                  onClick={() => setCount((c) => Math.min(20, c + 1))}
                  className="h-8 w-8 cursor-pointer border border-rule-strong text-cream transition-colors duration-150 hover:border-cream-mute"
                >
                  +
                </button>
              </div>
            </div>
            <button
              onClick={doGive}
              className="mt-3 cursor-pointer border border-gold-deep bg-gold px-3 py-2.5 text-[13px] font-bold text-ink-well transition-colors duration-150 hover:bg-gold-bright"
            >
              {givingVerb} {formatUsd(amount)}
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
            className="min-w-0 flex-1 bg-transparent text-[13px] text-cream placeholder:text-cream-faint focus:outline-none"
          />
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-cream-mute">
            <input
              type="checkbox"
              aria-label="Give anonymously — counted in the total, name kept off the board"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--gold)]"
            />
            Anonymous
          </label>
        </div>

        <div className="border-t border-rule px-5 py-2.5">
          <p className="money text-[11px] leading-relaxed text-cream-faint">
            <span className="text-cream-mute">
              {recipientNoun} {formatMoney(celebrantReceives(amount, currency), currency)} in full
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
