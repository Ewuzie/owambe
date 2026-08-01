# Owambe v2.0 upgrade — Block 0 report

Inventory, gap report and proposed order, as required by "Step zero" and Appendix A
Block 0 of the v2.0 upgrade prompt. **No code has been written for the upgrade.**

Date: 1 August 2026
Against commit: `b4e1ca8` (Build the Party Hall room)

---

## 1. Inventory: what exists today

### Scale

12 source files, **1,991 lines** of TypeScript/TSX/CSS. Production dependencies are
`next`, `react`, `react-dom`. Nothing else.

### Routes

| Route | What it is |
|---|---|
| `/` | Redirect to `/hall` |
| `/hall` | The Party Hall. The only real surface in the product. |

### Files

```
src/app/globals.css              Aso-Ebi Ceremonial token layer (colour, type, motion, shape)
src/app/layout.tsx               Fonts: Libre Bodoni, Public Sans, Space Mono
src/app/page.tsx                 Redirect
src/app/hall/page.tsx            Hall route
src/lib/hall.ts                  Domain types, hardcoded party, money helpers
src/components/hall/Hall.tsx     Room layout, three rails, mobile drawer
src/components/hall/LiveFloor.tsx    Video well (faked), programme strip, tables, emotes, MC banner
src/components/hall/SprayCanvas.tsx  Canvas note physics, pile, rain
src/components/hall/SprayDeck.tsx    Denominations, throw gesture, fee/FX disclosure
src/components/hall/MoneyRail.tsx    Live total, Owambe Board, crown, family war meter
src/components/hall/ChatRail.tsx     Hall/table chat, spray ledger lines
src/components/hall/useHallEngine.ts Single useReducer holding all room state
```

### State management

One `useReducer` inside `useHallEngine.ts`, held in browser memory. Actions:
`spray`, `chat`, `emote`, `rain.start/end`, `shoutout.next`, `programme.advance`.

**All state is lost on page refresh.** There is no persistence of any kind:
no database, no localStorage, no cookies, no server.

### What is real vs what is mocked

| Area | Status | Detail |
|---|---|---|
| Visual design system | **Real** | Token layer in `globals.css`, verified: 0 elements with radius > 2px, 0 box-shadows, correct fonts |
| Spray interaction | **Real** | Throw gesture, keyboard path, canvas physics, pile accumulation, reduced-motion variant |
| Accessibility | **Real** | Keyboard-only spray, ARIA labels, focus states, `prefers-reduced-motion`, mobile rail drawer |
| Fee and FX disclosure | **Real** | Shown before every throw, computed correctly from constants |
| Live video | **Mocked** | A styled static panel. No WebRTC, no HLS, no provider. |
| Other guests | **Mocked** | 12 hardcoded guests in `INITIAL_GUESTS`; their chat/emotes/sprays fire on `setTimeout` |
| Presence count | **Mocked** | Literally `guests.length + 187` |
| Money | **Mocked** | `FX_USD_NGN = 1580` and `FEE_RATE = 0.03` are constants. No payment rail. |
| Identity | **Absent** | No accounts, no auth, no sessions. The user is a hardcoded guest named "You". |
| Backend | **Absent** | No API routes, no server actions, no database, no realtime transport |
| Blockchain | **Absent** | No Stellar, no Soroban, no contracts, no SDK, no wallet |

Verified by scan: the codebase contains **zero** occurrences of `fetch(`, `process.env`,
`localStorage`, any auth/session/cookie code, any database client, any websocket, and
any Stellar or Soroban reference. The single grep hit for "Stellar-adjacent" terms was
a code comment reading `Mock FX`.

### Honest summary

The Party Hall is a **high-fidelity, single-player, client-side simulation** of a room.
It is a convincing prototype of the *feel* of spraying. It is not connected to anything.

---

## 2. Gap report

Every requirement in the upgrade prompt, marked **already exists** / **partial** / **missing**.

### Part II — Identity and profiles

| § | Requirement | Status | Note |
|---|---|---|---|
| 5 | Spray within seconds, no account | Partial | No signup barrier exists, but only because no account system and no payment step exist either. Today's speed is not evidence; it is the absence of the feature. |
| 6 | Tier 0 Guest | Missing | |
| 6 | Tier 1 Member (phone verified) | Missing | |
| 6 | Tier 2 Host (KYC) | Missing | |
| 6 | Tier 3 Vendor | Missing | |
| 7 | Silent account creation | Missing | |
| 7 | Claiming and merging from any device | Missing | |
| 7 | Unclaimed accounts never expire, never lose a gift | Missing | |
| 8 | On-chain: addresses, amounts, event ids only | Missing | Nothing is stored anywhere, so the rule is trivially unviolated |
| 8 | Off-chain encrypted personal data | Missing | |

