# Open-Source Benchmark Map

Last reviewed: 2026-04-11

## Boundary First

C-Quant remains a desktop carbon intelligence terminal.

- It can ingest, normalize, rank, compare, explain, and brief.
- It can show project evidence, registry freshness, market structure, factor pressure, and scenario views.
- It does not execute trades.
- It does not issue tokens.
- It does not intermediate settlement, custody, or retirement transactions.

The benchmark rule is simple:

- Borrow observability, provenance, risk, optimization, and research patterns.
- Do not borrow brokerage, token issuance, AMM, DEX, or direct transaction flows.

## Repo-by-Repo Adaptation

### 1. hyperledger-labs/blockchain-carbon-accounting

Source: [GitHub](https://github.com/hyperledger-labs/blockchain-carbon-accounting)

Verified from the README:

- Uses blockchain or distributed ledger patterns for climate accounting.
- Stores energy, renewable production, and carbon project data in a permissioned ledger.
- Includes tokenization concepts for emissions audits, carbon credits, and energy attribute certificates.
- Includes DAO-style project validation concepts.
- Includes applications such as a React UI and supply-chain emissions calculations.

Adapt into C-Quant:

- Credit provenance view
- Verification-state tracker
- Project evidence trail
- Supply-chain style emissions drilldown for enterprise users

Do not copy:

- Token issuance
- DAO governance
- On-chain settlement
- Any workflow that turns C-Quant into a transaction rail

LLM use:

- Explain which verification step is missing
- Summarize provenance gaps
- Translate evidence conflicts into a plain-language risk note

### 2. CarbonScribe/carbon-scribe

Source: [GitHub](https://github.com/CarbonScribe/carbon-scribe)

Verified from the README:

- Credits are issued as Stellar assets.
- Buyers can retire them with transparent on-chain proof.
- The product is framed as an end-to-end platform for issuance and retirement.

Adapt into C-Quant:

- Lifecycle timeline for issuance, transfer history, and retirement proof
- Read-only evidence panel for retirement status
- Registry-to-market dossier for institutional review

Do not copy:

- Purchase flow
- Retirement execution flow
- Wallet or transaction handling

Note:

- I did not verify the claimed pricing AI from the repo materials reviewed, so that should not be represented as a benchmarked capability yet.

LLM use:

- Summarize whether lifecycle evidence is complete
- Point out stale or missing retirement proof

### 3. CarbonCreditProject/Carbon-Project

Source: [GitHub](https://github.com/CarbonCreditProject/Carbon-Project)

Verified from the README:

- ERC-20 mint and burn logic
- Validator roles
- NFT certificate after retirement
- AMM pool for trading carbon tokens

Adapt into C-Quant:

- Token lifecycle state model reinterpreted as a market-structure monitor
- Liquidity-state concepts reinterpreted as market-confidence and venue-health signals
- Retirement certificate concept reinterpreted as read-only evidence status

Do not copy:

- AMM
- DEX
- ERC-20 issuance
- NFT issuance
- Buy and burn execution

LLM use:

- Explain why liquidity or retirement bottlenecks matter for confidence
- Surface lifecycle events that justify a change in posture

### 4. SaveChris/Inf-Imb-for-EUA23

Source: [GitHub](https://github.com/SaveChris/Inf-Imb-for-EUA23)

Verified from the README:

- Information Imbalance based study of EUA price determinants
- Weekly time scale identified as highly informative
- Phase-aware variable importance
- Gaussian Process nowcasting and forecasting

Adapt into C-Quant:

- Phase-aware driver ranking
- Variable-selection monitor
- Research validation panel that shows why a factor set changed
- Weekly aggregation diagnostics in the Lab

Do not copy:

- Academic forecasts as if they were live executable price targets

LLM use:

- Convert ranked factors into readable decision logic
- Generate the contrary case and missing-data checklist

### 5. yc-wang00/verra-scaper

Source: [GitHub](https://github.com/yc-wang00/verra-scaper)

Verified from the README:

- Extracts summary data, metadata, and PDF document links from the Verra VCS registry

Adapt into C-Quant:

- Registry ingestion pipeline
- Project dossier builder
- Document freshness monitor
- Downloadable evidence bundle for analyst review

Do not copy:

- Any implication that scraped records are endorsed or underwritten by C-Quant

LLM use:

- Summarize project documents
- Flag missing attachments or stale disclosures

### 6. carbonplan/forest-risks

Source: [GitHub](https://github.com/carbonplan/forest-risks)

Verified from the README:

- Maps forest carbon potential and risks
- Includes biomass, fire, drought, and insect-related layers
- Provides model fitting, loading, and plotting utilities

Adapt into C-Quant:

- Nature-based credit risk overlay
- Integrity warning layer for forestry and land-use credits
- Premium project-risk view for institutional users

Do not copy:

- Over-generalize its U.S.-focused layers to all geographies

LLM use:

- Convert hazard layers into a concise project risk memo
- Explain when integrity risk should override cheap price

### 7. hgribeirogeo/qaoa-carbon-cerrado

Source: [GitHub](https://github.com/hgribeirogeo/qaoa-carbon-cerrado)

Verified from the README:

- Multi-objective optimization over carbon, biodiversity, and social impact
- QAOA plus zero-noise extrapolation workflow
- A concrete portfolio-selection framing

Adapt into C-Quant:

- Portfolio sleeve optimizer for carbon exposure
- Weighting across liquidity, basis risk, integrity, concentration, and policy fit
- Efficient frontier style comparison for decision support

Do not copy:

- Quantum hardware as a product dependency
- Quantum branding as a substitute for a practical optimizer

LLM use:

- Explain how weight changes move the frontier
- Summarize the trade-off behind each recommended sleeve

### 8. JGCRI/gcam-core

Source: [GitHub](https://github.com/JGCRI/gcam-core)

Verified from the README:

- Multisector model spanning economy, energy, land, water, trade, and climate interactions
- Long-horizon scenario framework
- Designed for decision-relevant questions, not only short-term market moves

Adapt into C-Quant:

- Macro scenario layer
- Long-horizon policy stress view
- Market narrative mapping between energy, land, and carbon exposure

Do not copy:

- Present long-horizon scenario output as a short-term trade signal

LLM use:

- Turn scenario shifts into nearer-term watchpoints
- Explain how long-cycle policy or energy changes should alter the monitoring checklist

## Specialized LLM Design

The LLM should be a carbon-market copilot, not a generic chatbot.

### Inputs

- Official market board snapshots
- Linked futures and proxy tapes
- Factor scores and regime labels
- Registry documents and freshness status
- Project integrity overlays
- Catalyst calendar
- Portfolio sleeve constraints

### Outputs

- Plain-language posture note
- Detailed support case
- Detailed contrary case
- Missing-data warning
- Next checks by role: compliance, trading, risk
- Scenario summary for the selected market or credit sleeve

### Guardrails

- No order execution
- No custody
- No portfolio discretion
- No fabricated prices, policies, or registry facts
- No individualized trade instruction phrased as execution advice

## Immediate Build Implications

1. Add a read-only credit lifecycle dossier view.
2. Add registry-document ingestion and freshness tracking.
3. Add project integrity overlays for nature-based credits.
4. Add a practical carbon sleeve optimizer before any advanced quantum framing.
5. Expand the LLM from optional commentary into a grounded carbon-market copilot tied to official facts and evidence packs.
