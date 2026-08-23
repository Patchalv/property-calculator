# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Status

Greenfield. The repo currently contains only [PRD — Cash to Buy Calculator.md](PRD%20—%20Cash%20to%20Buy%20Calculator.md), which is the complete and authoritative spec. It is not a git repo yet and has no build tooling. Read the PRD before writing code — this file summarises only what is load-bearing.

## Stack (specified, not yet scaffolded)

Vite + React + TypeScript + Tailwind, Vitest for tests, static build deployed to GitHub Pages. No backend, no data fetching, no analytics or third-party scripts — **the page renders the household's real savings balance and nothing may leave the browser.**

Once scaffolded, the expected commands are the Vite/Vitest defaults (`npm run dev`, `npm run build`, `npx vitest run`, `npx vitest run -t "<test name>"` for a single test). Update this section with the actual scripts when `package.json` exists.

## Architecture constraints

Three structural rules come from the PRD and should not be relaxed without a reason:

- **The calculation is a pure module with no React imports.** It exports typed functions over `{low, high}` money pairs. Every golden test exercises it directly with nothing rendered.
- **Money is a `{low, high}` pair carried unrounded end to end.** Round only at render. `peakCash` and `allIn` are computed independently for each bound.
- **One `constants.ts` holds every figure**, each with a source comment, plus an exported `AS_OF` date rendered in the UI. Every cost constant is also editable in the UI at runtime — the constants file supplies defaults, not fixed values.

Build the cash-flow timeline first; `peakCash`, `allIn`, and the headline `requirement` are all derived from its running total.

## Domain facts the code depends on

The bank sizes the loan on the **full purchase price**, not on the balance left after the arras deposit. At completion it pays the seller the price less the arras and refunds the difference **to the buyer**. So under a 100% LTV the arras comes back, and "how much cash do we need" has two distinct answers:

- **`peakCash`** — the most out of pocket at one moment (roughly the arras, months before the refund).
- **`allIn`** — what the transaction actually consumes once the refund is counted.

Showing only one of these misleads in a predictable direction. The headline `requirement = max(arras + float, peakCash, allIn)` — at lower prices the arras plus the €2,000 gestoría float binds, not the cost of the transaction, which is why €330,000 answers €35,000 rather than €33,000.

Spanish terms (arras, ITP, IVA+AJD, tasación, gestoría) are defined in the PRD's domain-model table. **Every one needs a plain-English gloss in the UI** — one of the two users has never encountered them.

## Golden tests are the acceptance criteria

The PRD's tables reproduce figures from the source vault; they make the engine verifiable rather than merely plausible. Two things to know before debugging a mismatch:

- `requirement.low` must be **exact**: €35,000 at €330,000 and €41,000 at €390,000. These are `arras + float` and the arithmetic is unambiguous.
- The PRD's published *transaction-cost totals* do not decompose from a single consistent set of component ranges — they disagree by €50–60. **Trust the components; allow ±€150 against the published totals.** Do not "fix" this.

## Editorial line

Rates are `volatility: fast`, verified 2026-08-23. Do not soften the staleness warnings, and do not gate the LTV control on the €390,000 Mi Primera Vivienda cap — the cap lives in an Order that can be superseded the day after publication, and a hard gate would be wrong on that day. The exclusions in the PRD's closing section are decisions with recorded reasons; don't re-litigate them by quietly implementing one.