### Part III — The five upgrades

| § | Requirement | Status | Note |
|---|---|---|---|
| 9 | Permanent event page after the event | Missing | Nothing survives a refresh |
| 9 | Host sees full giver list | Missing | |
| 9 | Public / amount-hidden / anonymous per gift | Partial | An `anonymous` boolean exists on each spray and is honoured in the ledger and board. The three-way choice and "amount hidden" do not exist. |
| 9 | Shareable celebration summary | Missing | |
| 10 | Who is in the room, live count | Partial | Count is fabricated (`+187`); guest avatars and tables are real UI over mock data |
| 10 | Gift announcements as they land | **Already exists** | MC shout-out queue, threshold-gated, one at a time, with message. Strong. |
| 10 | Live running total | **Already exists** | Ticking total in the money rail, verified accurate |
| 10 | Top givers list | **Already exists** | The Owambe Board, top 10, with Big Spender crown |
| 10 | Host-triggered moments | Partial | `advanceProgramme` exists in the engine but is wired to no control; there is no host role |
| 10 | Readable on a phone at arm's length | **Already exists** | Mobile drawer, no horizontal scroll, verified at 375px |
| 11 | Vendor booking and payment | Missing | |
| 11 | Hold funds until delivery confirmed | Missing | |
| 11 | Vendor public track record | Missing | |
| 11 | Deposits and staged payments | Missing | |
| 11 | Dispute path | Missing | |
| 12 | Aso-ebi fabric offer, orders, payment status | Missing | "Aso-ebi" currently exists only as a colour name and a token |
| 13 | Create / Invite / Prepare / Settle / Remember | Missing | Only "Celebrate" exists, and only as a simulation |

### Part IV — Pan-African

| § | Requirement | Status | Note |
|---|---|---|---|
| 14 | Ceremony type as configuration | Missing | Hardcoded Yoruba wedding. `PROGRAMME` is a module-level constant, the nearest precursor. |
| 15 | Pledges as first-class (pledged/paid/outstanding) | Missing | |
| 15 | Per-country currency, anchor, payout rail | Missing | Single hardcoded USD→NGN pair |
| 15 | All strings externalised, i18n | Missing | Every string is inline in components and `hall.ts` |
| 15 | Group attribution (family, church, association) | Partial | A two-value `side` field (bride/groom) exists and drives the war meter. It is a primitive ancestor of `GiverGroup`, not the thing itself. |

### Part V — Technical

| § | Requirement | Status |
|---|---|---|
| 17 | Gift contract (Soroban) | Missing |
| 17 | Vendor escrow contract | Missing |
| 17 | Event treasury contract | Missing |
| 16 | Service: identity | Missing |
| 16 | Service: payments | Missing |
| 16 | Service: events | Missing |
| 16 | Service: realtime | Missing |
| 16 | Service: archive | Missing |
| 16 | Surface: host console | Missing |
| 16 | Surface: vendor console | Missing |
| 16 | Surface: permanent event page | Missing |
| 18 | Data model (Event, Profile, Gift, Pledge, Vendor, Booking, AsoEbi, GiverGroup) | Missing | Current `Guest`/`Spray`/`ChatMessage` types partially foreshadow `Profile`/`Gift` but lack currency, settlement tx, group, visibility enum |
| 19 | Card / mobile money / bank funding | Missing |
| 19 | Cross-currency via path payments | Missing |
| 19 | Payout speed measured and displayed | Missing |
| 19 | Idempotent, resumable payment operations | Missing |
| 19 | Fees displayed plainly before confirmation | **Already exists** | Correct and prominent. Keep exactly as is. |
| 19 | Refund path | Missing |
| 20 | Velocity and aggregate limits | Missing |
| 20 | Anonymous to guests, never to platform | Partial | Display-only anonymity already matches the rule's spirit, but there is no platform-side record to be non-anonymous *to* |
| 20 | Host verification before payout, hold periods | Missing |
| 20 | Chargeback reserve | Missing |
| 20 | Host can disable rankings | Missing |

### Constraints already satisfied (protect these)

