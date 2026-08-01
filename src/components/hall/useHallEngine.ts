"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  OwambeEvent,
  eventCurrency,
  formatUsd,
  toLocal,
  tierForUsd,
} from "@/lib/event";
import {
  ChatMessage,
  EmoteKind,
  Gift,
  Guest,
  YOU_ID,
  ambientChat,
  ambientMessages,
  emotesFor,
  makeGuests,
  nextId,
  openingLine,
} from "@/lib/hall";

export type FloatingEmote = {
  id: string;
  kind: EmoteKind;
  label: string;
  guestName: string;
  x: number;
};

export type Shoutout = {
  id: string;
  guestName: string;
  amountUsd: number;
  message?: string;
  pledged: boolean;
};

export type HallState = {
  guests: Guest[];
  gifts: Gift[];
  chat: ChatMessage[];
  totalUsd: number;
  /** Pledged but not yet paid, for pledge-based ceremonies. */
  outstandingUsd: number;
  programmeIndex: number;
  rainActive: boolean;
  lastRainEndedAt: number;
  emotes: FloatingEmote[];
  shoutout: Shoutout | null;
  shoutoutQueue: Shoutout[];
};

const RAIN_THRESHOLD = 3;
const RAIN_WINDOW_MS = 30_000;
const RAIN_DURATION_MS = 12_000;
const RAIN_COOLDOWN_MS = 8 * 60_000;
const SHOUTOUT_THRESHOLD_USD = 20;

function makeInitialState(event: OwambeEvent): HallState {
  const guests = makeGuests(event);
  return {
    guests,
    gifts: [],
    chat: [
      { id: nextId("c"), kind: "system", text: openingLine(event), ts: Date.now() },
    ],
    totalUsd: guests.reduce((s, g) => s + g.givenUsd, 0),
    outstandingUsd: event.ceremony.pledgeBased
      ? Math.round(guests.reduce((s, g) => s + g.givenUsd, 0) * 0.45)
      : 0,
    programmeIndex: Math.min(
      event.status === "live" ? 4 : 0,
      event.ceremony.programme.length - 1,
    ),
    rainActive: false,
    lastRainEndedAt: 0,
    emotes: [],
    shoutout: null,
    shoutoutQueue: [],
  };
}

type Action =
  | {
      type: "gift";
      guestId: string;
      amountUsd: number;
      amountLocal: number;
      message?: string;
      anonymous: boolean;
      pledged: boolean;
      verb: string;
      now: number;
    }
  | { type: "chat"; guestId: string; text: string; now: number }
  | { type: "emote"; guestId: string; kind: EmoteKind; label: string; now: number }
  | { type: "emote.expire"; id: string }
  | { type: "rain.start"; now: number; label: string }
  | { type: "rain.end"; now: number }
  | { type: "shoutout.next" }
  | { type: "programme.advance"; now: number; programmeLength: number; label: string };

