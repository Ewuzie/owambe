/* Owambe hall domain: types, mock party data, money helpers. */

export type Side = "bride" | "groom";

export type Guest = {
  id: string;
  name: string;
  side: Side;
  city: string;
  table: number;
  /** gele/agbada tier, 0 = free tier (honest and good looking) */
  tier: 0 | 1 | 2 | 3;
  sprayedNgn: number;
  isYou?: boolean;
};

export type Spray = {
  id: string;
  guestId: string;
  amountUsd: number;
  amountNgn: number;
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

export type ProgrammeItem = { label: string; yoruba?: string };

/** Yoruba wedding programme, in the right order (Section 10). */
export const PROGRAMME: ProgrammeItem[] = [
  { label: "Arrival of guests", yoruba: "Ìdérù àwọn àlejò" },
  { label: "Alaga ijoko opens the floor", yoruba: "Alága ìjókòó" },
  { label: "Groom's family entrance" },
  { label: "Bride's entrance", yoruba: "Ìwọlé ìyàwó" },
  { label: "Prayers & prostration", yoruba: "Ìdọ̀bálẹ̀" },
  { label: "First dance & spraying" },
  { label: "Cutting of the cake" },
  { label: "Party scatter", yoruba: "Gbédù!" },
];

/** Mock FX: 1 USD -> NGN. Locked for the session, shown before every throw. */
export const FX_USD_NGN = 1580;
/** Platform take rate, shown transparently in the spray sheet. */
export const FEE_RATE = 0.03;

export const DENOMINATIONS_USD = [1, 5, 20, 50, 100] as const;

export function usdToNgn(usd: number): number {
  return Math.round(usd * FX_USD_NGN);
}

export function feeUsd(usd: number): number {
  return Math.round(usd * FEE_RATE * 100) / 100;
}

export function celebrantReceivesNgn(usd: number): number {
  return usdToNgn(usd * (1 - FEE_RATE));
}

export function formatNgn(n: number): string {
  return "₦" + Math.round(n).toLocaleString("en-NG");
}

export function formatUsd(n: number): string {
  return (
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: n % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

export const PARTY = {
  title: "Adéṣewà ♥ Oláoluwa",
  type: "Yoruba Traditional Wedding",
  hashtag: "#AdeOla2026",
  venue: "Balmoral Hall, Victoria Island, Lagos",
  asoEbiName: "Coral & Gold",
};

let idCounter = 0;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

export const YOU_ID = "g_you";

export const INITIAL_GUESTS: Guest[] = [
  { id: YOU_ID, name: "You", side: "bride", city: "Houston", table: 4, tier: 0, sprayedNgn: 0, isYou: true },
  { id: "g_bisi", name: "Aunty Bisi", side: "bride", city: "Houston", table: 4, tier: 3, sprayedNgn: 948000 },
  { id: "g_emeka", name: "Chief Emeka", side: "groom", city: "London", table: 1, tier: 3, sprayedNgn: 790000 },
  { id: "g_tolu", name: "Tolu A.", side: "groom", city: "Toronto", table: 2, tier: 2, sprayedNgn: 474000 },
  { id: "g_funke", name: "Mama Funke", side: "bride", city: "Lagos", table: 1, tier: 2, sprayedNgn: 395000 },
  { id: "g_seyi", name: "Seyi O.", side: "bride", city: "Atlanta", table: 3, tier: 1, sprayedNgn: 237000 },
  { id: "g_ngozi", name: "Ngozi K.", side: "groom", city: "Berlin", table: 5, tier: 1, sprayedNgn: 158000 },
  { id: "g_dapo", name: "Dapo L.", side: "groom", city: "Dubai", table: 2, tier: 1, sprayedNgn: 126400 },
  { id: "g_yemi", name: "Yemi & Bola", side: "bride", city: "Ibadan", table: 6, tier: 0, sprayedNgn: 79000 },
  { id: "g_chi", name: "Chidinma", side: "groom", city: "Houston", table: 5, tier: 0, sprayedNgn: 63200 },
  { id: "g_kunle", name: "Kunle F.", side: "groom", city: "Abuja", table: 6, tier: 0, sprayedNgn: 31600 },
  { id: "g_amara", name: "Amara J.", side: "bride", city: "New York", table: 3, tier: 0, sprayedNgn: 15800 },
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
