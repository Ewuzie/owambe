/*
  The event as DATA, not as a code path.

  Upgrade prompt Part IV, §15: "A ceremony type is data, not a code path.
  Adding Ghana must not require a new module."

  Four ceremonies live here. They are NOT reskins of each other: the money
  moves differently in each one, and the product says so. Nigeria sprays
  cash on a dancing couple. Kenya pledges publicly and pays later. Ghana
  records donations at a table with a clerk. South Africa contributes to a
  rotating pot.

  CULTURAL REVIEW REQUIRED. Terms marked [review] are my best effort and
  must be checked by someone from that culture before this is shown
  publicly. The Yoruba terms are the only ones I hold with confidence.
  See upgrade prompt §10: cultural accuracy is a correctness requirement.

  Money model (decided 2026-08-01): THE GIVER PAYS THE FEE.
*/

export type CountryCode = "NG" | "KE" | "GH" | "ZA";
export type CurrencyCode = "NGN" | "KES" | "GHS" | "ZAR";

export type Currency = {
  code: CurrencyCode;
  symbol: string;
  locale: string;
  /** Units of this currency per 1 USD. Locked for the session, shown before every gift. */
  perUsd: number;
};

/* Placeholder rates until a real anchor quote is wired in (U1.5). */
export const CURRENCIES: Record<CurrencyCode, Currency> = {
  NGN: { code: "NGN", symbol: "₦", locale: "en-NG", perUsd: 1580 },
  KES: { code: "KES", symbol: "KSh", locale: "en-KE", perUsd: 129 },
  GHS: { code: "GHS", symbol: "₵", locale: "en-GH", perUsd: 15.2 },
  ZAR: { code: "ZAR", symbol: "R", locale: "en-ZA", perUsd: 18.4 },
};

export type Country = {
  code: CountryCode;
  name: string;
  currency: Currency;
};

export const COUNTRIES: Record<CountryCode, Country> = {
  NG: { code: "NG", name: "Nigeria", currency: CURRENCIES.NGN },
  KE: { code: "KE", name: "Kenya", currency: CURRENCIES.KES },
  GH: { code: "GH", name: "Ghana", currency: CURRENCIES.GHS },
  ZA: { code: "ZA", name: "South Africa", currency: CURRENCIES.ZAR },
};

export type ProgrammeItem = { label: string; local?: string };

/** The two groups a giver can belong to. Null for ceremonies without sides. */
export type SideConfig = { key: string; label: string };

/**
 * How money moves at this ceremony. This is the part that must not be
 * flattened — it is the difference between the cultures, not decoration.
 */
export type GivingStyle =
  /** Cash thrown over the celebrants while they dance. Instant, physical, public. */
  | "spray"
  /** A promise announced now, honoured later. Tracked as pledged/paid/outstanding. */
  | "pledge"
  /** Recorded at a table by a clerk, attributed to a family or group. */
  | "donation"
  /** Paid into a shared pot on a rotation. */
  | "contribution";

export type CeremonyType = {
  id: string;
  label: string;
  country: CountryCode;
  /** What the act of giving is called. Drives every verb in the interface. */
  givingVerb: string;
  /** Plural noun for the giving, e.g. "sprays", "pledges". */
  givingNoun: string;
  style: GivingStyle;
  /** One line explaining the ritual to someone who has never seen it. */
  blurb: string;
  programme: ProgrammeItem[];
  sides: [SideConfig, SideConfig] | null;
  /** Status earned by giving, lowest first. */
  tierNames: [string, string, string, string];
  /** What the room's live total is called. */
  totalLabel: string;
  /** What the leaderboard is called. */
  boardLabel: string;
  /** True if giving is a promise rather than a payment (Kenya). */
  pledgeBased: boolean;
};

