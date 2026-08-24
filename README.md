# Cash to Buy Calculator

A one-page calculator for how much cash two people need to buy a flat in Madrid,
when they will have it, and where every euro goes between signing the deposit
and moving in.

Frontend only. No backend, no data fetching, no analytics, no third-party
scripts — including no webfont CDN. **The page displays a household savings
balance and nothing about it leaves the browser.** Nothing is persisted either:
a refresh returns every figure to its researched default.

```bash
npm install && npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run preview` | Serve the built output |
| `npm test` | Run the golden tests once |
| `npm run test:watch` | Vitest in watch mode |
| `npx vitest run -t "<name>"` | Run one test by name |

## ⚠️ Re-check the figures before trusting the output

**Every rate in this app was verified on 2026-08-23 and all of them move.** They
live in [`src/calc/constants.ts`](src/calc/constants.ts), each with a source
comment, alongside an exported `AS_OF` that the page renders as "Figures as of
August 2026".

Re-check before the output is relied on:

- **ITP** — Madrid's 6% transfer rate on resale, and the IVA/AJD treatment of
  new-build.
- **The cost ranges** — notary, registry, tasación, gestoría, insurance and the
  moving lines.
- **Mi Primera Vivienda** — the €390,000 cap sits in Orden 2350/2022 as amended.
  A 2026 draft Order reporting €425,000 is not law and its cap has never been
  confirmed against a primary text. The Order can be superseded the day after
  publication in the BOCM.

That check happens in the source vault, against the notes listed at the bottom
of the PRD — not in this repo. An app that silently serves 2026 tax rates in
2029 is worse than no app.

## How the calculation works

The bank sizes the loan on the **full purchase price**, not on the balance left
after the deposit. At completion it pays the seller the price less the deposit
and refunds the difference **to the buyer**. Under a true 100% loan the deposit
comes back, so "how much cash do we need" has two different answers:

- **`peakCash`** — the most you are ever out of pocket at one moment, roughly
  the deposit, held for months before the refund lands.
- **`allIn`** — what the transaction actually consumes once the refund counts.

Showing only one of them misleads in a predictable direction, so the page shows
both. The headline is `requirement = max(arras + float, peakCash, allIn)`: the
deposit has to be sitting in the account on the day even though it returns, with
the float untouched on top. At lower prices **that rule binds, not the cost of
the transaction** — which is why €330,000 answers €35,000 and not €33,000.

Everything is derived from the cash-flow timeline in
[`src/calc/timeline.ts`](src/calc/timeline.ts). Build that first if you are
changing anything.

## Structure

- **`src/calc/` is pure.** No React imports anywhere in it, and `today` is
  passed into `calculate` rather than read from the clock, so every result is
  reproducible in a test.
- **Money is a `{low, high}` pair carried unrounded end to end.** The bounds are
  computed independently; rounding happens only in `src/format.ts`, at render.
- **`src/calc/constants.ts` holds every figure**, and supplies defaults rather
  than fixed values — every cost line is editable in the UI at runtime.

## The golden tests are the acceptance criteria

`src/calc/golden.test.ts` reproduces figures published in the source vault, so
the engine is verifiable rather than merely plausible. `requirement.low` is
asserted **exactly**: €35,000 at €330,000 and €41,000 at €390,000.

One thing not to "fix": the vault's published *transaction-cost totals* do not
decompose from a single consistent set of component ranges — they disagree with
each other by €50 at the low end and €60 at the high end. **The components are
right; the totals are a rounding artefact in a hand-written note.** The tests
assert both the components exactly and the totals within ±€150, and the
discrepancy is asserted deliberately rather than papered over.

## Two deliberate departures from the PRD

- **Gestoría has its own pre-completion timeline row** rather than being lumped
  into completion. The float exists *because* the provisión de fondos falls due
  days before completion, and a lumped timeline could not show that. Verified
  numerically inert against every golden figure.
- **The independent lawyer costs €1,000–€2,500, not €0–€2,500.** With a zero
  floor, `requirement.low` was identical whether or not a lawyer had been
  engaged, which made the exact figure the PRD demands quietly wrong. No golden
  test touches it — the lawyer is off in all of them.

## Not modelled, on purpose

Mortgage monthly payments and DSTI · valor de referencia · saved scenarios · URL
state · scenario comparison · regions other than Madrid · appraisal modelling
beyond the one stress test.

Each is a recorded decision, not an oversight; the reasons are in the PRD's
closing section. The consequence worth knowing: ITP is legally charged on the
*higher* of price paid and the Catastro's reference value, so **the app
understates ITP wherever that reference value exceeds the price.**

## Deploying

The build is static and `base` is relative, so `dist/` works from any path
without configuration. A GitHub Pages workflow is included but does nothing
until the repo has a remote and Pages is enabled.

### Before making this repo public

The savings and monthly-saving fields deliberately default to **zero** rather
than to real figures, and neither the source nor the tests carry them.

Checking the working tree is not enough — `git grep` only sees the current
checkout. An early commit in this repo did carry the real figures in a test
fixture and a comment; that history was rewritten before any remote existed.
Check history, not just the tip:

```bash
git log -p -S'<the balance>' -- src   # must return nothing
```

**The PRD file is the exception.** `PRD — Cash to Buy Calculator.md` is tracked
here and states the real savings balance and both saving rates in its inputs
table. Remove it, add it to `.gitignore`, or redact those three figures before
publishing — otherwise zeroing the defaults achieves nothing.
