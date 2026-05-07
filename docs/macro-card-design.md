# Macro Card Design — wiring ECB SDW into the trigger detector

**Status:** Design note. Not yet implemented.
**Reviewed:** 2026-05-07.

ECB SDW values are currently **displayed** on the Sources surface
(EUR/USD daily reference rate, Euro-area HICP YoY) but are not yet
**evaluated** by the catalyst trigger detector or the calibration
event-study. This note records the architectural decisions that an
implementer needs to make before plumbing the live macro values into
scenario-component triggers.

## Why this isn't shipped yet

Three architectural questions need a deliberate answer first:

1. **Where does the macro series live?** Today's `ConnectedSourcePayload`
   has per-market `cards` (EU / KR / CN) and a flat `liveQuotes` list.
   A macro series like EUR/USD is shared across markets — it doesn't
   belong to any single market card, but the existing trigger detector
   resolves cards by `marketId`. Three options:

   - **A. New "macro" market type.** Adds a fourth market class
     (`"macro"`) with its own card. Pure but ripples into every
     `MarketId` switch in the codebase.
   - **B. Macro card with `marketId="shared"`.** Re-uses the existing
     `shared` channel. The detector currently routes `"shared"` →
     EU card via `getCardForMarket`, so this would need detector
     changes to look up the macro card too.
   - **C. New top-level field on the payload.** Add
     `macroSeries?: MacroPayload` alongside `cards` and `liveQuotes`.
     Detector picks it up explicitly. Most surgical for a first cut.

   **Recommendation: option C.** Surgical, no new market enum, easy to
   roll back.

2. **Which scenarios actually use FX / inflation as a primary trigger?**
   Today only `kr-policy-rate-fx-stack` and `eu-recession-financial-stack`
   reference FX in their component variables. CBAM-USD-strength touches
   USD too. That's three scenarios. The wire should aim at *those
   specifically* — not every scenario.

3. **What's the trigger threshold?** EUR/USD daily moves are usually
   noisy (±0.5%); price-jump threshold of 5% is too strict for FX. A
   parallel `fxJumpPct` config (e.g. 1.5%) is needed, with its own
   evaluator branch in `evaluateComponent`.

## Proposed minimal change set

Once the three decisions land, the implementation is small:

### types.ts
```ts
export type MacroSeriesPoint = { date: string; value: number };

export type MacroPayload = {
  eurUsd?: MacroSeriesPoint[];
  hicpYoY?: MacroSeriesPoint[];
  // extend as more series wire in
};

export type ConnectedSourcePayload = {
  cards: ConnectedSourceCard[];
  liveQuotes?: MarketLiveQuote[];
  macroSeries?: MacroPayload;   // NEW
};
```

### App.tsx — populate on fetch
The existing `freeFeedsFetch` calls already produce
`{ date, value }` arrays. Plumb them into `setConnectedSources` so the
detector can see them, instead of (or in addition to) the local
`ecbEurUsdLatest` / `ecbHicpLatest` state.

### catalystTriggerDetector.ts — new branch
```ts
function classifyComponentSignal(component) {
  // existing logic +
  if (/eur\/usd|eurusd|fx-eur|fx-usd/.test(haystack)) return "fx-jump";
}

function evaluateComponentFx(component, payload, config, now) {
  const series = payload.macroSeries?.eurUsd;
  if (!series || series.length < config.fxJumpWindow + 1) {
    return { /* untestable */ };
  }
  const pct = computePctChangeOverWindow(seriesAsPricePoints(series), config.fxJumpWindow);
  return {
    component,
    signal: "fx-jump",
    triggered: pct !== null && Math.abs(pct) >= config.fxJumpPct,
    observed: pct,
    threshold: config.fxJumpPct,
    note: `${pct?.toFixed(1) ?? "n/a"}% over ${config.fxJumpWindow}d`
  };
}
```

### eventStudy.ts — optional separate track
The event-study layer can opt-in to FX-context-only events later. For
now, scenarios that reference FX still anchor on the per-market price
series; the FX layer is purely about the **live trigger detector**.

## Test surface

Add at minimum:

- Unit tests on `evaluateComponentFx` against synthetic EUR/USD series
  (low-vol, mid-vol, high-vol).
- Update `catalystTriggerDetector` schema test to assert the new signal
  type stays in the documented set.
- A scenario-level test that confirms `kr-policy-rate-fx-stack`
  triggers when EUR/USD or USD/KRW moves >1.5% over a 5-day window.

## What keeps me from shipping it now

- The fx-trigger threshold is itself a calibration choice. Without a
  small set of FX-driven historical events to back-check, picking
  `fxJumpPct = 1.5%` is a guess.
- Adding a new `signal` type changes the public detector contract;
  any UI that filtered on the existing five signals will need to be
  audited.
- The `MacroPayload` shape commits to which series matter for live
  evaluation. Adding more later is cheap; removing is not. The minimal
  set should be EUR/USD + HICP-YoY.

When the three decisions above are confirmed, this work is roughly a
one-day commit. Until then, the EUR/USD and HICP values shipped today
remain *display-only* on the Sources surface — visible context, not
yet a trigger input.
