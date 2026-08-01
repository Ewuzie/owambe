/*
  Hall domain: the people in the room and what they do.

  The event itself (ceremony, currency, programme, money rules) lives in
  event.ts. This file is only about guests, sprays and chatter.
*/

import { OwambeEvent } from "./event";

export type Guest = {
  id: string;
  name: string;
  /** Key of a side in the event's ceremony, e.g. "bride". */
  side: string;
  city: string;
  table: number;
  /** Status tier, 0 = free tier (honest and good looking). Named by the ceremony. */
  tier: 0 | 1 | 2 | 3;
  /** Given so far, in the event's local currency. */
  givenLocal: number;
  isYou?: boolean;
};

export type Spray = {
  id: string;
  guestId: string;
  amountUsd: number;
  amountLocal: number;
  message?: string;
  anonymous: boolean;
  ts: number;
};

export type ChatMessage = {
  id: string;
  kind: "chat" | "ledger" | "system";
  guestId?: string;
  text: string;
  ts: number;
};

export type EmoteKind =
  | "prostrate"
  | "kneel"
  | "clap"
  | "zanku"
  | "legwork"
  | "owambe";

export const EMOTES: { kind: EmoteKind; label: string }[] = [
  { kind: "prostrate", label: "Prostrate" },
  { kind: "kneel", label: "Kneel" },
  { kind: "clap", label: "Clap" },
  { kind: "zanku", label: "Zanku" },
  { kind: "legwork", label: "Legwork" },
  { kind: "owambe", label: "Owambe!" },
];

let idCounter = 0;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

export const YOU_ID = "g_you";

/** Seeded guests for the demo event. Replaced by real attendance in U1.0. */
export const INITIAL_GUESTS: Guest[] = [
  { id: YOU_ID, name: "You", side: "bride", city: "Houston", table: 4, tier: 0, givenLocal: 0, isYou: true },
  { id: "g_bisi", name: "Aunty Bisi", side: "bride", city: "Houston", table: 4, tier: 3, givenLocal: 948000 },
  { id: "g_emeka", name: "Chief Emeka", side: "groom", city: "London", table: 1, tier: 3, givenLocal: 790000 },
  { id: "g_tolu", name: "Tolu A.", side: "groom", city: "Toronto", table: 2, tier: 2, givenLocal: 474000 },
  { id: "g_funke", name: "Mama Funke", side: "bride", city: "Lagos", table: 1, tier: 2, givenLocal: 395000 },
  { id: "g_seyi", name: "Seyi O.", side: "bride", city: "Atlanta", table: 3, tier: 1, givenLocal: 237000 },
  { id: "g_ngozi", name: "Ngozi K.", side: "groom", city: "Berlin", table: 5, tier: 1, givenLocal: 158000 },
  { id: "g_dapo", name: "Dapo L.", side: "groom", city: "Dubai", table: 2, tier: 1, givenLocal: 126400 },
  { id: "g_yemi", name: "Yemi & Bola", side: "bride", city: "Ibadan", table: 6, tier: 0, givenLocal: 79000 },
  { id: "g_chi", name: "Chidinma", side: "groom", city: "Houston", table: 5, tier: 0, givenLocal: 63200 },
  { id: "g_kunle", name: "Kunle F.", side: "groom", city: "Abuja", table: 6, tier: 0, givenLocal: 31600 },
  { id: "g_amara", name: "Amara J.", side: "bride", city: "New York", table: 3, tier: 0, givenLocal: 15800 },
];

export const AMBIENT_CHAT: string[] = [
  "This gele arrangement is doing something to me 😭",
  "Who is the DJ?? He's cooking",
  "The couple's outfit... tailor deserves an award",
  "Greetings from Toronto! Wish I was on that dance floor",
  "Alaga is on FIRE tonight",
  "My table, we move 🍾",
  "Adéṣewà looks stunning walahi",
  "That last spray shook the room o",
  "Someone should send me small chops through the screen",
  "Groom's side, where una dey??",
  "This band is playing my song!",
];

export const AMBIENT_MESSAGES: string[] = [
  "For the beautiful couple!",
  "From all of us in London",
  "God bless your union",
  "Ìgbéyàwó rere!",
  "Grandma says hello",
  "Chop life, you two",
];

/** Tailwind class for a side's colour, by its position in the ceremony. */
export function sideClasses(event: OwambeEvent, sideKey: string) {
  const i = event.ceremony.sides?.findIndex((s) => s.key === sideKey) ?? -1;
  return {
    bg: i === 0 ? "bg-side-a" : "bg-side-b",
    bgSoft: i === 0 ? "bg-side-a/20" : "bg-side-b/20",
    bgFaint: i === 0 ? "bg-side-a/15" : "bg-side-b/15",
    text: i === 0 ? "text-side-a" : "text-side-b",
  };
}
