"use client";

import Link from "next/link";
import { CSSProperties, useMemo, useState } from "react";
import {
  CEREMONIES,
  COUNTRIES,
  CountryCode,
  formatMoney,
} from "@/lib/event";

/*
  Host: create a celebration.

  The screens are built; saving is not. Nothing here is persisted, because
  persistence is U1.0 and needs a database. Every field, every choice and
  the live preview are real, so when the store lands this page only needs
  its submit handler pointed at it.

  The page says so plainly rather than pretending to save. Lying to the
  host about whether their celebration exists would be the worst possible
  first impression.
*/

const COUNTRY_LIST: CountryCode[] = ["NG", "KE", "GH", "ZA"];

/** Cloth colours, each checked at 4.5:1 or better against white text. */
const CLOTHS: { name: string; hex: string; deep: string }[] = [
  { name: "Coral & Gold", hex: "#d4371c", deep: "#a72a12" },
  { name: "Green & White", hex: "#0f7b4f", deep: "#0a5636" },
  { name: "Black & Red", hex: "#b4141e", deep: "#7d0d15" },
  { name: "Blue & Ochre", hex: "#14549e", deep: "#0e3c73" },
  { name: "Teal & Silver", hex: "#0e7c86", deep: "#09585f" },
  { name: "Royal Purple", hex: "#6b2d8f", deep: "#4c1f66" },
  { name: "Deep Rose", hex: "#a81f5d", deep: "#761543" },
  { name: "Ink & Bronze", hex: "#3f3a2e", deep: "#2a271f" },
];

