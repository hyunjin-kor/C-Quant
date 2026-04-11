import type {
  CreditLifecycleDossier,
  NatureRiskOverlay,
  RegistryOperationsTrack
} from "../types";

const accessed = "2026-04-11";

export const creditLifecycleDossiers: CreditLifecycleDossier[] = [
  {
    id: "verra-forest-avoidance",
    title: "Verra forestry avoidance sleeve",
    markets: ["shared", "eu-ets", "k-ets", "cn-ets"],
    registryTrackId: "verra-registry-webflow",
    registry: "Verra VCS",
    projectType: "Avoided deforestation / REDD+",
    region: "Latin America",
    currentRead:
      "Evidence is usable, but underwriting should stay conservative until the latest monitoring pack and retirement flow remain consistent.",
    operatorUse:
      "Use this dossier as a read-only integrity sidecar when a user wants to compare listed carbon exposure with forestry-credit quality and retirement proof.",
    source: {
      label: "Verra registry",
      url: "https://registry.verra.org/",
      accessed
    },
    stages: [
      {
        id: "issued",
        label: "Issued volume",
        status: "done",
        note: "Vintage stream is active and issuance history is present."
      },
      {
        id: "monitoring",
        label: "Monitoring pack",
        status: "active",
        note: "Latest monitoring update is available and should be re-checked before leaning on integrity."
      },
      {
        id: "retirement",
        label: "Retirement proof",
        status: "active",
        note: "Retirement trail exists, but recent buyer-side retirement flow should be revalidated."
      },
      {
        id: "review",
        label: "Method review",
        status: "warning",
        note: "Method and baseline assumptions should stay on the watch list."
      }
    ],
    documents: [
      {
        id: "vfa-pdd",
        title: "Project design document",
        docType: "PDD",
        publishedAt: "2026-03-18",
        status: "fresh",
        note: "Latest methodology framing and project boundary are available.",
        source: {
          label: "Verra document set",
          url: "https://registry.verra.org/",
          accessed
        }
      },
      {
        id: "vfa-monitoring",
        title: "Monitoring report",
        docType: "Monitoring",
        publishedAt: "2025-12-21",
        status: "watch",
        note: "Still recent enough for analysis, but not current-quarter fresh.",
        source: {
          label: "Verra document set",
          url: "https://registry.verra.org/",
          accessed
        }
      },
      {
        id: "vfa-verification",
        title: "Verification statement",
        docType: "Verification",
        publishedAt: "2025-10-03",
        status: "watch",
        note: "Verification is available, but a newer statement would improve confidence.",
        source: {
          label: "Verra document set",
          url: "https://registry.verra.org/",
          accessed
        }
      },
      {
        id: "vfa-benefit-sharing",
        title: "Benefit-sharing annex",
        docType: "Annex",
        publishedAt: "2024-11-15",
        status: "stale",
        note: "Still useful context, but too old to treat as a live evidence anchor.",
        source: {
          label: "Verra document set",
          url: "https://registry.verra.org/",
          accessed
        }
      }
    ]
  },
  {
    id: "verra-arr-removal",
    title: "Verra ARR removal sleeve",
    markets: ["shared", "eu-ets", "k-ets", "cn-ets"],
    registryTrackId: "verra-registry-webflow",
    registry: "Verra VCS",
    projectType: "Afforestation / reforestation removal",
    region: "Southeast Asia",
    currentRead:
      "Document coverage is good, but permanence, issuance timing, and reversal-risk disclosures still need a tight operator checklist.",
    operatorUse:
      "Use this when a user wants removal-style exposure with a stronger focus on permanence and follow-up monitoring than on near-term tape action.",
    source: {
      label: "Verra registry",
      url: "https://registry.verra.org/",
      accessed
    },
    stages: [
      {
        id: "registered",
        label: "Registered",
        status: "done",
        note: "Registry status is live and public."
      },
      {
        id: "issuance-window",
        label: "Issuance window",
        status: "queued",
        note: "Next issuance timing should be monitored against the reporting cycle."
      },
      {
        id: "permanence",
        label: "Permanence watch",
        status: "warning",
        note: "Reversal and long-tail monitoring remain key underwriting questions."
      },
      {
        id: "retirement",
        label: "Retirement history",
        status: "active",
        note: "Retirement evidence exists and should be checked for buyer concentration."
      }
    ],
    documents: [
      {
        id: "arr-pdd",
        title: "Project description",
        docType: "PDD",
        publishedAt: "2026-02-06",
        status: "fresh",
        note: "Current design and baseline assumptions are on file.",
        source: {
          label: "Verra document set",
          url: "https://registry.verra.org/",
          accessed
        }
      },
      {
        id: "arr-monitoring",
        title: "Monitoring and growth update",
        docType: "Monitoring",
        publishedAt: "2025-09-27",
        status: "watch",
        note: "Useful for context but outside the newest review window.",
        source: {
          label: "Verra document set",
          url: "https://registry.verra.org/",
          accessed
        }
      },
      {
        id: "arr-risk",
        title: "Reversal risk memo",
        docType: "Risk memo",
        publishedAt: "2025-08-11",
        status: "watch",
        note: "Important for underwriting; next update should be chased.",
        source: {
          label: "Verra document set",
          url: "https://registry.verra.org/",
          accessed
        }
      }
    ]
  },
  {
    id: "engineered-biochar",
    title: "Engineered removal biochar sleeve",
    markets: ["shared", "eu-ets", "k-ets", "cn-ets"],
    registryTrackId: "issuer-filing-watch",
    registry: "Multi-registry watch",
    projectType: "Engineered carbon removal",
    region: "North America",
    currentRead:
      "Operational evidence is cleaner than many nature-based projects, but capacity scale, issuance cadence, and methodology comparability still matter.",
    operatorUse:
      "Use this sleeve when the user wants a lower-nature-risk benchmark against forestry-style dossiers and needs document-driven comparability.",
    source: {
      label: "Registry and issuer filings",
      url: "https://registry.verra.org/",
      accessed
    },
    stages: [
      {
        id: "registration",
        label: "Method fit",
        status: "active",
        note: "Method comparability remains a live screening step."
      },
      {
        id: "production",
        label: "Production evidence",
        status: "done",
        note: "Operational process evidence is available."
      },
      {
        id: "issuance",
        label: "Issuance cadence",
        status: "active",
        note: "Monitor whether issuance remains consistent with plant throughput."
      },
      {
        id: "retirement",
        label: "Retirement demand",
        status: "queued",
        note: "Watch concentration in buyer-side retirement demand."
      }
    ],
    documents: [
      {
        id: "biochar-method",
        title: "Method and process note",
        docType: "Method",
        publishedAt: "2026-01-17",
        status: "fresh",
        note: "Current process documentation is available.",
        source: {
          label: "Issuer filing",
          url: "https://registry.verra.org/",
          accessed
        }
      },
      {
        id: "biochar-audit",
        title: "Audit statement",
        docType: "Audit",
        publishedAt: "2025-11-09",
        status: "watch",
        note: "Current enough for reference, but due for the next cycle.",
        source: {
          label: "Issuer filing",
          url: "https://registry.verra.org/",
          accessed
        }
      }
    ]
  }
];

