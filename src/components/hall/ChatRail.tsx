"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { OwambeEvent } from "@/lib/event";
import { ChatMessage, Guest, sideClasses } from "@/lib/hall";

/*
  Chat rail: room chat and table chat. Gift events are injected as ledger
  lines, never as toast popups.
*/

export function ChatRail({
  event,
  chat,
  guests,
  onSend,
}: {
  event: OwambeEvent;
  chat: ChatMessage[];
  guests: Guest[];
  onSend: (text: string) => void;
}) {
  const [tab, setTab] = useState<"hall" | "table">("hall");
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const you = guests.find((g) => g.isYou);
  const tableIds = new Set(guests.filter((g) => g.table === you?.table).map((g) => g.id));

  const visible =
    tab === "hall"
      ? chat
      : chat.filter((m) => m.kind === "chat" && m.guestId && tableIds.has(m.guestId));

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible.length, tab]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <aside aria-label="Chat rail" className="flex h-full w-full flex-col bg-paper">
      <div role="tablist" aria-label="Chat channels" className="flex border-b-2 border-ink">
        {(["hall", "table"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`microlabel flex-1 cursor-pointer px-3 py-3.5 text-center transition-colors duration-150 ${
              tab === t ? "bg-ink !text-paper" : "!text-ink-faint hover:bg-paper-2 hover:!text-ink"
            }`}
          >
            {t === "hall" ? "Room" : `Table ${you?.table ?? ""}`}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto rail-scroll px-4 py-3" aria-live="polite">
        {visible.map((m) => (
          <ChatLine key={m.id} msg={m} guests={guests} event={event} />
        ))}
      </div>

      <form onSubmit={submit} className="flex border-t-2 border-ink">
        <label htmlFor="chat-input" className="sr-only">
          Message the room
        </label>
        <input
          id="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say something…"
          className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-[13px] placeholder:text-ink-faint focus:outline-none"
          maxLength={200}
        />
        <button
          type="submit"
          className="microlabel cursor-pointer bg-ink px-5 !text-paper transition-colors duration-150 hover:bg-accent"
        >
          Send
        </button>
      </form>
    </aside>
  );
}

function ChatLine({
  msg,
  guests,
  event,
}: {
  msg: ChatMessage;
  guests: Guest[];
  event: OwambeEvent;
}) {
  if (msg.kind === "ledger") {
    return (
      <div className="line-in my-1.5 border-l-4 border-accent bg-paper-2 py-2 pl-3">
        <span className="money text-[12px] font-bold leading-snug">{msg.text}</span>
      </div>
    );
  }
  if (msg.kind === "system") {
    return (
      <div className="line-in my-2.5">
        <span className="microlabel !text-accent">{msg.text}</span>
      </div>
    );
  }
  const guest = guests.find((g) => g.id === msg.guestId);
  const nameColour = guest?.isYou
    ? "text-ink"
    : guest
      ? sideClasses(event, guest.side).text
      : "text-ink-mute";
  return (
    <div className="line-in py-1 text-[13px] leading-snug">
      <span className={`mr-1.5 font-bold ${nameColour}`}>{guest?.name ?? "Guest"}</span>
      <span className="text-ink-mute">{msg.text}</span>
    </div>
  );
}
