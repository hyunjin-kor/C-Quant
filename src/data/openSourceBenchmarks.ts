import type { OpenSourceBenchmark } from "../types";

const accessed = "2026-04-11";

export const openSourceBenchmarks: OpenSourceBenchmark[] = [
  {
    id: "hyperledger-carbon-accounting",
    name: "hyperledger-labs/blockchain-carbon-accounting",
    category: "Registry and audit ledger",
    verifiedCapability:
      "Verified from the repo README: a permissioned ledger model for climate accounting, tokenized instruments, auditable verification workflows, and supply-chain style emissions accounting.",
    adaptForCQuant:
      "Use the provenance and verification-state ideas for a read-only registry dossier, evidence trail, and credit lifecycle monitor inside the desk.",
    boundaryNote:
      "Do not ship token issuance, DAO voting, or settlement rails inside C-Quant. Keep it as observability and evidence software.",
    llmUse:
      "Let the copilot explain missing verification steps, inconsistent project evidence, and unresolved provenance gaps.",
    source: {
      label: "GitHub README",
      url: "https://github.com/hyperledger-labs/blockchain-carbon-accounting",
      accessed
    }
  },
  {
    id: "os-climate",
    name: "OS-Climate",
    category: "Climate data commons",
    verifiedCapability:
      "Verified from the official project site and community hub: an open-source initiative building climate data, extraction, and analytics infrastructure for financial decision-making.",
    adaptForCQuant:
      "Borrow the modular data-commons pattern for source normalization, document extraction, and climate-data interoperability across accounting, verification, and market views.",
    boundaryNote:
      "Do not try to replicate the full OS-Climate stack inside C-Quant. Use it as the architectural benchmark for ingestion and normalization boundaries.",
    llmUse:
      "Let the copilot explain where a read comes from, which dataset family backs it, and what still requires manual verification.",
    source: {
      label: "OS-Climate",
      url: "https://os-climate.org/",
      accessed
    }
  },
  {
    id: "openghg",
    name: "OpenGHG",
    category: "Open emissions data foundation",
    verifiedCapability:
      "Verified from the official site: a local-first open platform for standardizing, storing, retrieving, and plotting greenhouse-gas datasets with a flexible data store.",
    adaptForCQuant:
      "Borrow the standardization and store pattern for emissions evidence, factor provenance, and reproducible data retrieval across accounting and verification modules.",
    boundaryNote:
      "Do not turn C-Quant into a scientific atmospheric data workbench. Keep the pattern focused on provenance, retrieval, and reproducibility.",
    llmUse:
      "Use the copilot to summarize which datasets are standardized, which remain raw, and where provenance breaks the confidence chain.",
    source: {
      label: "OpenGHG",
      url: "https://openghg.org/",
      accessed
    }
  },
  {
    id: "carbon-scribe",
    name: "CarbonScribe/carbon-scribe",
    category: "Credit lifecycle platform",
    verifiedCapability:
      "Verified from the repo README: an end-to-end platform where carbon credits are issued as Stellar assets and can be retired with transparent on-chain proof.",
    adaptForCQuant:
      "Borrow the lifecycle view: issuance, transfer history, and retirement-proof timeline, then present that evidence as a market intelligence workflow.",
    boundaryNote:
      "Do not copy purchase or retirement execution flows. I did not verify the claimed pricing AI from the repo materials reviewed, so that feature should not be assumed.",
    llmUse:
      "Use the copilot to summarize lifecycle evidence and explain whether a credit looks operationally clean or documentation-light.",
    source: {
      label: "GitHub README",
      url: "https://github.com/CarbonScribe/carbon-scribe",
      accessed
    }
  },
  {
    id: "carbon-project",
    name: "CarbonCreditProject/Carbon-Project",
    category: "Token market structure",
    verifiedCapability:
      "Verified from the repo README: an Ethereum carbon ecosystem with ERC-20 mint and burn logic, validator roles, NFT retirement certificates, and an AMM pool for trading.",
    adaptForCQuant:
      "Borrow the state-machine thinking: issuance, validation, liquidity, retirement, and certificate status. Reframe it as a market-structure monitor rather than a venue.",
    boundaryNote:
      "Do not implement the AMM, DEX, ERC-20 issuance, NFT issuance, or any trade execution workflow inside C-Quant.",
    llmUse:
      "Use the copilot to explain liquidity-state risk, retirement bottlenecks, and how token lifecycle events may affect market confidence.",
    source: {
      label: "GitHub README",
      url: "https://github.com/CarbonCreditProject/Carbon-Project",
      accessed
    }
  },
  {
    id: "inf-imb-eua23",
    name: "SaveChris/Inf-Imb-for-EUA23",
    category: "Price determinant research",
    verifiedCapability:
      "Verified from the repo README: a non-parametric Information Imbalance study of EUA price determinants, weekly time-scale selection, and Gaussian Process nowcasting and forecasting.",
    adaptForCQuant:
      "Use it as the template for phase-aware factor ranking, informative-variable selection, and model views that show why a signal changed across market regimes.",
    boundaryNote:
      "Do not present the repo's research output as a live calibrated target. Keep it as a factor-selection and research-validation benchmark.",
    llmUse:
      "Use the copilot to translate factor rankings into plain-language reasoning, counterarguments, and monitoring priorities.",
    source: {
      label: "GitHub README",
      url: "https://github.com/SaveChris/Inf-Imb-for-EUA23",
      accessed
    }
  },
  {
    id: "verra-scaper",
    name: "yc-wang00/verra-scaper",
    category: "Registry ingestion pipeline",
    verifiedCapability:
      "Verified from the repo README: a scraper for the Verra registry that extracts summary data, metadata, and PDF document links.",
    adaptForCQuant:
      "Use the same pattern for project dossiers, source freshness checks, and downloadable evidence packs tied to registry records.",
    boundaryNote:
      "Keep registry scraping bounded to document retrieval and metadata normalization. Do not imply project endorsement or token issuance.",
    llmUse:
      "Use the copilot to summarize project documents, flag stale evidence, and highlight missing disclosures before a user leans on a credit.",
    source: {
      label: "GitHub README",
      url: "https://github.com/yc-wang00/verra-scaper",
      accessed
    }
  },
  {
    id: "forest-risks",
    name: "carbonplan/forest-risks",
    category: "Nature-credit risk model",
    verifiedCapability:
      "Verified from the repo README: libraries and scripts for mapping forest carbon potential and risks, including biomass, fire, drought, and insect-related risk layers.",
    adaptForCQuant:
      "Use it as the reference for project-level risk overlays on forestry and land-use credits, especially in a premium integrity view.",
    boundaryNote:
      "Do not over-generalize its U.S.-focused gridded layers to every voluntary credit. Keep geography and coverage explicit.",
    llmUse:
      "Use the copilot to turn hazard layers into readable project risk briefs and explain why integrity risk may override a cheap price.",
    source: {
      label: "GitHub README",
      url: "https://github.com/carbonplan/forest-risks",
      accessed
    }
  },
  {
    id: "qaoa-carbon-cerrado",
    name: "hgribeirogeo/qaoa-carbon-cerrado",
    category: "Portfolio optimization research",
    verifiedCapability:
      "Verified from the repo README: a multi-objective portfolio optimization problem over carbon, biodiversity, and social impact using QAOA with zero-noise extrapolation.",
    adaptForCQuant:
      "Borrow the multi-objective optimization frame for a carbon sleeve optimizer that balances liquidity, basis risk, integrity, concentration, and policy fit.",
    boundaryNote:
      "Do not make quantum hardware or quantum branding a product requirement. The product should implement a practical classical optimizer first.",
    llmUse:
      "Use the copilot to explain why a portfolio frontier changes when the user shifts weights across carbon, integrity, and liquidity.",
    source: {
      label: "GitHub README",
      url: "https://github.com/hgribeirogeo/qaoa-carbon-cerrado",
      accessed
    }
  },
  {
    id: "gcam-core",
    name: "JGCRI/gcam-core",
    category: "Macro scenario engine",
    verifiedCapability:
      "Verified from the repo README: a multisector model linking economy, energy, land, water, trade, and climate interactions over long horizons.",
    adaptForCQuant:
      "Use it as the benchmark for long-horizon scenario narratives that connect carbon price exposure with energy, land, and macro-policy pathways.",
    boundaryNote:
      "Do not pretend GCAM-like outputs are short-horizon trade signals. Keep them in the scenario and policy-stress layer.",
    llmUse:
      "Use the copilot to connect long-horizon scenario changes back to nearer-term market watchpoints and decision checklists.",
    source: {
      label: "GitHub README",
      url: "https://github.com/JGCRI/gcam-core",
      accessed
    }
  }
];