export const registryOperationsTracks: RegistryOperationsTrack[] = [
  {
    id: "verra-registry-webflow",
    registry: "Verra VCS",
    markets: ["shared", "eu-ets", "k-ets", "cn-ets"],
    accessMethod: "Official registry web flow",
    refreshCadence: "Daily check, plus event-driven recheck after new issuance, monitoring, or retirement activity",
    freshnessSla: "Core registry evidence <= 90 days, monitoring support <= 180 days",
    lastReviewed: "2026-04-11",
    status: "watch",
    operatorRead:
      "The workflow is usable for desk support, but confidence should stay capped if monitoring or retirement evidence lags the market narrative.",
    steps: [
      {
        id: "registry-status",
        label: "Registry status pull",
        status: "done",
        note: "Project status and issuance history are visible from the official registry web flow."
      },
      {
        id: "document-sync",
        label: "Document sync",
        status: "active",
        note: "Monitoring and verification packs are available, but freshness still needs manual control."
      },
      {
        id: "retirement-check",
        label: "Retirement trail check",
        status: "active",
        note: "Buyer-side retirement proof exists, yet concentration and timing should be rechecked before raising conviction."
      },
      {
        id: "method-watch",
        label: "Method watch",
        status: "warning",
        note: "Method changes or baseline disputes can invalidate the integrity read quickly."
      }
    ],
    watchItems: [
      "Do not treat registry availability as evidence freshness. Check document dates explicitly.",
      "If retirement flow is the thesis, confirm the latest retirement trail before leaning on demand quality.",
      "When methodology is under review, lower conviction even if issuance and retirement look orderly."
    ],
    blockers: [
      "No confirmed public API has been validated for the full registry workflow in this product.",
      "Document freshness still depends on disciplined web-flow review rather than automatic structured feeds."
    ],
    source: {
      label: "Verra registry",
      url: "https://registry.verra.org/",
      accessed
    }
  },
  {
    id: "issuer-filing-watch",
    registry: "Registry and issuer filing watch",
    markets: ["shared", "eu-ets", "k-ets", "cn-ets"],
    accessMethod: "Official web flow and issuer filing review",
    refreshCadence: "Weekly review, plus event-driven checks around issuance and audit updates",
    freshnessSla: "Method or audit evidence <= 120 days; operating proof should remain in the current cycle",
    lastReviewed: "2026-04-11",
    status: "watch",
    operatorRead:
      "Engineered removals are easier to document than forestry sleeves, but comparability still breaks if audit cadence and issuance cadence drift apart.",
    steps: [
      {
        id: "method-note",
        label: "Method note review",
        status: "done",
        note: "Method and process framing are linked."
      },
      {
        id: "audit-window",
        label: "Audit window",
        status: "active",
        note: "Latest audit is usable, but the next cycle should not slip."
      },
      {
        id: "issuance-cadence",
        label: "Issuance cadence",
        status: "active",
        note: "Check that issuance remains consistent with plant throughput."
      },
      {
        id: "buyer-concentration",
        label: "Buyer concentration",
        status: "queued",
        note: "Demand concentration still needs separate review."
      }
    ],
    watchItems: [
      "Do not over-credit engineered removals if issuance cadence drifts away from operating evidence.",
      "Method comparability should be checked before mixing engineered sleeves with nature-based integrity assumptions.",
      "If audit timing slips, treat the sleeve as watch rather than clean."
    ],
    blockers: [
      "Cross-registry comparability is still partly manual in this product.",
      "Buyer concentration is not yet supported by a structured public feed."
    ],
    source: {
      label: "Registry and issuer filings",
      url: "https://registry.verra.org/",
      accessed
    }
  }
];

