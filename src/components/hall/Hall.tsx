"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { OwambeEvent } from "@/lib/event";
import { YOU_ID, emotesFor } from "@/lib/hall";
import { AccentScope } from "@/components/AccentScope";
import { ChatRail } from "./ChatRail";
import { LiveFloor } from "./LiveFloor";
import { MoneyRail } from "./MoneyRail";
import { SprayCanvas, SprayCanvasHandle } from "./SprayCanvas";
import { SprayDeck } from "./SprayDeck";
import { GiftVisual, surgeLabel, throwsNotes, useHallEngine } from "./useHallEngine";

/*
  The room. The stage is a solid block of the celebration's cloth colour,
  the rails are white, and everything is driven by the ceremony — so the
  same component runs a Lagos wedding, a Nairobi harambee, an Accra
  funeral and a Johannesburg stokvel.
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
    <AccentScope event={event} className="flex h-dvh flex-col bg-paper text-ink">
      <header className="flex items-center justify-between border-b-2 border-ink px-4 py-3">
        <div className="flex items-baseline gap-4">
          <Link href="/" className="display text-[16px]">
            Owambe
          </Link>
          <span className="microlabel hidden truncate sm:inline">{event.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="microlabel hidden md:inline">{event.hashtag}</span>
          <Link
            href={`/e/${event.id}/wall`}
            className="microlabel cursor-pointer border-2 border-ink px-3 py-2 transition-colors duration-150 hover:bg-ink hover:!text-paper"
          >
            The wall
          </Link>
        </div>
      </header>

      <div className="relative grid min-h-0 flex-1 grid-cols-1 grid-rows-[1fr_auto] lg:grid-cols-[268px_1fr_296px] lg:grid-rows-1">
        <div className="hidden min-h-0 border-r-2 border-ink lg:block">
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
            <div className="pointer-events-none absolute inset-x-0 top-[34%] z-30 text-center">
              <div
                className="inline-block bg-ink px-9 py-5 text-paper"
                style={{ animation: "rain-enter var(--t-room) var(--ease-ceremony)" }}
              >
                <span className="display text-[clamp(22px,4vw,40px)]">{surge.title}</span>
                <div className="microlabel mt-2 !text-paper/70">{surge.sub}</div>
              </div>
            </div>
          )}

          {/* Gestures + give */}
          <div className="absolute inset-x-0 bottom-0 z-20 flex items-stretch border-t-2 border-ink bg-paper">
            <div
              className="flex flex-1 items-center overflow-x-auto"
              role="toolbar"
              aria-label="Gestures"
            >
              {emotes.map((e) => (
                <button
                  key={e.kind}
                  onClick={() => sendEmote(e.kind, e.label)}
                  className="microlabel flex-none cursor-pointer border-r border-rule px-4 py-4 transition-colors duration-150 hover:bg-paper-2 hover:!text-ink"
                >
                  {e.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setDeckOpen(true)}
              className="display flex-none cursor-pointer bg-accent px-8 py-4 text-[16px] text-on-accent transition-colors duration-150 hover:bg-ink"
            >
              {event.ceremony.givingVerb}
            </button>
          </div>

          <SprayDeck
            open={deckOpen}
            event={event}
            onClose={() => setDeckOpen(false)}
            onGive={(amountUsd, opts) => give(YOU_ID, amountUsd, opts)}
          />
        </div>

        <div className="hidden min-h-0 border-l-2 border-ink lg:block">
          <ChatRail event={event} chat={state.chat} guests={state.guests} onSend={sendChat} />
        </div>

        {/* Phone: one rail at a time */}
        <div className="flex min-h-0 flex-col border-t-2 border-ink lg:hidden">
          <div role="tablist" aria-label="Rails" className="flex border-b border-rule">
            {(["board", "chat"] as const).map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={mobileRail === r}
                onClick={() => setMobileRail(r)}
                className={`microlabel flex-1 cursor-pointer py-3.5 transition-colors duration-150 ${
                  mobileRail === r ? "bg-ink !text-paper" : "!text-ink-faint"
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
    </AccentScope>
  );
}
