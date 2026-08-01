"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { OwambeEvent } from "@/lib/event";
import { ChatMessage, Guest, sideClasses } from "@/lib/hall";

/*
  Chat rail: table chat and hall chat as two tabs. Spray events are
  injected into hall chat as ledger lines, never as toast popups.
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
    <aside aria-label="Chat rail" className="flex h-full w-full flex-col bg-ink">
      {/* Tabs */}
      <div role="tablist" aria-label="Chat channels" className="flex border-b border-rule">
        {(["hall", "table"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`microlabel flex-1 cursor-pointer border-b-2 px-3 py-3 text-center transition-colors duration-200 ${
              tab === t
                ? "border-aso text-cream"
                : "border-transparent text-cream-faint hover:text-cream-mute"
            }`}
          >
            {t === "hall" ? "Hall" : `Table ${you?.table ?? ""}`}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rail-scroll px-4 py-3"
        aria-live="polite"
      >
        {visible.map((m) => (
          <ChatLine key={m.id} msg={m} guests={guests} event={event} />
        ))}
      </div>

      {/* Composer */}
      <form onSubmit={submit} className="flex border-t border-rule">
        <label htmlFor="chat-input" className="sr-only">
          Message the hall
        </label>
        <input
          id="chat-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Say something to the hall…"
          className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[13px] text-cream placeholder:text-cream-faint focus:outline-none"
          maxLength={200}
        />
        <button
          type="submit"
          className="microlabel cursor-pointer px-4 text-cream-mute transition-colors duration-200 hover:text-cream"
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
    /* Spray events read as ledger lines: hairline, mono amount inline */
    return (
      <div className="ledger-row left-rule-gold my-1 py-1.5 pl-2.5">
        <span className="money text-[12px] leading-snug text-gold-bright">{msg.text}</span>
      </div>
    );
  }
  if (msg.kind === "system") {
    return (
      <div className="my-2 py-0.5">
        <span className="microlabel !text-aso">{msg.text}</span>
      </div>
    );
  }
  const guest = guests.find((g) => g.id === msg.guestId);
  const nameColour = guest?.isYou
    ? "text-cream"
    : guest
      ? sideClasses(event, guest.side).text
      : "text-cream-mute";
  return (
    <div className="py-1 text-[13px] leading-snug">
      <span className={`mr-1.5 font-semibold ${nameColour}`}>
        {guest?.name ?? "Guest"}
      </span>
      <span className="text-cream-mute">{msg.text}</span>
    </div>
  );
}
