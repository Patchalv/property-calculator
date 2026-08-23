---
title: PRD — Cash to Buy Calculator
type: note
created: 2026-08-23
updated: 2026-08-23
as-of: 2026-08-23
volatility: fast
sources:
  - "[[Cash Required to Complete]]"
  - "[[How Arras Work with a High-LTV Mortgage]]"
  - "[[Buying a Resale Flat in Madrid — Costs and Taxes]]"
tags: [madrid, property, costs, app, prd]
---

# PRD — Cash to Buy Calculator

**As of August 2026.** A specification for a frontend-only calculator that makes [[Cash Required to Complete]] interactive.

**This document is written to be handed to a Claude Code session in a different repository, with no access to this vault.** Everything needed to build it is inline. The wikilinks are for navigation here and can be ignored by the builder.

## Why this exists

Every completion date in [[_project]] rests on a monthly surplus of €615 that [[finances]] already records as not reconciling with flat balances. The two live levers — target price and monthly saving — are worth roughly six months and two years respectively. Testing "what if we target €330,000 and save €1,400" currently means someone re-running the arithmetic by hand.

The app does not add knowledge. It makes an existing model runnable by Patrick and Jenny, as often as they like, without a session.

## Users

Two people, jointly deciding. Patrick is a software engineer; Jenny is not. **The interface has to be readable by someone who has never heard of arras or ITP**, which means every Spanish term gets a plain-English gloss on hover or inline.

## What it does

One page. Enter a purchase price and a few settings, get back:

1. **How much cash is needed** — as a range, not a point.
2. **When that cash will exist**, given current savings and two monthly saving rates.
3. **Where every euro goes**, on a timeline from arras to moved-in.

## Scope

**In:** Madrid purchases, resale and new-build · LTV 100/95/90/80 · arras and its refund · purchase taxes and fees · moving and furnishing costs · savings countdown.

**Out, deliberately:** mortgage monthly payments · affordability and DSTI · valor de referencia · saved scenarios · URL state · scenario comparison · regions other than Madrid · appraisal modelling beyond one stress test.

Each exclusion is a decision, not an oversight. Reasons are in the closing section.

---

## Domain model

The builder will not know these terms. They are load-bearing.

| Term | What it means here |
|---|---|
| **Arras** | Deposit paid **to the seller** on signing the deposit contract, months before completion. Counts *a cuenta del precio* — an advance on the price, not an extra cost. Market norm is 10% and **the seller sets it**. |
| **Completion** | Signing the deed at the notary. The mortgage is drawn down and the seller is paid. |
| **ITP** | Transfer tax on **resale** property. Madrid: flat 6%. Usually the largest single line. |
| **IVA + AJD** | New-build pays VAT at 10% **plus** stamp duty instead of ITP. Materially more expensive. |
| **Tasación** | The bank's appraisal. Paid by the buyer even though the bank orders it. |
| **Gestoría** | Admin agency that files the tax and registers the deed. Its *provisión de fondos* falls due days **before** completion. |
| **LTV** | Loan as a percentage of the property. 100% in Madrid exists only via a regional guarantee scheme. |
| **Float** | Cash deliberately held back above the arras, untouchable, so the gestoría can be paid before the refund arrives. |

### The mechanic that makes this app non-trivial

The bank sizes the loan on the **full purchase price**, not on the balance left after arras. At completion it issues two instruments: one to the seller for the price less the arras, and one **to the buyer** for the difference.

So under a true 100% loan **the arras comes back**. That makes "how much cash do we need" two different questions:

- **Peak cash** — the most you are ever out of pocket at one moment. Roughly the arras, months before the refund lands.
- **Net all-in** — what the transaction actually consumes once the refund is counted.

At €390,000 those are about €41,000 and €34,600. **An app that shows only one of them misleads in a predictable direction**, which is why it shows both.

---

## Inputs