- No crypto denomination is shown to the user anywhere.
- No personal data is on-chain (nothing is on-chain).
- The spray flow is fast and has no interstitials.
- Reduced motion and keyboard paths work throughout.
- The Aso-Ebi Ceremonial design direction is intact and tokenised.

---

## 3. Conflicts and risks to raise

The prompt asks that conflicts be raised rather than silently resolved. These are they.

**1. U1 is not two features. It is a backend, and then two features.**
The permanent wall and the live crowd both require persistence and a realtime
transport, neither of which exists. The prompt frames U1 as four deliverables; in
this codebase the true first deliverable is server infrastructure that is not
mentioned anywhere in the document. This is the single biggest scope finding.

**2. Today's spray speed is not evidence that the 30-second rule is met.**
Spraying is instant right now because nothing happens. Adding real card funding
necessarily adds steps. The acceptance criterion "a guest sprays in under 30 seconds
with no account, measured on a real mid-range Android" cannot be inherited; it has to
be earned, and it will be the hardest single target in U1.

**3. Two open questions the document itself says to resolve first.**
Section 24 states the fee model must be resolved *before U1 ships*, and who owns the
money during the event *before U2*. Both shape the gift contract, which is a U1
deliverable. These are business decisions and are yours, not mine.

**4. New dependencies are unavoidable and the prompt says to ask first.**
U1 cannot be built without, at minimum: a database, a realtime transport, and the
Stellar SDK. A video provider is also needed and the prompt explicitly forbids
building streaming ourselves. Four decisions, all requiring your approval.

**5. The legal wedge is a research task, not a code task.**
Section 3 instructs verification with a Nigerian lawyer before publishing the claim,
and to build regardless. Nothing to implement; flagged so it is not forgotten.

**6. Cultural risk sits above all of it.**
Section 24 names it: whether remote spraying feels hollow is the biggest unknown, and
the document advises testing with one real family before building U2. That test costs
nothing and should be scheduled now, not after U2 is built.

---

## 4. Proposed implementation order

The prompt mandates U1 → U2 → U3 with each live before the next begins. This is the
order *within* U1, which is where the hidden work is.

### U1.0 — Foundation (not named in the prompt, but required by it)

1. **Extract the hardcoded party into data.** Turn `PARTY`, `INITIAL_GUESTS` and
   `PROGRAMME` into an `Event` record. Pure refactor, zero visible change, zero risk.
   Also the first step toward Part IV, since ceremony-as-configuration starts here.
2. **Add persistence.** Database plus the `events` service. Schema follows §18.
3. **Move room state server-side, keeping the throw local-first.** The reducer stays
   as the optimistic layer; the server becomes the source of truth. The throw must
   never await the network.

### U1.1 — Identity
Silent accounts (Tier 0), phone claiming (Tier 1), merge-on-claim. Never blocks a spray.

### U1.2 — Realtime
Replace the `setTimeout` ambient simulation with real presence, gift announcements and
totals. The UI for all three already exists and should not need redesigning.

### U1.3 — Permanent event wall
Depends on U1.0. New surface, inherits the existing token layer.

### U1.4 — Gift contract on Soroban Testnet
Snapshotted fees, visibility flag, group attribution, full test suite.

### U1.5 — Settlement wiring and receipts
Connect the throw to the contract. Idempotent and resumable.

**Rationale:** persistence first because the wall and the crowd both depend on it;
the contract late because it settles what the rest of the system records; the
data-extraction refactor first because it is free, risk-free, and unblocks Part IV
much later.

### Changes that put the spraying flow at risk (called out separately, as required)

| Change | Risk | Mitigation |
|---|---|---|
| U1.0.3 room state to server | Throw could gain network latency | Keep throw local-first and optimistic; settle asynchronously; never await |
| U1.1 identity | Prompts or interstitials creep in before the throw | Silent account only; every prompt strictly after the receipt |
| U1.5 real funding | Card entry genuinely adds steps | First-time card capture only, then one-tap repeat; measure on device |

Nothing in U1.2, U1.3 or U1.4 touches the spray path.

---

## 5. Decisions needed before building

1. **The fee model.** Giver pays, celebrant pays, or neither (margin from vendors and
   aso-ebi instead). §24 says resolve before U1 ships. It shapes the gift contract.
2. **Instant settlement or pooled until the event ends.** §24 says decide before U2,
   but it changes the contract written in U1.4.
3. **Stack approvals** (the prompt requires asking): database, realtime transport,
   Stellar SDK, video provider.
4. **Confirmation of this order**, or your amendments to it.
