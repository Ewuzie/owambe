"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EMOTES, PARTY, YOU_ID } from "@/lib/hall";
import { ChatRail } from "./ChatRail";
import { LiveFloor } from "./LiveFloor";
import { MoneyRail } from "./MoneyRail";
import { SprayCanvas, SprayCanvasHandle } from "./SprayCanvas";
import { SprayDeck } from "./SprayDeck";
import { SprayVisual, useHallEngine } from "./useHallEngine";

/*
  The Party Hall — the product. Live video centre of gravity, spray
  canvas layered over everything, chat rail and money rail beside it.
*/

export function Hall() {
  const canvasRef = useRef<SprayCanvasHandle>(null);
  const [deckOpen, setDeckOpen] = useState(false);
  const [mobileRail, setMobileRail] = useState<"board" | "chat">("board");

  const onSprayVisual = useCallback((v: SprayVisual) => {
    canvasRef.current?.burst(v.noteCount, v.origin);
  }, []);

  const { state, spray, sendChat, sendEmote } = useHallEngine(onSprayVisual);

  useEffect(() => {
    canvasRef.current?.setRain(state.rainActive);
  }, [state.rainActive]);

  return (
    <div className="flex h-dvh flex-col bg-ink-deep text-cream">
      {/* Hall header: engraved invitation masthead */}
      <header className="flex items-center justify-between border-b border-rule-strong bg-ink px-4 py-2.5">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[17px] tracking-wide text-cream">Owambe</span>
          <span className="microlabel hidden sm:inline">The hall of {PARTY.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="microlabel hidden md:inline">{PARTY.hashtag}</span>
          <button className="microlabel cursor-pointer border border-rule-strong px-3 py-1.5 !text-cream transition-colors duration-200 hover:border-cream-mute">
            Invite
          </button>
        </div>
      </header>

      {/* Three-rail layout. On phones the rails become a drawer under the floor —
          the board and the chat are core to the product, never dropped. */}
      <div className="relative grid min-h-0 flex-1 grid-cols-1 grid-rows-[1fr_auto] lg:grid-cols-[260px_1fr_290px] lg:grid-rows-1">
        <div className="hidden min-h-0 border-r border-rule lg:block">
          <MoneyRail guests={state.guests} totalNgn={state.totalNgn} />
        </div>

        {/* Centre: floor + spray canvas + deck */}
        <div className="relative min-h-0 min-w-0">
          <LiveFloor
            guests={state.guests}
            emotes={state.emotes}
            shoutout={state.shoutout}
            programmeIndex={state.programmeIndex}
            rainActive={state.rainActive}
          />

          {/* The spray canvas covers the whole centre column */}
          <SprayCanvas ref={canvasRef} />

          {/* Rain announcement */}
          {state.rainActive && (
            <div className="pointer-events-none absolute inset-x-0 top-[38%] z-30 text-center">
              <div
                className="inline-block border-y-2 border-gold bg-ink-well/85 px-8 py-3"
                style={{ animation: "rain-enter var(--t-room) var(--ease-ceremony)" }}
              >
                <span className="font-display text-[26px] tracking-wide text-gold-bright">
                  OWAMBE RAIN
                </span>
                <div className="microlabel mt-1 !text-cream">The room is raining money</div>
              </div>
            </div>
          )}

          {/* Emote bar + spray trigger */}
          <div className="absolute inset-x-0 bottom-0 z-20 flex items-stretch border-t border-rule-strong bg-ink/95">
            <div
              className="flex flex-1 items-center gap-0 overflow-x-auto"
              role="toolbar"
              aria-label="Emotes"
            >
              {EMOTES.map((e) => (
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
              SPRAY
            </button>
          </div>

          <SprayDeck
            open={deckOpen}
            onClose={() => setDeckOpen(false)}
            onThrow={(amountUsd, opts) => spray(YOU_ID, amountUsd, opts)}
          />
        </div>

        <div className="hidden min-h-0 border-l border-rule lg:block">
          <ChatRail chat={state.chat} guests={state.guests} onSend={sendChat} />
        </div>

        {/* Phone: one rail at a time, chosen by the guest */}
        <div className="flex min-h-0 flex-col border-t border-rule-strong lg:hidden">
          <div role="tablist" aria-label="Rails" className="flex border-b border-rule bg-ink">
            {(["board", "chat"] as const).map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={mobileRail === r}
                onClick={() => setMobileRail(r)}
                className={`microlabel flex-1 cursor-pointer border-b-2 py-3 transition-colors duration-200 ${
                  mobileRail === r
                    ? "border-gold !text-cream"
                    : "border-transparent !text-cream-faint"
                }`}
              >
                {r === "board" ? "Owambe Board" : "Chat"}
              </button>
            ))}
          </div>
          <div className="h-[42dvh] min-h-0">
            {mobileRail === "board" ? (
              <MoneyRail guests={state.guests} totalNgn={state.totalNgn} />
            ) : (
              <ChatRail chat={state.chat} guests={state.guests} onSend={sendChat} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