| Input | Type | Default | Notes |
|---|---|---|---|
| Purchase price | number, € | 330,000 | The main dial |
| Property type | resale \| new-build | resale | Switches the tax model entirely |
| LTV | 100 \| 95 \| 90 \| 80 | 100 | Free choice; see the banner rule |
| Arras | percent | 10 | Also accepts a flat euro amount |
| Float | number, € | 2,000 | Held back for the gestoría |
| Current savings | number, € | 15,098 | Combined, both of them |
| Patrick — monthly saving | number, € | 615 | |
| Jenny — monthly saving | number, € | 0 | |
| Independent lawyer | toggle | off | Adds €0–2,500 |

Every cost constant below is **editable in the UI**. The defaults are researched; the discretionary ones are guesses that should be argued with.

---

## Calculation

All money is a `{low, high}` pair carried unrounded through the whole calculation. Round only at render.

### Core

```
V  = P                            # appraisal ASSUMED equal to price — see stress test
L  = min(V, P) × ltv
A  = P × arrasPct
owedAtCompletion = P − A
refund = L − owedAtCompletion     # negative means MORE cash due at the notary
```

### Transaction costs

| Line | low | high |
|---|---|---|
| ITP (resale) | 6% × P | 6% × P |
| IVA (new-build) | 10% × P | 10% × P |
| AJD (new-build) | banded, see below | same |
| Notary, escritura de compraventa | 650 | 950 |
| Registro de la Propiedad | 400 | 600 |
| Tasación | 250 | 600 |
| Gestoría (own) | 0 | 450 |
| Notas simples, extra copies | 15 | 60 |
| Home insurance, first year | 200 | 400 |
| Independent lawyer (if on) | 0 | 2,500 |

**AJD bands** — 0.4% up to €120,000, 0.5% up to €180,000, **0.75% above €180,000**. Only the top band matters at these prices, but implement all three.

**Notary and registry use realistic-invoice figures, not the statutory floor.** The computed arancel at €390,000 is €521 notary and €280 registry; real invoices legitimately run higher, covering copias autorizadas y simples and folios. Record both numbers in the constants file with this reason.

### Moving costs

Itemised, all editable:

| Line | low | high |
|---|---|---|
| Removals incl. montamuebles | 450 | 1,050 |
| Utility altas | 100 | 200 |
| Appliances and furniture gaps | 5,000 | 8,000 |
| Paint and floors | 3,000 | 6,000 |
| One month rent overlap | 1,030 | 1,030 |
| Locks, padrón, misc | 150 | 300 |
| **Total** | **9,730** | **16,580** |

### The three outputs

Build the cash-flow timeline first, then derive everything from it. `cumulative` is cash out of pocket, so positive means spent.

```
timeline = [
  { label: "Sign arras",        delta: +A },
  { label: "Tasación",          delta: +tasacion },
  { label: "Completion",        delta: −refund + taxes + fees + insurance },
  ...movingItems.map(i => ({ label: i.label, delta: +i.amount })),
]

peakCash = max(runningTotal(timeline))
allIn    = last(runningTotal(timeline))
requirement = max(A + float, peakCash, allIn)
```

**`requirement` is the headline number.** It encodes the rule the research arrived at: the arras must sit in the account on the day even though it returns at completion, and the float must sit on top of it untouched. At the low end **the arras binds, not the cost of the transaction** — which is why the answer at €330,000 is €35,000 and not €33,000.

Compute `peakCash` and `allIn` independently for the low and high bounds.

### Savings countdown

```
monthly = patrickMonthly + jennyMonthly
monthsTo(target) = monthly <= 0 ? Infinity : ceil(max(0, target − currentSavings) / monthly)
```

Run it against `requirement` and against `allIn`, at both bounds, from today. Render two labelled date ranges:

- **"Enough to complete the purchase"** — from `requirement`.
- **"Enough for everything, including moving in"** — from `allIn`.

Handle `monthly <= 0` as "never at this rate", not as a crash or a blank.

### Appraisal stress test

