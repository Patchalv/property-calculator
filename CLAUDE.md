# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Built and passing. [PRD — Cash to Buy Calculator.md](PRD%20—%20Cash%20to%20Buy%20Calculator.md) remains the authoritative spec; read it before changing behaviour. This file summarises only what is load-bearing.

Public on GitHub at `Patchalv/property-calculator`, deployed via GitHub Pages at https://patchalv.github.io/property-calculator/. Since the repo is public, the privacy note below is not theoretical — anything committed here is live.

## Stack

Vite + React + TypeScript + Tailwind v4, Vitest, static build for GitHub Pages. No backend, no data fetching, no analytics or third-party scripts — **and no webfont CDN either: fonts are self-hosted via Fontsource, because a Google Fonts request would leak the visitor's IP from a page that renders a savings balance.**

```
npm run dev          # dev server
npm run build        # tsc --noEmit, then vite build
npm test             # vitest run — the golden tests
npm run test:watch   # vitest
npx vitest run -t "<test name>"
```

## Personal data must stay out of this repo

The PRD's input defaults are the household's real savings balance and saving rates. **`DEFAULT_INPUTS.currentSavings` ships as zero** — the repo is intended to be public so Pages is free, and committing it would publish the household's balance permanently into git history, contradicting the PRD's own rule that nothing about the balance leaves the browser. Do not "restore the PRD default" for it, do not quote the figure in a comment, and do not use it as a test fixture.

**`patrickMonthly` and `jennyMonthly` are a deliberate exception**, committed as real figures by explicit household decision — unlike the balance, a monthly saving rate was judged not sensitive enough to justify the friction of re-typing it every session. Don't extend this reasoning to `currentSavings` on your own initiative. Existing tests that need a *specific* monthly rate (e.g. exact month-count arithmetic) pin the other partner's rate to `0` explicitly rather than relying on whatever the current default happens to be — see `engine.test.ts`'s savings-countdown tests.

**The PRD file itself still contains them.** It is tracked in this repo, so it must be removed, gitignored, or redacted before the repo is made public — otherwise zeroing the defaults achieves nothing.

## Architecture constraints

Three structural rules come from the PRD and should not be relaxed without a reason:

- **The calculation is a pure module with no React imports.** It exports typed functions over `{low, high}` money pairs. Every golden test exercises it directly with nothing rendered.
- **Money is a `{low, high}` pair carried unrounded end to end.** Round only at render. `peakCash` and `allIn` are computed independently for each bound.
- **One `constants.ts` holds every figure**, each with a source comment, plus an exported `AS_OF` date rendered in the UI. Every cost constant is also editable in the UI at runtime — the constants file supplies defaults, not fixed values.

Build the cash-flow timeline first; `peakCash`, `allIn`, and the headline `requirement` are all derived from its running total. `calculate(inputs, costs, today)` takes `today` as an argument — the engine never reads the clock, so results stay reproducible.

Three things the PRD leaves implicit that the golden tests pin down. Any other reading breaks them: **tasación is its own timeline row and is excluded from the completion lump**, **home insurance sits inside the completion lump**, and **moving costs are the final rows**. AJD's "bands" threshold-select a flat rate; they do not slice marginally.

Three deliberate departures from the PRD:

- **Gestoría has its own pre-completion timeline row.** The float exists because the provisión de fondos falls due days before completion, and the PRD's lumped timeline could not show that. Numerically inert against every golden figure.
- **The independent lawyer costs €1,000–€2,500, not €0–€2,500.** A zero floor left `requirement.low` identical whether or not a lawyer was engaged. No golden test touches it.
- **Appliances and furniture, and paint and floors, are point estimates (`low === high`), not ranges — edited from the sidebar, not the "Argue with these" table.** The household wanted to enter what they actually expect to spend on these two rather than argue with a researched range. Unlike the two departures above, **this one is numerically load-bearing**: it moves `movingCosts`, `allIn`, and `requirement` at both golden prices, and collapses `requirement` to a single exact figure at both price points instead of a low–high range (see below).

