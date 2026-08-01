"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { OwambeEvent } from "@/lib/event";
import { YOU_ID, emotesFor } from "@/lib/hall";
import { ChatRail } from "./ChatRail";
import { LiveFloor } from "./LiveFloor";
import { MoneyRail } from "./MoneyRail";
import { SprayCanvas, SprayCanvasHandle } from "./SprayCanvas";
import { SprayDeck } from "./SprayDeck";
import { GiftVisual, surgeLabel, throwsNotes, useHallEngine } from "./useHallEngine";

/*
  The room — the product. Live video centre of gravity, the note canvas
  layered over it (spraying only), chat and money rails beside it.

  Everything visible here is driven by the event's ceremony, so the same
  component runs a Lagos wedding, a Nairobi harambee, an Accra funeral
  and a Johannesburg stokvel.
*/

export function Hall({ event }: { event: OwambeEvent }) {
  const canvasRef = useRef<SprayCanvasHandle>(null);
  const [deckOpen, setDeckOpen] = useState(false);
  const [mobileRail, setMobileRail] = useState<"board" | "chat">("board");
  const notes = throwsNotes(event);
  const surge = surgeLabel(event);
  const emotes = emotesFor(event);

  const onGiftVisual = useCallback(
    (v: GiftVisual) => {
      if (notes) canvasRef.current?.burst(v.noteCount, v.origin);
    },
    [notes],
  );

  const { state, give, sendChat, sendEmote } = useHallEngine(event, onGiftVisual);

  useEffect(() => {
    if (notes) canvasRef.current?.setRain(state.rainActive);
  }, [state.rainActive, notes]);

  return (
    <div className="flex h-dvh flex-col bg-ink-deep text-cream">
      <header className="flex items-center justify-between border-b border-rule-strong bg-ink px-4 py-2.5">
        <div className="flex items-baseline gap-3">
          <Link href="/" className="font-display text-[17px] tracking-wide text-cream">
            Owambe
          </Link>
          <span className="microlabel hidden sm:inline">{event.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="microlabel hidden md:inline">{event.hashtag}</span>
          <Link
            href={`/e/${event.id}/wall`}
            className="microlabel cursor-pointer border border-rule-strong px-3 py-1.5 !text-cream transition-colors duration-200 hover:border-cream-mute"
          >
            The wall
          </Link>
        </div>
      </header>

      <div className="relative grid min-h-0 flex-1 grid-cols-1 grid-rows-[1fr_auto] lg:grid-cols-[260px_1fr_290px] lg:grid-rows-1">
        <div className="hidden min-h-0 border-r border-rule lg:block">
          <MoneyRail
            event={event}
            guests={state.guests}
            totalUsd={state.totalUsd}
            outstandingUsd={state.outstandingUsd}
          />
        </div>

        <div className="relative min-h-0 min-w-0">
          <LiveFloor
            event={event}
            guests={state.guests}
            emotes={state.emotes}
            shoutout={state.shoutout}
            programmeIndex={state.programmeIndex}
            surgeActive={state.rainActive}
          />

          {notes && <SprayCanvas ref={canvasRef} />}

          {state.rainActive && (
            <div className="pointer-events-none absolute inset-x-0 top-[38%] z-30 text-center">
              <div
                className="inline-block border-y-2 border-gold bg-ink-well/85 px-8 py-3"
                style={{ animation: "rain-enter var(--t-room) var(--ease-ceremony)" }}
              >
                <span className="font-display text-[26px] tracking-wide text-gold-bright">
                  {surge.title}
                </span>
                <div className="microlabel mt-1 !text-cream">{surge.sub}</div>
              </div>
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 z-20 flex items-stretch border-t border-rule-strong bg-ink/95">
            <div
              className="flex flex-1 items-center gap-0 overflow-x-auto"
              role="toolbar"
              aria-label="Gestures"
            >
              {emotes.map((e) => (
                <button
                  key={e.kind}
                  onClick={() => sendEmote(e.kind, e.label)}
                  className="microlabel flex-none cursor-pointer border-r border-rule px-3 py-3.5 !text-cream-mute transition-colors duration-150 hover:bg-ink-raised hover:!text-cream"
                >
                  {e.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setDeckOpen(true)}
              className="flex-none cursor-pointer border-l-2 border-gold-deep bg-gold px-6 py-3.5 text-[14px] font-bold tracking-wide text-ink-well transition-colors duration-150 hover:bg-gold-bright"
            >
              {event.ceremony.givingVerb.toUpperCase()}
            </button>
          </div>

          <SprayDeck
            open={deckOpen}
            event={event}
            onClose={() => setDeckOpen(false)}
            onGive={(amountUsd, opts) => give(YOU_ID, amountUsd, opts)}
          />
        </div>

        <div className="hidden min-h-0 border-l border-rule lg:block">
          <ChatRail event={event} chat={state.chat} guests={state.guests} onSend={sendChat} />
        </div>

        <div className="flex min-h-0 flex-col border-t border-rule-strong lg:hidden">
          <div role="tablist" aria-label="Rails" className="flex border-b border-rule bg-ink">
            {(["board", "chat"] as const).map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={mobileRail === r}
                onClick={() => setMobileRail(r)}
                className={`microlabel flex-1 cursor-pointer border-b-2 py-3 transition-colors duration-200 ${
                  mobileRail === r ? "border-gold !text-cream" : "border-transparent !text-cream-faint"
                }`}
              >
                {r === "board" ? event.ceremony.boardLabel : "Chat"}
              </button>
            ))}
          </div>
          <div className="h-[42dvh] min-h-0">
            {mobileRail === "board" ? (
              <MoneyRail
                event={event}
                guests={state.guests}
                totalUsd={state.totalUsd}
                outstandingUsd={state.outstandingUsd}
              />
            ) : (
              <ChatRail event={event} chat={state.chat} guests={state.guests} onSend={sendChat} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