function reducer(state: HallState, action: Action): HallState {
  switch (action.type) {
    case "gift": {
      const guest = state.guests.find((g) => g.id === action.guestId);
      if (!guest) return state;
      const gift: Gift = {
        id: nextId("gift"),
        guestId: guest.id,
        amountUsd: action.amountUsd,
        amountLocal: action.amountLocal,
        message: action.message,
        anonymous: action.anonymous,
        pledged: action.pledged,
        ts: action.now,
      };
      const displayName = action.anonymous ? "A well-wisher" : guest.name;
      const verb = action.pledged ? "pledged" : action.verb;
      const ledger: ChatMessage = {
        id: nextId("c"),
        kind: "ledger",
        guestId: action.anonymous ? undefined : guest.id,
        text: `${displayName} ${verb} ${formatUsd(action.amountUsd)}${action.message ? ` — “${action.message}”` : ""}`,
        ts: action.now,
      };
      const guests = state.guests.map((g) =>
        g.id === guest.id
          ? {
              ...g,
              givenUsd: g.givenUsd + action.amountUsd,
              tier: tierForUsd(g.givenUsd + action.amountUsd),
            }
          : g,
      );
      const shoutoutQueue =
        action.amountUsd >= SHOUTOUT_THRESHOLD_USD && !action.anonymous
          ? [
              ...state.shoutoutQueue,
              {
                id: gift.id,
                guestName: guest.name,
                amountUsd: action.amountUsd,
                message: action.message,
                pledged: action.pledged,
              },
            ]
          : state.shoutoutQueue;
      return {
        ...state,
        guests,
        gifts: [...state.gifts, gift],
        chat: append(state.chat, ledger),
        totalUsd: state.totalUsd + action.amountUsd,
        outstandingUsd: state.outstandingUsd + (action.pledged ? action.amountUsd : 0),
        shoutoutQueue,
      };
    }
    case "chat":
      return {
        ...state,
        chat: append(state.chat, {
          id: nextId("c"),
          kind: "chat",
          guestId: action.guestId,
          text: action.text,
          ts: action.now,
        }),
      };
    case "emote": {
      const guest = state.guests.find((g) => g.id === action.guestId);
      return {
        ...state,
        emotes: [
          ...state.emotes.slice(-11),
          {
            id: nextId("e"),
            kind: action.kind,
            label: action.label,
            guestName: guest?.name ?? "Guest",
            x: 0.08 + Math.random() * 0.84,
          },
        ],
      };
    }
    case "emote.expire":
      return { ...state, emotes: state.emotes.filter((e) => e.id !== action.id) };
    case "rain.start":
      return {
        ...state,
        rainActive: true,
        chat: append(state.chat, {
          id: nextId("c"),
          kind: "system",
          text: action.label,
          ts: action.now,
        }),
      };
    case "rain.end":
      return { ...state, rainActive: false, lastRainEndedAt: action.now };
    case "shoutout.next": {
      const [next, ...rest] = state.shoutoutQueue;
      return { ...state, shoutout: next ?? null, shoutoutQueue: rest };
    }
    case "programme.advance":
      return {
        ...state,
        programmeIndex: Math.min(state.programmeIndex + 1, action.programmeLength - 1),
        chat: append(state.chat, {
          id: nextId("c"),
          kind: "system",
          text: `Programme: ${action.label}`,
          ts: action.now,
        }),
      };
    default:
      return state;
  }
}

function append(chat: ChatMessage[], msg: ChatMessage): ChatMessage[] {
  return [...chat.slice(-99), msg];
}

export type GiftVisual = { amountUsd: number; noteCount: number; origin: "you" | "room" };

/** Only spraying throws physical notes. The others record rather than throw. */
export function throwsNotes(event: OwambeEvent): boolean {
  return event.ceremony.style === "spray";
}

/** The room-wide climax moment, named per ceremony. */
export function surgeLabel(event: OwambeEvent): { title: string; sub: string; chat: string } {
  switch (event.ceremony.style) {
    case "pledge":
      return {
        title: "THE ROOM IS MOVING",
        sub: "Pledges are pouring in",
        chat: "The room is moving — pledges pouring in!",
      };
    case "donation":
      return {
        title: "THE TABLE IS FULL",
        sub: "The clerks cannot keep up",
        chat: "The donation table is overflowing.",
      };
    case "contribution":
      return {
        title: "THE POT IS FULL",
        sub: "Every member has paid in",
        chat: "The pot is full — every member has paid in.",
      };
    default:
      return {
        title: "OWAMBE RAIN",
        sub: "The room is raining money",
        chat: "OWAMBE RAIN — the room is raining money!",
      };
  }
}

