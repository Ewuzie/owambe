/*
  The event as DATA, not as a code path.

  Upgrade prompt Part IV, §15: "A ceremony type is data, not a code path.
  Adding Ghana must not require a new module." This file is the beginning of
  that. Nothing here is Nigeria-specific except the values in DEMO_EVENT.

  Money model (decided 2026-08-01): THE GIVER PAYS THE FEE.
  A $20 spray charges the giver $20.60 and delivers the full $20 to the
  celebrant. What you spray is what they get, so the figure the MC announces
  is the figure that lands.
*/

export type CurrencyCode = "NGN" | "KES" | "GHS" | "ZAR";

export type Currency = {
  code: CurrencyCode;
  symbol: string;
  locale: string;
  /** Units of this currency per 1 USD. Locked for the session and shown before every throw. */
  perUsd: number;
};

/* Rates are placeholders until a real anchor quote is wired in (U1.5). */
export const CURRENCIES: Record<CurrencyCode, Currency> = {
  NGN: { code: "NGN", symbol: "₦", locale: "en-NG", perUsd: 1580 },
  KES: { code: "KES", symbol: "KSh", locale: "en-KE", perUsd: 129 },
  GHS: { code: "GHS", symbol: "₵", locale: "en-GH", perUsd: 15.2 },
  ZAR: { code: "ZAR", symbol: "R", locale: "en-ZA", perUsd: 18.4 },
};

export type ProgrammeItem = { label: string; yoruba?: string };

/** The two groups a giver can belong to. Null for ceremonies without sides. */
export type SideConfig = { key: string; label: string };

export type CeremonyType = {
  id: string;
  label: string;
  /** What the act of giving is called here. Nigeria sprays; Kenya pledges. */
  givingVerb: string;
  programme: ProgrammeItem[];
  /** Bride's side vs groom's side, or the local equivalent. */
  sides: [SideConfig, SideConfig] | null;
  /** Status names earned by giving, lowest first. Culturally specific. */
  tierNames: [string, string, string, string];
};

export const YORUBA_WEDDING: CeremonyType = {
  id: "yoruba-wedding",
  label: "Yoruba Traditional Wedding",
  givingVerb: "Spray",
  sides: [
    { key: "bride", label: "Bride’s side" },
    { key: "groom", label: "Groom’s side" },
  ],
  tierNames: ["Aso-Ofi", "Gele Kékeré", "Gele Ńlá", "Double Gele"],
  programme: [
    { label: "Arrival of guests", yoruba: "Ìdérù àwọn àlejò" },
    { label: "Alaga ijoko opens the floor", yoruba: "Alága ìjókòó" },
    { label: "Groom's family entrance" },
    { label: "Bride's entrance", yoruba: "Ìwọlé ìyàwó" },
    { label: "Prayers & prostration", yoruba: "Ìdọ̀bálẹ̀" },
    { label: "First dance & spraying" },
    { label: "Cutting of the cake" },
    { label: "Party scatter", yoruba: "Gbédù!" },
  ],
};

export type OwambeEvent = {
  id: string;
  title: string;
  ceremony: CeremonyType;
  currency: Currency;
  venue: string;
  hashtag: string;
  asoEbiName: string;
};

export const DEMO_EVENT: OwambeEvent = {
  id: "evt_demo",
  title: "Adéṣewà ♥ Oláoluwa",
  ceremony: YORUBA_WEDDING,
  currency: CURRENCIES.NGN,
  venue: "Balmoral Hall, Victoria Island, Lagos",
  hashtag: "#AdeOla2026",
  asoEbiName: "Coral & Gold",
};

/* ---------------------------------------------------------------- money -- */

/** Platform take rate, added on top of the spray and shown before every throw. */
export const FEE_RATE = 0.03;

export const DENOMINATIONS_USD = [1, 5, 20, 50, 100] as const;

/** The spray converted to local currency. This is what the celebrant receives, in full. */
export function toLocal(usd: number, c: Currency): number {
  return Math.round(usd * c.perUsd);
}

/** The fee, charged to the giver on top of the spray. */
export function feeUsd(usd: number): number {
  return Math.round(usd * FEE_RATE * 100) / 100;
}

/** What the giver's card is actually charged: the spray plus the fee. */
export function giverPaysUsd(usd: number): number {
  return Math.round((usd + feeUsd(usd)) * 100) / 100;
}

/**
 * What the celebrant receives. Under giver-pays this is the whole spray,
 * so the announced figure and the delivered figure are the same number.
 */
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

/** Index of a side within the ceremony, for colour assignment. -1 if none. */
export function sideIndex(ceremony: CeremonyType, key: string): number {
  if (!ceremony.sides) return -1;
  return ceremony.sides.findIndex((s) => s.key === key);
}
