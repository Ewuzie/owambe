"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  AMBIENT_CHAT,
  AMBIENT_MESSAGES,
  ChatMessage,
  EmoteKind,
  Guest,
  INITIAL_GUESTS,
  PROGRAMME,
  Spray,
  YOU_ID,
  formatUsd,
  nextId,
  usdToNgn,
} from "@/lib/hall";

export type FloatingEmote = {
  id: string;
  kind: EmoteKind;
  label: string;
  guestName: string;
  /** 0..1 horizontal position over the floor */
  x: number;
};

export type Shoutout = {
  id: string;
  guestName: string;
  amountUsd: number;
  message?: string;
};

export type HallState = {
  guests: Guest[];
  sprays: Spray[];
  chat: ChatMessage[];
  totalNgn: number;
  programmeIndex: number;
  rainActive: boolean;
  lastRainEndedAt: number;
  emotes: FloatingEmote[];
  shoutout: Shoutout | null;
  shoutoutQueue: Shoutout[];
};

const SEED_TOTAL_NGN = INITIAL_GUESTS.reduce((s, g) => s + g.sprayedNgn, 0);

/** Rain fires when this many sprays land inside RAIN_WINDOW_MS. */
const RAIN_THRESHOLD = 3;
const RAIN_WINDOW_MS = 30_000;
const RAIN_DURATION_MS = 12_000;
/** Not more than once every eight minutes (spec). */
const RAIN_COOLDOWN_MS = 8 * 60_000;
/** Sprays at or above this enter the MC shout-out queue. */
const SHOUTOUT_THRESHOLD_USD = 20;

const initialState: HallState = {
  guests: INITIAL_GUESTS,
  sprays: [],
  chat: [
    { id: nextId("c"), kind: "system", text: "Alaga has opened the floor. Ẹ káàbọ̀!", ts: Date.now() },
    { id: nextId("c"), kind: "chat", guestId: "g_bisi", text: "We are LIVE from Houston!!", ts: Date.now() },
    { id: nextId("c"), kind: "chat", guestId: "g_tolu", text: "Groom's side, assemble 🥁", ts: Date.now() },
  ],
  totalNgn: SEED_TOTAL_NGN,
  programmeIndex: 5,
  rainActive: false,
  lastRainEndedAt: 0,
  emotes: [],
  shoutout: null,
  shoutoutQueue: [],
};

type Action =
  | { type: "spray"; guestId: string; amountUsd: number; message?: string; anonymous: boolean; now: number }
  | { type: "chat"; guestId: string; text: string; now: number }
  | { type: "emote"; guestId: string; kind: EmoteKind; label: string; now: number }
  | { type: "emote.expire"; id: string }
  | { type: "rain.start"; now: number }
  | { type: "rain.end"; now: number }
  | { type: "shoutout.next" }
  | { type: "programme.advance"; now: number };

