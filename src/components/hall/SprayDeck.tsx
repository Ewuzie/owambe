"use client";

import { useEffect, useRef, useState } from "react";
import {
  DENOMINATIONS_USD,
  FEE_RATE,
  celebrantReceivesNgn,
  feeUsd,
  formatNgn,
  formatUsd,
  usdToNgn,
} from "@/lib/hall";

/*
  The Spray Deck: opens as a sheet from the bottom, never a new page.
  Denominations, not amounts. Throw, do not submit — hold a bundle to
  load notes, drag up and release to throw. Keyboard users get a Spray
  button with a stepper, fully accessible, same result.
*/

export function SprayDeck({
  open,
  onClose,
  onThrow,
}: {
  open: boolean;
  onClose: () => void;
  onThrow: (amountUsd: number, opts: { message?: string; anonymous: boolean }) => void;
}) {
  /* Mounted only while open, so each throw starts from a clean bundle. */
  if (!open) return null;
  return <SprayDeckSheet onClose={onClose} onThrow={onThrow} />;
}

function SprayDeckSheet({
  onClose,
  onThrow,
}: {
  onClose: () => void;
  onThrow: (amountUsd: number, opts: { message?: string; anonymous: boolean }) => void;
}) {
  const [denom, setDenom] = useState<number>(20);
  const [count, setCount] = useState(1);
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  /* hold-to-load + drag-to-throw state */
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragStartY = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragDy, setDragDy] = useState(0);

  const amount = denom * count;

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

  const doThrow = () => {
    onThrow(amount, { message: message.trim() || undefined, anonymous });
    onClose();
  };

  const startHold = (clientY: number) => {
    dragStartY.current = clientY;
    setDragging(true);
    setDragDy(0);
    holdTimer.current = setInterval(() => {
      setCount((c) => Math.min(20, c + 1));
    }, 350);
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
    if (threw) doThrow();
  };

  return (
    <div className="absolute inset-0 z-40 flex items-end" role="presentation">
      {/* scrim */}
      <button
        aria-label="Close spray deck"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-ink-well/70"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Spray deck"
        tabIndex={-1}
        className="relative z-10 w-full border-t-2 border-gold-deep bg-ink-raised outline-none"
      >
        {/* Header: the split view — what the celebrant receives, the rate, the fee */}
        <div className="flex items-start justify-between border-b border-rule px-5 pb-3 pt-4">
          <div>
            <div className="microlabel">Spray the couple</div>
            <div className="mt-1 font-display text-[18px] text-cream">
              {count > 1 ? `${count} × ` : ""}
              {formatUsd(denom)} notes
            </div>
          </div>
          <div className="text-right">
            <div className="money text-[18px] font-bold text-gold-bright">{formatUsd(amount)}</div>
            <div className="money text-[11px] text-cream-mute">= {formatNgn(usdToNgn(amount))}</div>
          </div>
        </div>

        {/* Denominations, not amounts */}
        <div
          role="radiogroup"
          aria-label="Note denomination"
          className="grid grid-cols-5 border-b border-rule"
        >
          {DENOMINATIONS_USD.map((d) => (
            <button
              key={d}
              role="radio"
              aria-checked={denom === d}
              aria-label={`${formatUsd(d)} note, ${formatNgn(usdToNgn(d))}`}
              onClick={() => {
                setDenom(d);
                setCount(1);
              }}
              className={`cursor-pointer border-r border-rule px-2 py-3 text-center transition-colors duration-150 last:border-r-0 ${
                denom === d ? "bg-ink text-gold-bright" : "text-cream-mute hover:text-cream"
              }`}
            >
              <span className="money block text-[15px] font-bold">${d}</span>
              <span className="money block text-[10px] opacity-70">{formatNgn(usdToNgn(d))}</span>
            </button>
          ))}
        </div>

        {/* The bundle: hold to load, drag up to throw */}
        <div className="flex items-stretch gap-4 px-5 py-4">
          <div className="flex flex-1 flex-col items-center">
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
                  doThrow();
                }
              }}
              className="relative cursor-grab touch-none select-none active:cursor-grabbing"
              style={{
                transform: `translateY(${-Math.min(dragDy, 90)}px) rotate(${-Math.min(dragDy, 90) / 18}deg)`,
                transition: dragging ? "none" : `transform var(--t-fast) var(--ease-snap)`,
              }}
            >
              {/* stacked notes */}
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
          </div>

          {/* Accessible path: stepper + spray button, same result */}
          <div className="flex w-[150px] flex-none flex-col justify-between border-l border-rule pl-4">
            <div>
              <label htmlFor="note-count" className="microlabel block">
                Notes
              </label>
              <div className="mt-1 flex items-center gap-2">
                <button
                  aria-label="Fewer notes"
                  onClick={() => setCount((c) => Math.max(1, c - 1))}
                  className="h-8 w-8 cursor-pointer border border-rule-strong text-cream transition-colors duration-150 hover:border-cream-mute"
                >
                  −
                </button>
                <output id="note-count" className="money w-8 text-center text-[15px] text-cream">
                  {count}
                </output>
                <button
                  aria-label="More notes"
                  onClick={() => setCount((c) => Math.min(20, c + 1))}
                  className="h-8 w-8 cursor-pointer border border-rule-strong text-cream transition-colors duration-150 hover:border-cream-mute"
                >
                  +
                </button>
              </div>
            </div>
            <button
              onClick={doThrow}
              className="mt-3 cursor-pointer border border-gold-deep bg-gold px-3 py-2.5 text-[13px] font-bold text-ink-well transition-colors duration-150 hover:bg-gold-bright"
            >
              Spray {formatUsd(amount)}
            </button>
          </div>
        </div>

        {/* Message + anonymous */}
        <div className="flex items-center gap-4 border-t border-rule px-5 py-3">
          <label htmlFor="spray-message" className="sr-only">
            Message with your spray
          </label>
          <input
            id="spray-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={60}
            placeholder="Message for the MC to read (optional)"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-cream placeholder:text-cream-faint focus:outline-none"
          />
          <label className="flex cursor-pointer items-center gap-2 text-[12px] text-cream-mute">
            <input
              type="checkbox"
              aria-label="Spray anonymously — counted in the total, name kept off the board"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="h-3.5 w-3.5 accent-[var(--gold)]"
            />
            Anonymous
          </label>
        </div>

        {/* Plain-language trust line */}
        <div className="border-t border-rule px-5 py-2.5">
          <p className="money text-[11px] text-cream-faint">
            Couple receives {formatNgn(celebrantReceivesNgn(amount))} · rate $1 = ₦1,580 (locked) ·
            fee {formatUsd(feeUsd(amount))} ({Math.round(FEE_RATE * 100)}%)
          </p>
        </div>
      </div>
    </div>
  );
}