export function useHallEngine(event: OwambeEvent, onGiftVisual: (v: GiftVisual) => void) {
  const initial = useMemo(() => makeInitialState(event), [event]);
  const [state, dispatch] = useReducer(reducer, initial);

  const stateRef = useRef(state);
  const visualRef = useRef(onGiftVisual);
  const eventRef = useRef(event);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    visualRef.current = onGiftVisual;
  }, [onGiftVisual]);
  useEffect(() => {
    eventRef.current = event;
  }, [event]);

  const give = useCallback(
    (guestId: string, amountUsd: number, opts?: { message?: string; anonymous?: boolean }) => {
      const ev = eventRef.current;
      const now = Date.now();
      dispatch({
        type: "gift",
        guestId,
        amountUsd,
        amountLocal: toLocal(amountUsd, eventCurrency(ev)),
        message: opts?.message,
        anonymous: opts?.anonymous ?? false,
        pledged: ev.ceremony.pledgeBased,
        verb: ev.ceremony.givingVerb.toLowerCase() + "ed",
        now,
      });
      visualRef.current({
        amountUsd,
        noteCount: Math.min(60, Math.max(6, Math.round(amountUsd / 2) + 5)),
        origin: guestId === YOU_ID ? "you" : "room",
      });
    },
    [],
  );

  const sendChat = useCallback((text: string) => {
    dispatch({ type: "chat", guestId: YOU_ID, text, now: Date.now() });
  }, []);

  const sendEmote = useCallback((kind: EmoteKind, label: string, guestId: string = YOU_ID) => {
    dispatch({ type: "emote", guestId, kind, label, now: Date.now() });
  }, []);

  const advanceProgramme = useCallback(() => {
    const programme = eventRef.current.ceremony.programme;
    const next = Math.min(stateRef.current.programmeIndex + 1, programme.length - 1);
    dispatch({
      type: "programme.advance",
      now: Date.now(),
      programmeLength: programme.length,
      label: programme[next].label,
    });
  }, []);

  useEffect(() => {
    if (state.emotes.length === 0) return;
    const oldest = state.emotes[0];
    const t = setTimeout(() => dispatch({ type: "emote.expire", id: oldest.id }), 2600);
    return () => clearTimeout(t);
  }, [state.emotes]);

  useEffect(() => {
    const s = stateRef.current;
    if (s.rainActive) return;
    const now = Date.now();
    if (now - s.lastRainEndedAt < RAIN_COOLDOWN_MS && s.lastRainEndedAt !== 0) return;
    const recent = s.gifts.filter((g) => now - g.ts < RAIN_WINDOW_MS);
    if (recent.length >= RAIN_THRESHOLD) {
      dispatch({ type: "rain.start", now, label: surgeLabel(eventRef.current).chat });
      setTimeout(() => dispatch({ type: "rain.end", now: Date.now() }), RAIN_DURATION_MS);
    }
  }, [state.gifts]);

  useEffect(() => {
    if (state.shoutout === null && state.shoutoutQueue.length > 0) {
      dispatch({ type: "shoutout.next" });
    } else if (state.shoutout !== null) {
      const t = setTimeout(() => dispatch({ type: "shoutout.next" }), 4200);
      return () => clearTimeout(t);
    }
  }, [state.shoutout, state.shoutoutQueue]);

  /* Ambient room. Replaced by real presence and events in U1.2. */
  useEffect(() => {
    if (event.status === "ended") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (cancelled) return;
      const ev = eventRef.current;
      const s = stateRef.current;
      const others = s.guests.filter((g) => !g.isYou);
      const g = others[Math.floor(Math.random() * others.length)];
      const chatPool = ambientChat(ev);
      const msgPool = ambientMessages(ev);
      const roll = Math.random();
      if (roll < 0.38) {
        dispatch({
          type: "chat",
          guestId: g.id,
          text: chatPool[Math.floor(Math.random() * chatPool.length)],
          now: Date.now(),
        });
      } else if (roll < 0.62) {
        const pool = emotesFor(ev);
        const k = pool[Math.floor(Math.random() * pool.length)];
        dispatch({ type: "emote", guestId: g.id, kind: k.kind, label: k.label, now: Date.now() });
      } else {
        const amounts = [1, 5, 5, 20, 20, 50, 100];
        const amountUsd = amounts[Math.floor(Math.random() * amounts.length)];
        dispatch({
          type: "gift",
          guestId: g.id,
          amountUsd,
          amountLocal: toLocal(amountUsd, eventCurrency(ev)),
          message: Math.random() < 0.4 ? msgPool[Math.floor(Math.random() * msgPool.length)] : undefined,
          anonymous: Math.random() < 0.1,
          pledged: ev.ceremony.pledgeBased,
          verb: ev.ceremony.givingVerb.toLowerCase() + "ed",
          now: Date.now(),
        });
        visualRef.current({
          amountUsd,
          noteCount: Math.min(50, Math.max(5, Math.round(amountUsd / 2) + 4)),
          origin: "room",
        });
      }
      timer = setTimeout(tick, 3500 + Math.random() * 5500);
    };
    timer = setTimeout(tick, 2000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [event.status]);

  return { state, give, sendChat, sendEmote, advanceProgramme };
}