function reducer(state: HallState, action: Action): HallState {
  switch (action.type) {
    case "spray": {
      const guest = state.guests.find((g) => g.id === action.guestId);
      if (!guest) return state;
      const amountNgn = usdToNgn(action.amountUsd);
      const spray: Spray = {
        id: nextId("s"),
        guestId: guest.id,
        amountUsd: action.amountUsd,
        amountNgn,
        message: action.message,
        anonymous: action.anonymous,
        ts: action.now,
      };
      const displayName = action.anonymous ? "A well-wisher" : guest.name;
      const ledger: ChatMessage = {
        id: nextId("c"),
        kind: "ledger",
        guestId: action.anonymous ? undefined : guest.id,
        text: `${displayName} sprayed ${formatUsd(action.amountUsd)}${action.message ? ` — “${action.message}”` : ""}`,
        ts: action.now,
      };
      const guests = state.guests.map((g) =>
        g.id === guest.id
          ? {
              ...g,
              sprayedNgn: g.sprayedNgn + amountNgn,
              tier: tierFor(g.sprayedNgn + amountNgn, g.tier),
            }
          : g,
      );
      const shoutoutQueue =
        action.amountUsd >= SHOUTOUT_THRESHOLD_USD && !action.anonymous
          ? [
              ...state.shoutoutQueue,
              { id: spray.id, guestName: guest.name, amountUsd: action.amountUsd, message: action.message },
            ]
          : state.shoutoutQueue;
      return {
        ...state,
        guests,
        sprays: [...state.sprays, spray],
        chat: append(state.chat, ledger),
        totalNgn: state.totalNgn + amountNgn,
        shoutoutQueue,
      };
    }
    case "chat": {
      const msg: ChatMessage = {
        id: nextId("c"),
        kind: "chat",
        guestId: action.guestId,
        text: action.text,
        ts: action.now,
      };
      return { ...state, chat: append(state.chat, msg) };
    }
    case "emote": {
      const guest = state.guests.find((g) => g.id === action.guestId);
      const emote: FloatingEmote = {
        id: nextId("e"),
        kind: action.kind,
        label: action.label,
        guestName: guest?.name ?? "Guest",
        x: 0.08 + Math.random() * 0.84,
      };
      return { ...state, emotes: [...state.emotes.slice(-11), emote] };
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
          text: "OWAMBE RAIN — the room is raining money!",
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
        programmeIndex: Math.min(state.programmeIndex + 1, PROGRAMME.length - 1),
        chat: append(state.chat, {
          id: nextId("c"),
          kind: "system",
          text: `Programme: ${PROGRAMME[Math.min(state.programmeIndex + 1, PROGRAMME.length - 1)].label}`,
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

function tierFor(sprayedNgn: number, current: Guest["tier"]): Guest["tier"] {
  const t = sprayedNgn >= 600_000 ? 3 : sprayedNgn >= 250_000 ? 2 : sprayedNgn >= 60_000 ? 1 : 0;
  return t > current ? (t as Guest["tier"]) : current;
}

export type SprayVisual = { amountUsd: number; noteCount: number; origin: "you" | "room" };

export function useHallEngine(onSprayVisual: (v: SprayVisual) => void) {
  const [state, dispatch] = useReducer(reducer, initialState);

  /* Latest-value refs, so the long-lived ambient/rain timers below read
     current state without re-subscribing on every dispatch. */
  const stateRef = useRef(state);
  const visualRef = useRef(onSprayVisual);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    visualRef.current = onSprayVisual;
  }, [onSprayVisual]);

  const spray = useCallback(
    (guestId: string, amountUsd: number, opts?: { message?: string; anonymous?: boolean }) => {
      const now = Date.now();
      dispatch({ type: "spray", guestId, amountUsd, message: opts?.message, anonymous: opts?.anonymous ?? false, now });
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
    dispatch({ type: "programme.advance", now: Date.now() });
  }, []);

  /* Emote expiry */
  useEffect(() => {
    if (state.emotes.length === 0) return;
    const oldest = state.emotes[0];
    const t = setTimeout(() => dispatch({ type: "emote.expire", id: oldest.id }), 2600);
    return () => clearTimeout(t);
  }, [state.emotes]);

  /* Rain detection: N sprays inside the window, cooldown respected */
  useEffect(() => {
    const s = stateRef.current;
    if (s.rainActive) return;
    const now = Date.now();
    if (now - s.lastRainEndedAt < RAIN_COOLDOWN_MS && s.lastRainEndedAt !== 0) return;
    const recent = s.sprays.filter((sp) => now - sp.ts < RAIN_WINDOW_MS);
    if (recent.length >= RAIN_THRESHOLD) {
      dispatch({ type: "rain.start", now });
      setTimeout(() => dispatch({ type: "rain.end", now: Date.now() }), RAIN_DURATION_MS);
    }
  }, [state.sprays]);

  /* Shout-out queue: MC reads one name at a time */
  useEffect(() => {
    if (state.shoutout === null && state.shoutoutQueue.length > 0) {
      dispatch({ type: "shoutout.next" });
    } else if (state.shoutout !== null) {
      const t = setTimeout(() => dispatch({ type: "shoutout.next" }), 4200);
      return () => clearTimeout(t);
    }
  }, [state.shoutout, state.shoutoutQueue]);

  /* Ambient room: other guests chat, emote and spray so the hall feels alive */
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (cancelled) return;
      const s = stateRef.current;
      const others = s.guests.filter((g) => !g.isYou);
      const g = others[Math.floor(Math.random() * others.length)];
      const roll = Math.random();
      if (roll < 0.38) {
        dispatch({
          type: "chat",
          guestId: g.id,
          text: AMBIENT_CHAT[Math.floor(Math.random() * AMBIENT_CHAT.length)],
          now: Date.now(),
        });
      } else if (roll < 0.62) {
        const kinds: { kind: EmoteKind; label: string }[] = [
          { kind: "clap", label: "Clap" },
          { kind: "zanku", label: "Zanku" },
          { kind: "owambe", label: "Owambe!" },
          { kind: "legwork", label: "Legwork" },
        ];
        const k = kinds[Math.floor(Math.random() * kinds.length)];
        dispatch({ type: "emote", guestId: g.id, kind: k.kind, label: k.label, now: Date.now() });
      } else {
        const amounts = [1, 5, 5, 20, 20, 50, 100];
        const amountUsd = amounts[Math.floor(Math.random() * amounts.length)];
        const message =
          Math.random() < 0.4
            ? AMBIENT_MESSAGES[Math.floor(Math.random() * AMBIENT_MESSAGES.length)]
            : undefined;
        dispatch({ type: "spray", guestId: g.id, amountUsd, message, anonymous: Math.random() < 0.1, now: Date.now() });
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
  }, []);

  return { state, spray, sendChat, sendEmote, advanceProgramme };
}