export function CreateCelebration() {
  const [country, setCountry] = useState<CountryCode>("NG");
  const ceremonies = useMemo(
    () => CEREMONIES.filter((c) => c.country === country),
    [country],
  );
  const [ceremonyId, setCeremonyId] = useState(ceremonies[0].id);
  const ceremony =
    CEREMONIES.find((c) => c.id === ceremonyId && c.country === country) ?? ceremonies[0];

  const [title, setTitle] = useState("");
  const [honouree, setHonouree] = useState("");
  const [city, setCity] = useState("");
  const [venue, setVenue] = useState("");
  const [hostName, setHostName] = useState("");
  const [hashtag, setHashtag] = useState("");
  const [cloth, setCloth] = useState(CLOTHS[0]);
  const [submitted, setSubmitted] = useState(false);

  const currency = COUNTRIES[country].currency;
  const style = { "--accent": cloth.hex, "--accent-deep": cloth.deep } as CSSProperties;

  const onCountry = (c: CountryCode) => {
    setCountry(c);
    const first = CEREMONIES.find((x) => x.country === c);
    if (first) setCeremonyId(first.id);
  };

  const ready = title.trim() !== "" && honouree.trim() !== "" && city.trim() !== "";

  return (
    <div style={style} className="min-h-dvh bg-paper text-ink">
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-6xl items-baseline justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="display text-[17px]">
            Owambe
          </Link>
          <span className="microlabel">Host</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <h1 className="rise display mt-10 text-[clamp(34px,8vw,92px)]">
          Create a
          <br />
          <span className="text-accent">celebration</span>
        </h1>

        {/* Honest state of the feature */}
        <div className="mt-8 border-l-4 border-accent bg-paper-2 py-4 pl-5">
          <p className="microlabel">Not saving yet</p>
          <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-ink-mute">
            These screens are built, but celebrations are not stored anywhere
            until the database goes in. Fill this in to see how it works and to
            check the design — nothing you enter here will survive a refresh,
            and the link will not open for anyone else.
          </p>
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_420px]">
          {/* The form */}
          <form className="min-w-0" onSubmit={(e) => e.preventDefault()}>
            <Fieldset legend="What is the occasion">
              <Field
                id="title"
                label="Name of the celebration"
                value={title}
                onChange={setTitle}
                placeholder="Adéṣewà ♥ Oláoluwa"
              />
              <Field
                id="honouree"
                label="Who is being celebrated"
                value={honouree}
                onChange={setHonouree}
                placeholder="Adéṣewà & Oláoluwa"
              />
            </Fieldset>

            <Fieldset legend="Where in Africa">
              <div>
                <span className="microlabel block">Country</span>
                <div className="mt-2 flex flex-wrap gap-0 border-2 border-ink">
                  {COUNTRY_LIST.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onCountry(c)}
                      aria-pressed={country === c}
                      className={`microlabel flex-1 cursor-pointer border-r border-rule px-3 py-3.5 last:border-r-0 transition-colors duration-150 ${
                        country === c ? "bg-ink !text-paper" : "hover:bg-paper-2"
                      }`}
                    >
                      {COUNTRIES[c].name}
                    </button>
                  ))}
                </div>
                <p className="money mt-2 text-[11px] text-ink-faint">
                  Money will be received in {currency.code} · example{" "}
                  {formatMoney(currency.perUsd * 100, currency)} for a $100 gift
                </p>
              </div>

              <div>
                <span className="microlabel block">Ceremony</span>
                <div className="mt-2 flex flex-col border-2 border-ink">
                  {ceremonies.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCeremonyId(c.id)}
                      aria-pressed={ceremony.id === c.id}
                      className={`cursor-pointer border-b border-rule px-4 py-3.5 text-left last:border-b-0 transition-colors duration-150 ${
                        ceremony.id === c.id ? "bg-ink text-paper" : "hover:bg-paper-2"
                      }`}
                    >
                      <span className="block text-[14px] font-bold">{c.label}</span>
                      <span
                        className={`mt-1 block text-[11.5px] leading-snug ${
                          ceremony.id === c.id ? "text-paper/70" : "text-ink-faint"
                        }`}
                      >
                        Guests {c.givingVerb.toLowerCase()} · {c.blurb}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <Field id="city" label="City" value={city} onChange={setCity} placeholder="Lagos" />
              <Field
                id="venue"
                label="Venue"
                value={venue}
                onChange={setVenue}
                placeholder="Balmoral Hall, Victoria Island"
              />
            </Fieldset>

            <Fieldset legend="The cloth of the day">
              <div>
                <span className="microlabel block">
                  Your aso-ebi colour — the whole page wears it
                </span>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {CLOTHS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setCloth(c)}
                      aria-pressed={cloth.hex === c.hex}
                      aria-label={c.name}
                      className={`h-16 cursor-pointer border-2 transition-transform duration-150 ${
                        cloth.hex === c.hex ? "border-ink" : "border-transparent"
                      }`}
                      style={{ background: c.hex }}
                    >
                      {cloth.hex === c.hex && (
                        <span className="microlabel !text-white">Chosen</span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-ink-faint">
                  {cloth.name}. Every colour offered here is checked for readable
                  contrast, so the invitation stays legible whichever you pick.
                </p>
              </div>
            </Fieldset>

            <Fieldset legend="Finishing touches">
              <Field
                id="host"
                label="Hosted by"
                value={hostName}
                onChange={setHostName}
                placeholder="The Adéyemí family"
              />
              <Field
                id="hashtag"
                label="Hashtag"
                value={hashtag}
                onChange={setHashtag}
                placeholder="#AdeOla2026"
              />
            </Fieldset>

            <div className="mt-10 border-t-2 border-ink pt-8">
              <button
                type="button"
                disabled={!ready}
                onClick={() => setSubmitted(true)}
                className="display w-full cursor-pointer bg-accent px-8 py-6 text-[clamp(16px,2.4vw,24px)] text-on-accent transition-colors duration-150 hover:bg-ink disabled:cursor-not-allowed disabled:bg-paper-3 disabled:text-ink-faint sm:w-auto"
              >
                Create and get the link
              </button>
              {!ready && (
                <p className="mt-3 text-[12px] text-ink-faint">
                  Add a name, who is being celebrated, and a city to continue.
                </p>
              )}
              {submitted && (
                <div className="storm-in mt-6 border-l-4 border-accent bg-paper-2 py-4 pl-5">
                  <p className="microlabel">Nothing was saved</p>
                  <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-ink-mute">
                    This is where the celebration would be created and a shareable
                    link handed to you. It needs the database first. Everything
                    else on this page — the form, the ceremony rules, the cloth
                    colour, the preview — is finished and will not need rebuilding.
                  </p>
                </div>
              )}
            </div>
          </form>

          {/* Live preview */}
          <aside className="min-w-0">
            <div className="sticky top-6">
              <span className="microlabel">Your invitation</span>
              <div className="mt-3 border-2 border-ink">
                <div className="bg-accent px-5 py-7 text-on-accent">
                  <span className="microlabel !text-on-accent/75">You are invited to</span>
                  <div className="display mt-2 break-words text-[clamp(20px,3vw,30px)]">
                    {title.trim() || "Your celebration"}
                  </div>
                  <p className="mt-3 text-[13px] text-on-accent/90">
                    {honouree.trim() || "Who is being celebrated"}
                  </p>
                </div>
                <dl className="px-5 py-4">
                  <Row label="Ceremony" value={ceremony.label} />
                  <Row label="Guests will" value={ceremony.givingVerb} />
                  <Row
                    label="Where"
                    value={
                      [venue.trim(), city.trim(), COUNTRIES[country].name]
                        .filter(Boolean)
                        .join(", ") || COUNTRIES[country].name
                    }
                  />
                  <Row label="Hosted by" value={hostName.trim() || "—"} />
                  <Row label="Cloth" value={cloth.name} />
                  <Row label="Hashtag" value={hashtag.trim() || "—"} />
                </dl>
              </div>
              <p className="mt-3 text-[11.5px] leading-snug text-ink-faint">
                This is what guests see when you send the link. It updates as you
                type.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="mb-10 border-t-2 border-ink pt-6">
      <legend className="display pr-4 text-[clamp(17px,2.4vw,22px)]">{legend}</legend>
      <div className="mt-5 flex flex-col gap-6">{children}</div>
    </fieldset>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="microlabel block">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full border-b-2 border-ink bg-transparent py-2.5 text-[17px] font-medium placeholder:font-normal placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="ledger-row flex items-baseline justify-between gap-4 py-2.5 last:border-b-0">
      <dt className="microlabel flex-none">{label}</dt>
      <dd className="min-w-0 truncate text-right text-[13px] font-medium">{value}</dd>
    </div>
  );
}