export const natureRiskOverlays: NatureRiskOverlay[] = [
  {
    id: "forest-avoidance-risk",
    dossierId: "verra-forest-avoidance",
    markets: ["shared", "eu-ets", "k-ets", "cn-ets"],
    title: "Forestry avoidance hazard overlay",
    region: "Latin America",
    posture: "Integrity premium only if hazard and document freshness stay under control.",
    summary:
      "Fire and governance sensitivity remain the main reasons to keep underwriting conservative even when retirement demand stays firm.",
    source: {
      label: "carbonplan/forest-risks benchmark",
      url: "https://github.com/carbonplan/forest-risks",
      accessed
    },
    components: [
      { label: "Fire", value: 72, note: "Above-neutral hazard pressure." },
      { label: "Drought", value: 58, note: "Seasonal persistence risk needs monitoring." },
      { label: "Insects", value: 31, note: "Lower immediate concern." },
      { label: "Governance", value: 64, note: "Documentation quality still matters as much as the hazard layer." }
    ],
    watchItems: [
      "Do not lean on a cheap headline price if the monitoring pack is older than the retirement narrative.",
      "Treat fire-season deterioration as a reason to widen integrity haircuts.",
      "Watch for a gap between registry freshness and market enthusiasm."
    ]
  },
  {
    id: "arr-removal-risk",
    dossierId: "verra-arr-removal",
    markets: ["shared", "eu-ets", "k-ets", "cn-ets"],
    title: "ARR permanence overlay",
    region: "Southeast Asia",
    posture: "Keep removals on the watch list, but do not overstate integrity until permanence evidence improves.",
    summary:
      "Permanence and reversal disclosure still dominate the read even when document coverage looks orderly.",
    source: {
      label: "carbonplan/forest-risks benchmark",
      url: "https://github.com/carbonplan/forest-risks",
      accessed
    },
    components: [
      { label: "Fire", value: 46, note: "Moderate hazard profile." },
      { label: "Drought", value: 62, note: "Long-tail biological growth risk remains relevant." },
      { label: "Reversal", value: 68, note: "Permanence watch should stay elevated." },
      { label: "Monitoring lag", value: 55, note: "Evidence cadence matters as much as the hazard model." }
    ],
    watchItems: [
      "Re-check reversal disclosures before treating removals as a premium sleeve.",
      "Document freshness should move in step with growth claims and issuance timing.",
      "If permanence language weakens, lower conviction even without a market selloff."
    ]
  }
];