One button. Recompute with `V = 0.9 × P`, show the deltas on refund and requirement, and let the user toggle back. Do not make it the default state.

---

## What the screen shows

Single page, two columns on desktop, stacked on mobile.

**Left — inputs.** Price, property type, LTV, arras, savings. Cost constants live in collapsed sections so the default view stays short.

**Right — results, in this order:**

1. **Headline** — `requirement` as a range, with a one-line explanation of what it is.
2. **Two dates** from the savings countdown.
3. **Peak vs net** — the two numbers side by side, with a sentence naming the difference and why it exists.
4. **Timeline table** — every row from the cash-flow timeline with a running balance. This is the part that teaches the model.
5. **Cost breakdown** — transaction and moving, itemised, editable inline.
6. **Banners**, described below.

### Banners

**Appraisal assumption — always visible.**
> Assumes the flat appraises at or above the purchase price. If it appraises low, the loan shrinks and the refund shrinks with it. Tinsa appraisals run 14–15% under Idealista asking prices in Carabanchel and Latina.

Next to it, the stress-test button.

**Scheme validity — conditional.** When LTV is 100:
> 100% financing in Madrid exists only through the Mi Primera Vivienda regional guarantee, which is capped at €390,000 under Orden 2350/2022 as amended, in force at 23 August 2026. The scheme permits 100% financing; it does not oblige any bank to grant it.

And additionally when price exceeds €390,000:
> Above the €390,000 cap. A 2026 draft Order reports €425,000 with financing tiered 100/95/90 by age band, but it is not law and its price cap has never been confirmed against a primary text.

**Do not disable the LTV control.** The cap belongs to an Order that can be superseded the day after publication in the BOCM, and a hard gate would be wrong on that day.

**Ley 5/2019 — static panel.** A short list headed "you should not be charged for these":
> Gestoría on the mortgage · notary for the mortgage deed · registry inscription of the mortgage · AJD on the mortgage. All are the lender's cost since Ley 5/2019. Banks routinely instruct a gestoría that then invoices the buyer for the whole bundle. Demand an itemised breakdown.

This is four lines of static copy and it is one of the highest-value things on the page.

---

## Golden tests

**These are the acceptance criteria.** They reproduce figures published in this vault, so the calculation engine is verifiable rather than merely plausible. Test the calculation module directly, with no React involved.

Fixed settings: 100% LTV, 10% arras, €2,000 float, appraisal = price, lawyer off, resale.

| Price | `allIn` | `requirement` |
|---|---|---|
| €330,000 | 31,045 – 39,440 | **35,000 – 39,440** |
| €390,000 | 34,645 – 43,040 | **41,000 – 43,040** |

Assert `requirement.low` **exactly**: €35,000 and €41,000. Those are `arras + float` and the arithmetic is unambiguous.

**Refund collapse at €390,000**, 10% arras:

| LTV | Loan | Returned |
|---|---|---|
| 100% | 390,000 | **+39,000** |
| 95% | 370,500 | +19,500 |
| 90% | 351,000 | **0** |
| 80% | 312,000 | **−39,000** |

**Stress test at €390,000, 100% LTV.** With `V = 0.9 × P` the loan falls to €351,000, the refund goes to zero, and `requirement` jumps to roughly **73,645 – 82,040**. That is a useful sanity check: it lands on the €73,700–82,000 figure this project first estimated before the refund mechanic was understood.

**New-build at €390,000** must cost about €18,500 more in tax than resale: IVA €39,000 + AJD €2,925 = €41,925, against ITP €23,400.

### A discrepancy the builder should not try to fix

[[Cash Required to Complete]] gives transaction costs of €24,965–26,460 at €390,000 and €21,315–22,800 at €330,000. **Those two do not decompose from an identical set of component ranges** — they disagree with each other by €50 at the low end and €60 at the high end.