export const OWAMBE_WEDDING: CeremonyType = {
  id: "ng-owambe-wedding",
  label: "Yoruba Traditional Wedding",
  country: "NG",
  givingVerb: "Spray",
  givingNoun: "sprays",
  style: "spray",
  blurb:
    "Guests shower cash over the couple while they dance. Loud, public and competitive, the way honour has always been paid.",
  sides: [
    { key: "bride", label: "Bride’s side" },
    { key: "groom", label: "Groom’s side" },
  ],
  tierNames: ["Aso-Ofi", "Gele Kékeré", "Gele Ńlá", "Double Gele"],
  totalLabel: "Sprayed tonight",
  boardLabel: "The Owambe Board",
  pledgeBased: false,
  programme: [
    { label: "Arrival of guests", local: "Ìdérù àwọn àlejò" },
    { label: "Alaga ijoko opens the floor", local: "Alága ìjókòó" },
    { label: "Groom's family entrance" },
    { label: "Bride's entrance", local: "Ìwọlé ìyàwó" },
    { label: "Prayers & prostration", local: "Ìdọ̀bálẹ̀" },
    { label: "First dance & spraying" },
    { label: "Cutting of the cake" },
    { label: "Party scatter", local: "Gbédù!" },
  ],
};

export const HARAMBEE: CeremonyType = {
  id: "ke-harambee",
  label: "Harambee",
  country: "KE",
  givingVerb: "Pledge",
  givingNoun: "pledges",
  style: "pledge",
  blurb:
    "The community is called together to raise a sum for one family. Pledges are announced aloud, written down, and honoured afterwards.",
  /* Harambee is organised by community, not by two family sides. [review] */
  sides: [
    { key: "family", label: "Family & clan" },
    { key: "community", label: "Friends & community" },
  ],
  /* [review] Swahili status terms — check with a Kenyan speaker. */
  tierNames: ["Mgeni", "Mchangiaji", "Mfadhili", "Mlezi"],
  totalLabel: "Pledged today",
  boardLabel: "The Pledge Board",
  pledgeBased: true,
  programme: [
    { label: "Welcome and prayer", local: "Karibu" },
    { label: "Chairperson opens the harambee" },
    { label: "Purpose is read aloud" },
    { label: "Guest of honour speaks" },
    { label: "Pledging begins", local: "Kuchangia" },
    { label: "Clerk reads the pledges back" },
    { label: "Total announced" },
    { label: "Vote of thanks", local: "Shukrani" },
  ],
};

export const GHANA_FUNERAL: CeremonyType = {
  id: "gh-funeral",
  label: "Ghanaian Funeral",
  country: "GH",
  givingVerb: "Donate",
  givingNoun: "donations",
  style: "donation",
  blurb:
    "A celebration of a life, where mourners are received in family groups and every donation is recorded openly by the clerks at the table.",
  /* Ghanaian funerals seat the bereaved family apart from sympathisers. [review] */
  sides: [
    { key: "family", label: "Bereaved family" },
    { key: "sympathisers", label: "Sympathisers" },
  ],
  /* [review] Akan honorifics — check with a Ghanaian speaker before publishing. */
  tierNames: ["Mourner", "Adamfo", "Ɔboafoɔ", "Nana"],
  totalLabel: "Donated today",
  boardLabel: "The Donation Table",
  pledgeBased: false,
  programme: [
    { label: "Filing past", local: "Ayie" },
    { label: "Tributes and eulogy" },
    { label: "Donations recorded at the table" },
    { label: "Family group presentations" },
    { label: "Words from the family head" },
    { label: "Reception and refreshments" },
    { label: "Closing dance" },
  ],
};

export const STOKVEL: CeremonyType = {
  id: "za-stokvel",
  label: "Stokvel Celebration",
  country: "ZA",
  givingVerb: "Contribute",
  givingNoun: "contributions",
  style: "contribution",
  blurb:
    "Members pay into a shared pot together, and the pot goes to one member on a rotation. Saving as a group, celebrated as a group.",
  sides: null,
  /* [review] Check these with a South African member of a stokvel. */
  tierNames: ["Member", "Contributor", "Patron", "Chairperson"],
  totalLabel: "In the pot",
  boardLabel: "The Members' Board",
  pledgeBased: false,
  programme: [
    { label: "Opening and welcome" },
    { label: "Roll call of members" },
    { label: "Contributions paid in" },
    { label: "This month's payout announced" },
    { label: "Next rotation agreed" },
    { label: "Refreshments and music" },
  ],
};

