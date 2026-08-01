/*
  Hall domain: the people in the room and what they do.

  The event itself (ceremony, currency, programme, money rules) lives in
  event.ts. This file is only about guests, gifts and chatter.

  Guests are generated per event so a Nairobi harambee is full of people
  from Nairobi and its diaspora, not Nigerian names with a different
  currency symbol.
*/

import {
  CountryCode,
  OwambeEvent,
  eventCurrency,
  toLocal,
  tierForUsd,
} from "./event";

export type Guest = {
  id: string;
  name: string;
  /** Key of a side in the event's ceremony, or "" if the ceremony has no sides. */
  side: string;
  city: string;
  table: number;
  tier: 0 | 1 | 2 | 3;
  /** Given so far, in USD. The source of truth for status and ranking. */
  givenUsd: number;
  isYou?: boolean;
};

export type Gift = {
  id: string;
  guestId: string;
  amountUsd: number;
  amountLocal: number;
  message?: string;
  anonymous: boolean;
  /** Pledged but not yet paid (Kenya harambee). */
  pledged: boolean;
  ts: number;
};

export type ChatMessage = {
  id: string;
  kind: "chat" | "ledger" | "system";
  guestId?: string;
  text: string;
  ts: number;
};

export type EmoteKind = string;
export type Emote = { kind: EmoteKind; label: string };

/** Gestures differ by ceremony: you do not dance at a funeral. */
export const EMOTES_BY_STYLE: Record<string, Emote[]> = {
  spray: [
    { kind: "prostrate", label: "Prostrate" },
    { kind: "kneel", label: "Kneel" },
    { kind: "clap", label: "Clap" },
    { kind: "zanku", label: "Zanku" },
    { kind: "legwork", label: "Legwork" },
    { kind: "owambe", label: "Owambe!" },
  ],
  pledge: [
    { kind: "clap", label: "Clap" },
    { kind: "amen", label: "Amen" },
    { kind: "asante", label: "Asante" },
    { kind: "stand", label: "Stand" },
    { kind: "cheer", label: "Cheer" },
  ],
  donation: [
    { kind: "bow", label: "Bow" },
    { kind: "condole", label: "Condolences" },
    { kind: "rest", label: "Rest well" },
    { kind: "clap", label: "Clap" },
    { kind: "tribute", label: "Tribute" },
  ],
  contribution: [
    { kind: "clap", label: "Clap" },
    { kind: "agreed", label: "Agreed" },
    { kind: "cheer", label: "Cheer" },
    { kind: "count", label: "Count me in" },
  ],
};

export function emotesFor(event: OwambeEvent): Emote[] {
  return EMOTES_BY_STYLE[event.ceremony.style] ?? EMOTES_BY_STYLE.spray;
}

