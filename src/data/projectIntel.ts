import type { CreditLifecycleDossier, NatureRiskOverlay } from "../types";

const accessed = "2026-04-11";

export const creditLifecycleDossiers: CreditLifecycleDossier[] = [
  {
    id: "verra-forest-avoidance",
    title: "Verra forestry avoidance sleeve",
    markets: ["shared", "eu-ets", "k-ets", "cn-ets"],
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