Anything whose wording depends on the refund's sign must track it. Below 90% LTV the refund is zero or negative, and copy that still says the deposit comes back — the completion row label, the waterfall's colour and caption, the peak-vs-net cards — misleads in exactly the direction this app exists to prevent.

## Domain facts the code depends on

The bank sizes the loan on the **full purchase price**, not on the balance left after the arras deposit. At completion it pays the seller the price less the arras and refunds the difference **to the buyer**. So under a 100% LTV the arras comes back, and "how much cash do we need" has two distinct answers:

- **`peakCash`** — the most out of pocket at one moment (roughly the arras, months before the refund).
- **`allIn`** — what the transaction actually consumes once the refund is counted.

Showing only one of these misleads in a predictable direction. The headline `requirement = max(arras + float, peakCash, allIn)` — at lower prices the arras plus the €2,000 gestoría float binds, not the cost of the transaction, which is why €330,000 answers €35,000 rather than €33,000.

Spanish terms (arras, ITP, IVA+AJD, tasación, gestoría) are defined in the PRD's domain-model table. **Every one needs a plain-English gloss in the UI** — one of the two users has never encountered them. Glosses live in `src/ui/glossary.ts` and render through the tappable `Gloss` component, not a hover tooltip: hover does not exist on the phone layout. **The headline and the three warning banners are exempt** — they are written in plain English with no gated terms, because a warning that needs a tap to parse is a warning that does not land.

**The under-40 rate is announced, not law.** On 5 October 2026 the Comunidad de Madrid announced ITP at 4% (from 6%) on a resale home up to €450,000 and AJD at 0.4% (from 0.75%) on new build, for buyers under 40, in the 2027 budget law. `under40Rate` applies it, and is on by default because the household qualifies and buys after the likely start date. The golden fixture and `engine.test.ts` pin it off, so they keep describing today's law; `under40.test.ts` covers the cut. The €450,000 cap is modelled as a cliff because the rule is not yet published. When the law passes, or the bill changes the numbers, update `ITP_RATE_UNDER_40` and its neighbours and the banner copy.

## Golden tests are the acceptance criteria

The PRD's tables reproduce figures from the source vault; they make the engine verifiable rather than merely plausible. Two things to know before debugging a mismatch:

- `requirement.low` must be **exact**: €35,000 at €330,000 and €41,000 at €390,000. These are `arras + float` and the arithmetic is unambiguous. Under the golden fixture (lawyer off — see `goldenInputs` in `golden.test.ts`) `requirement.high` lands on the same two figures too: the arras+float floor binds on both bounds, because collapsing appliances/decorating to points removed what used to push the high bound above it. That collapse is a consequence of the fixture's moving-cost defaults, not a general invariant — it does **not** hold at `DEFAULT_INPUTS`, where the lawyer is on by default and its own €1,000–2,500 range reopens a gap above the floor. The golden fixture pins `independentLawyer: false` explicitly for exactly this reason: so this table stays stable independent of whatever the app's own default is.
- The PRD's published *transaction-cost totals* do not decompose from a single consistent set of component ranges — they disagree by €50–60. **Trust the components; allow ±€150 against the published totals.** Do not "fix" this.

## Editorial line

The design register is "the notebook and the paperwork": the body is a warm household notebook, and the warnings are the official paperwork interrupting it. `--color-stamp` is the only cold colour in the palette and appears **only** in warning slabs — that single rule is what makes the tonal break work. Do not use it elsewhere, and do not soften the slabs into the warm register.

Rates are `volatility: fast`, verified 2026-08-23. Do not soften the staleness warnings, and do not gate the LTV control on the €390,000 Mi Primera Vivienda cap — the cap lives in an Order that can be superseded the day after publication, and a hard gate would be wrong on that day. The exclusions in the PRD's closing section are decisions with recorded reasons; don't re-litigate them by quietly implementing one.