let idCounter = 0;
export function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}`;
}

export const YOU_ID = "g_you";

type Seed = { name: string; city: string };

/** Local and diaspora names per country. Replaced by real attendance in U1.0. */
const GUEST_POOLS: Record<CountryCode, Seed[]> = {
  NG: [
    { name: "Aunty Bisi", city: "Houston" },
    { name: "Chief Emeka", city: "London" },
    { name: "Tolu A.", city: "Toronto" },
    { name: "Mama Funke", city: "Lagos" },
    { name: "Seyi O.", city: "Atlanta" },
    { name: "Ngozi K.", city: "Berlin" },
    { name: "Dapo L.", city: "Dubai" },
    { name: "Yemi & Bola", city: "Ibadan" },
    { name: "Chidinma", city: "Houston" },
    { name: "Kunle F.", city: "Abuja" },
    { name: "Amara J.", city: "New York" },
  ],
  KE: [
    { name: "Mama Njeri", city: "Nairobi" },
    { name: "Mzee Kamau", city: "Nakuru" },
    { name: "Grace W.", city: "London" },
    { name: "Otieno D.", city: "Kisumu" },
    { name: "Achieng' A.", city: "Dallas" },
    { name: "Kilimani SACCO", city: "Nairobi" },
    { name: "Wafula S.", city: "Eldoret" },
    { name: "Nyokabi M.", city: "Mombasa" },
    { name: "Brian K.", city: "Doha" },
    { name: "Mwangi J.", city: "Nairobi" },
    { name: "Aunty Waithera", city: "Manchester" },
  ],
  GH: [
    { name: "Auntie Akosua", city: "Accra" },
    { name: "Nana Kwabena", city: "Kumasi" },
    { name: "Yaa Asantewaa D.", city: "London" },
    { name: "Kofi M.", city: "Tema" },
    { name: "Ama Serwaa", city: "New York" },
    { name: "Abusua Panin", city: "Kumasi" },
    { name: "Kwame O.", city: "Takoradi" },
    { name: "Efua B.", city: "Amsterdam" },
    { name: "Mensah family", city: "Accra" },
    { name: "Adjoa T.", city: "Cape Coast" },
    { name: "Kojo A.", city: "Toronto" },
  ],
  ZA: [
    { name: "Mama Thandi", city: "Soweto" },
    { name: "Sipho M.", city: "Johannesburg" },
    { name: "Lerato K.", city: "Cape Town" },
    { name: "Bongani N.", city: "Durban" },
    { name: "Nomsa D.", city: "London" },
    { name: "Tebogo R.", city: "Pretoria" },
    { name: "Zanele P.", city: "Port Elizabeth" },
    { name: "Ayanda S.", city: "Perth" },
    { name: "Mandla Z.", city: "Bloemfontein" },
    { name: "Palesa M.", city: "Soweto" },
    { name: "Khaya B.", city: "Cape Town" },
  ],
};

/** Deterministic spread of the seeded total across the guests, biggest first. */
const SHARE = [0.22, 0.18, 0.13, 0.1, 0.08, 0.07, 0.06, 0.05, 0.04, 0.04, 0.03];

export function makeGuests(event: OwambeEvent): Guest[] {
  const pool = GUEST_POOLS[event.ceremony.country];
  const sides = event.ceremony.sides;
  const you: Guest = {
    id: YOU_ID,
    name: "You",
    side: sides ? sides[0].key : "",
    city: "Houston",
    table: 4,
    tier: 0,
    givenUsd: 0,
    isYou: true,
  };
  const rest = pool.map((seed, i) => {
    const givenUsd = Math.round(event.seedRaisedUsd * (SHARE[i] ?? 0.02));
    return {
      id: `g_${event.id}_${i}`,
      name: seed.name,
      side: sides ? sides[i % 2].key : "",
      city: seed.city,
      table: (i % 6) + 1,
      tier: tierForUsd(givenUsd),
      givenUsd,
    };
  });
  return [you, ...rest];
}

export function givenLocal(g: Guest, event: OwambeEvent): number {
  return toLocal(g.givenUsd, eventCurrency(event));
}

/** Chatter differs by ceremony. A funeral room does not shout. */
export function ambientChat(event: OwambeEvent): string[] {
  switch (event.ceremony.style) {
    case "pledge":
      return [
        "Karibu everyone, we are with you",
        "The Kilimani group is pledging together",
        "Wanjiku, be strong. We are here",
        "Watching from London, count me in",
        "Chairperson, please read that again",
        "God bless whoever just pledged",
        "My family will send ours tonight",
      ];
    case "donation":
      return [
        "Rest well, Nana. You served us all",
        "Watching from New York with the family",
        "The tributes are beautiful",
        "Damirifa due 🕊️",
        "Our group will present together",
        "He was a father to the whole street",
        "Condolences to the Mensah family",
      ];
    case "contribution":
      return [
        "Masakhane! We move together",
        "Thandiwe deserves this one",
        "My contribution is in",
        "Who is next month?",
        "Watching from Cape Town",
        "This is how we build",
      ];
    default:
      return [
        "This gele arrangement is doing something to me 😭",
        "Who is the DJ?? He's cooking",
        "The couple's outfit... tailor deserves an award",
        "Greetings from Toronto! Wish I was on that dance floor",
        "Alaga is on FIRE tonight",
        "My table, we move 🍾",
        "Adéṣewà looks stunning walahi",
        "That last spray shook the room o",
        "Groom's side, where una dey??",
      ];
  }
}

export function ambientMessages(event: OwambeEvent): string[] {
  switch (event.ceremony.style) {
    case "pledge":
      return ["For Wanjiku's treatment", "From the Kilimani group", "God heal her", "From all of us abroad"];
    case "donation":
      return ["Rest well, Nana", "From the Mensah family", "Damirifa due", "On behalf of the church"];
    case "contribution":
      return ["This month's contribution", "Masakhane forever", "For Thandiwe", "Count me in"];
    default:
      return ["For the beautiful couple!", "From all of us in London", "God bless your union", "Ìgbéyàwó rere!"];
  }
}

/** The opening line the room sees when it loads. */
export function openingLine(event: OwambeEvent): string {
  switch (event.ceremony.style) {
    case "pledge":
      return "The chairperson has opened the harambee. Karibu!";
    case "donation":
      return "The donation table is open. Please be seated.";
    case "contribution":
      return "The meeting is open. Roll call has begun.";
    default:
      return "Alaga has opened the floor. Ẹ káàbọ̀!";
  }
}

/** Tailwind class for a side's colour, by its position in the ceremony. */
export function sideClasses(event: OwambeEvent, sideKey: string) {
  const i = event.ceremony.sides?.findIndex((s) => s.key === sideKey) ?? -1;
  if (i < 0) {
    return {
      bg: "bg-cream-faint",
      bgSoft: "bg-cream-faint/20",
      bgFaint: "bg-cream-faint/15",
      text: "text-cream-mute",
    };
  }
  return {
    bg: i === 0 ? "bg-side-a" : "bg-side-b",
    bgSoft: i === 0 ? "bg-side-a/20" : "bg-side-b/20",
    bgFaint: i === 0 ? "bg-side-a/15" : "bg-side-b/15",
    text: i === 0 ? "text-side-a" : "text-side-b",
  };
}