export const NAMING_CEREMONY: CeremonyType = {
  id: "ng-naming",
  label: "Igbo Naming Ceremony",
  country: "NG",
  givingVerb: "Spray",
  givingNoun: "sprays",
  style: "spray",
  blurb:
    "The child is presented and named before the family, and guests spray the mother as she dances the baby out.",
  /* A naming has no two competing sides: one family receives the child. */
  sides: null,
  /* [review] Igbo terms — check with an Igbo speaker before publishing. */
  tierNames: ["Ọbịa", "Enyi", "Ogbuefi", "Nne Ukwu"],
  totalLabel: "Sprayed today",
  boardLabel: "Those who came",
  pledgeBased: false,
  programme: [
    { label: "Arrival and kola", local: "Ọjị" },
    { label: "Prayers by the eldest" },
    { label: "The child is presented" },
    { label: "The name is announced", local: "Igu aha" },
    { label: "Tasting of the seven items" },
    { label: "Mother dances out & spraying" },
    { label: "Feasting" },
  ],
};

export const CEREMONIES: CeremonyType[] = [
  OWAMBE_WEDDING,
  NAMING_CEREMONY,
  HARAMBEE,
  GHANA_FUNERAL,
  STOKVEL,
];

export type EventStatus = "live" | "upcoming" | "ended";

export type OwambeEvent = {
  id: string;
  title: string;
  /** Who is being celebrated, honoured or raised for. */
  honouree: string;
  ceremony: CeremonyType;
  venue: string;
  city: string;
  hashtag: string;
  /** The host's chosen fabric or colour for the day. */
  clothName: string;
  /**
   * The aso-ebi, as an actual colour. This is the ONE accent the whole
   * product wears for this celebration, so no two events look alike.
   * Every value here is checked to at least 4.5:1 against white.
   */
  accent: string;
  accentDeep: string;
  status: EventStatus;
  /** Minutes from now: negative means it started that long ago. */
  startsInMinutes: number;
  /** Seeded total already given, in USD. Converted per event currency. */
  seedRaisedUsd: number;
  guestCount: number;
  hostName: string;
};

export const EVENTS: OwambeEvent[] = [
  {
    id: "adeola",
    title: "Adéṣewà ♥ Oláoluwa",
    honouree: "Adéṣewà & Oláoluwa",
    ceremony: OWAMBE_WEDDING,
    venue: "Balmoral Hall, Victoria Island",
    city: "Lagos",
    hashtag: "#AdeOla2026",
    clothName: "Coral & Gold",
    /* #dc3b1e measured 4.48:1 against white body text, just under the 4.5
       minimum. Darkened to 4.81:1 so the invitation header passes. */
    accent: "#d4371c",
    accentDeep: "#a72a12",
    status: "live",
    startsInMinutes: -95,
    seedRaisedUsd: 2100,
    guestCount: 199,
    hostName: "The Adéyemí family",
  },
  {
    id: "wanjiku",
    title: "Harambee for Wanjiku's surgery",
    honouree: "Wanjiku Njeri",
    ceremony: HARAMBEE,
    venue: "St. Andrew's Hall, Kilimani",
    city: "Nairobi",
    hashtag: "#HarambeeForWanjiku",
    clothName: "Green & White",
    accent: "#0f7b4f",
    accentDeep: "#0a5636",
    status: "live",
    startsInMinutes: -40,
    seedRaisedUsd: 1340,
    guestCount: 126,
    hostName: "Njeri family & Kilimani SACCO",
  },
  {
    id: "nana-yaw",
    title: "Celebration of life: Nana Yaw Mensah",
    honouree: "Nana Yaw Mensah, 1948 to 2026",
    ceremony: GHANA_FUNERAL,
    venue: "Forecourt of the State House",
    city: "Accra",
    hashtag: "#NanaYawMensah",
    clothName: "Black & Red",
    accent: "#b4141e",
    accentDeep: "#7d0d15",
    status: "upcoming",
    startsInMinutes: 156,
    seedRaisedUsd: 890,
    guestCount: 74,
    hostName: "The Mensah family",
  },
  {
    id: "masakhane",
    title: "Masakhane Stokvel, August payout",
    honouree: "This month: Thandiwe Dlamini",
    ceremony: STOKVEL,
    venue: "Soweto Community Centre",
    city: "Johannesburg",
    hashtag: "#MasakhaneStokvel",
    clothName: "Blue & Ochre",
    accent: "#14549e",
    accentDeep: "#0e3c73",
    status: "upcoming",
    startsInMinutes: 1310,
    seedRaisedUsd: 640,
    guestCount: 38,
    hostName: "Masakhane members",
  },
  {
    id: "chiamaka",
    title: "Chiamaka's naming ceremony",
    honouree: "Baby Chiamaka",
    ceremony: NAMING_CEREMONY,
    venue: "Ikoyi Family Compound",
    city: "Lagos",
    hashtag: "#BabyChiamaka",
    clothName: "White & Silver",
    accent: "#0e7c86",
    accentDeep: "#09585f",
    status: "ended",
    startsInMinutes: -4300,
    seedRaisedUsd: 1180,
    guestCount: 88,
    hostName: "The Okonkwo family",
  },
];