The component ranges in this document reproduce €330,000 exactly at the low bound and €390,000 exactly at the high bound, and are internally consistent. **Trust the components, not the note's totals**, and allow ±€150 tolerance when comparing against published totals. This is a rounding artefact in a hand-written note, not a modelling error, and the note should not be edited to match.

---

## Build

- **Vite + React + TypeScript + Tailwind.** Static build, no backend, no data fetching.
- **GitHub Pages**, deployed from the repo. Zero cost.
- **The calculation lives in a pure module** with no React imports, exporting typed functions over `{low, high}` money pairs. Everything above must be testable without rendering anything.
- **Vitest** for the golden tests.
- No analytics, no telemetry, no third-party scripts. **This page displays the household's savings balance**; nothing about it should leave the browser.

### Staleness is a first-class concern

Every rate here is `volatility: fast` and was verified on 2026-08-23. Rates move; the Mi Primera Vivienda reform could publish any week.

- **One `constants.ts`**, holding every figure, each with a source comment naming where it came from.
- **An exported `AS_OF` date**, rendered visibly in the UI as "Figures as of August 2026".
- **A README section** stating that ITP rates, cost ranges and the Mi Primera Vivienda caps must be re-checked before the output is trusted, and naming this vault as where that check happens.

An app that silently serves 2026 tax rates in 2029 is worse than no app.

---

## Why things are out of scope

Recorded so the next person does not re-litigate them.

**Valor de referencia.** ITP is legally charged on the *higher* of price paid and the Catastro's reference value. Excluded because it is unknowable until you have a specific property's referencia catastral, and the app is for exploring prices rather than pricing a specific flat. **Consequence: the app understates ITP on any property where the Catastro data is stale or mis-zoned.**

**Mortgage servicing.** No monthly payment, no DSTI check against the 35% ceiling. The question is whether the cash can be reached, not whether the loan can be serviced.

**Appraisal modelling.** Reduced to one warning and one stress test, by explicit decision. **This is the app's weakest assumption** — see below.

**Persistence, sharing and comparison.** Ephemeral by choice. Refresh resets to defaults.

## Assumptions

- **Comunidad de Madrid**, 2026 regional rules. Nothing here carries to another region.
- **The buyers are Spanish tax residents**, married, no children, buying jointly as first-time buyers.
- **The purchase is mortgaged**, so Ley 5/2019 applies and the tasación is a buyer cost.
- **The seller is Spanish-resident.** If not, the plusvalía municipal liability shifts to the buyer, which the app does not model.
- **The valor de referencia does not exceed the price.** Not a safe default; check per property.
- **The appraisal holds at or above the purchase price.** Least safe assumption in the model, taken deliberately.
- **A true 100% loan disburses the surplus over the outstanding balance to the buyer at completion.** Supported by two commercial comparison sites; **no participating lender has confirmed it**, and the whole refund model rests on it.
- **No comisión de apertura.** Would be deducted at drawdown and reduce funds available.
- Furnishing is **part-furnished**, condition needs **light work only**, and there is **one month of rent overlap**.

## Sources

- [[Cash Required to Complete]] — the model this app encodes, and the origin of the moving-cost lines, the €2,000 float and the `max(arras + float, …)` rule. Claude-derived project arithmetic, not ground truth.
- [[How Arras Work with a High-LTV Mortgage]] — the refund formula and the LTV sensitivity. Its two underlying sources are **commercial mortgage comparison sites**, and the sensitivity tables are derived arithmetic rather than reported fact.
- [[Buying a Resale Flat in Madrid — Costs and Taxes]] — every tax rate and fee range. Verified against BOE consolidated texts on 2026-08-23; the strongest-sourced input here.
- [[Mi Primera Vivienda (Madrid Scheme)]] and [[Mi Primera Vivienda — 2026 Reform Status]] — the banner copy, the €390,000 cap and the status of the draft Order.
- [[Southwest Madrid Property Market]] — the 14–15% Tinsa-versus-asking gap quoted in the appraisal warning.