export function eventCurrency(e: OwambeEvent): Currency {
  return COUNTRIES[e.ceremony.country].currency;
}

export function eventCountry(e: OwambeEvent): Country {
  return COUNTRIES[e.ceremony.country];
}

export function findEvent(id: string): OwambeEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}

/** The event the bare /hall route still points at. */
export const DEMO_EVENT = EVENTS[0];

/* ---------------------------------------------------------------- money -- */

/** Platform take rate, added on top of the gift and shown before every confirmation. */
export const FEE_RATE = 0.03;

export const DENOMINATIONS_USD = [1, 5, 20, 50, 100] as const;

/** The gift converted to local currency. This is what the recipient receives, in full. */
export function toLocal(usd: number, c: Currency): number {
  return Math.round(usd * c.perUsd);
}

/** The fee, charged to the giver on top of the gift. */
export function feeUsd(usd: number): number {
  return Math.round(usd * FEE_RATE * 100) / 100;
}

/** What the giver is actually charged: the gift plus the fee. */
export function giverPaysUsd(usd: number): number {
  return Math.round((usd + feeUsd(usd)) * 100) / 100;
}

/** What the recipient receives: the whole gift, under giver-pays. */
export function celebrantReceives(usd: number, c: Currency): number {
  return toLocal(usd, c);
}

export function formatMoney(amount: number, c: Currency): string {
  return c.symbol + Math.round(amount).toLocaleString(c.locale);
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

/** "$1 = ₦1,580", the locked rate line. */
export function rateLine(c: Currency): string {
  return `$1 = ${c.symbol}${c.perUsd.toLocaleString(c.locale)}`;
}

/** Tier thresholds in USD, so status means the same thing in every country. */
export const TIER_THRESHOLDS_USD = [0, 40, 160, 380];

export function tierForUsd(givenUsd: number): 0 | 1 | 2 | 3 {
  if (givenUsd >= TIER_THRESHOLDS_USD[3]) return 3;
  if (givenUsd >= TIER_THRESHOLDS_USD[2]) return 2;
  if (givenUsd >= TIER_THRESHOLDS_USD[1]) return 1;
  return 0;
}

/** Rough "starts in" phrasing for the invitation page. */
export function startsInLabel(e: OwambeEvent): string {
  const m = e.startsInMinutes;
  if (e.status === "live") return "Happening now";
  if (e.status === "ended") return "This celebration has ended";
  if (m < 60) return `Starts in ${m} minutes`;
  if (m < 60 * 24) return `Starts in ${Math.round(m / 60)} hours`;
  return `Starts in ${Math.round(m / (60 * 24))} days`;
}
