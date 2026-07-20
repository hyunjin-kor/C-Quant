import type { MaterialResearchEntry } from "../types";

const reviewedAt = "2026-07-20";

/**
 * Materials and abatement-technology atlas.
 *
 * This catalogue maps decarbonisation-relevant materials and processes to the
 * carbon-market read: when a technology becomes cheaper or its readiness
 * jumps, compliance demand for allowances softens at the margin and offset
 * supply patterns shift. The forecast layer does NOT use these numbers as
 * direct inputs; they are an evidence-trail for the operator.
 *
 * Citation policy:
 * - Only well-known, primary-source assessment reports (IPCC AR6, IEA, NREL,
 *   IETA, World Bank, ICAP) and major journals.
 * - Every entry has `verified: false` until a human signs off. The UI must
 *   never present these as authoritative price targets.
 *
 * Cost ranges and abatement potential are deliberately given as ranges that
 * trace back to the named report. Operators should re-check the report before
 * using a number in a memo.
 */
export const materialsResearch: MaterialResearchEntry[] = [
  {
    id: "ccs-amine-pcc",
    name: "Amine-based post-combustion CO₂ capture",
    type: "carbon-capture",
    readiness: "early-deploy",
    abatementPotential:
      "Per IEA, large-scale CCUS pathways could capture multi-Gt CO₂/yr by 2050 in Net Zero scenarios; amine PCC is the most-commercialised capture chemistry.",
    costPerTon:
      "Levelised CO₂ avoided cost typically reported in the $50-120/tCO₂ range for power and industrial flue gas in IEA / NETL technology assessments; site-specific.",
    marketRelevance:
      "Reduces compliance demand for hard-to-abate power and industrial emitters, particularly under EU ETS and CBAM-exposed value chains.",
    scopeNote:
      "This entry is a decision-support pointer. Operators must validate cost figures against the underlying primary report before quoting them.",
    references: [
      {
        label: "IEA - CCUS in Clean Energy Transitions",
        url: "https://www.iea.org/reports/ccus-in-clean-energy-transitions",
        accessed: reviewedAt
      },
      {
        label: "IPCC AR6 WG3 - Mitigation, Chapter 12 (Cross-sectoral)",
        url: "https://www.ipcc.ch/report/ar6/wg3/",
        accessed: reviewedAt
      }
    ],
    verified: false,
    reviewedAt
  },
  {
    id: "ccs-mof-sorbents",
    name: "Metal-organic-framework (MOF) sorbents for CO₂ capture",
    type: "carbon-capture",
    readiness: "pilot",
    abatementPotential:
      "Per peer-reviewed literature, MOF sorbents can reach high CO₂ working capacities and lower regeneration energy versus amines under specific conditions; commercial uptake is still pilot-scale.",
    costPerTon:
      "Cost-of-capture is highly material- and process-dependent and not yet stabilised; literature reports a wide range below mature amine systems but with material-supply risk.",
    marketRelevance:
      "If MOF capture demonstrates durable, cost-competitive deployment, marginal abatement in cement and steel could shift, weakening medium-horizon EUA scarcity.",
    scopeNote:
      "Watch capacity-stability and water-tolerance papers; many lab-stage claims do not survive flue-gas conditions.",
    references: [
      {
        label: "Nature - Metal-organic frameworks for CO₂ capture (review literature)",
        url: "https://www.nature.com/subjects/metal-organic-frameworks",
        accessed: reviewedAt
      },
      {
        label: "IEA - CCUS in Clean Energy Transitions",
        url: "https://www.iea.org/reports/ccus-in-clean-energy-transitions",
        accessed: reviewedAt
      }
    ],
    verified: false,
    reviewedAt
  },
  {
    id: "dac-removal",
    name: "Direct air capture (DAC)",
    type: "removal",
    readiness: "early-deploy",
    abatementPotential:
      "IEA Net Zero pathways need engineered removals at multi-hundred Mt/yr by 2050; DAC is one of the leading engineered-removal pathways.",
    costPerTon:
      "Public reports place current DAC at roughly $400-1000/tCO₂ for first-of-a-kind plants, with developers targeting <$200/tCO₂ at scale. Numbers should be verified against the most recent IEA / NREL report.",
    marketRelevance:
      "Engineered removals interact with offset markets and CDR registries more than with EU/K/CN ETS allowances directly, but they shape long-horizon supply expectations for net-zero compliance buyers.",
    scopeNote:
      "Treat DAC cost numbers as engineering targets, not commodity prices. Most published costs are project-specific.",
    references: [
      {
        label: "IEA - Direct Air Capture",
        url: "https://www.iea.org/reports/direct-air-capture-2022",
        accessed: reviewedAt
      },
      {
        label: "IPCC AR6 WG3 - Mitigation",
        url: "https://www.ipcc.ch/report/ar6/wg3/",
        accessed: reviewedAt
      }
    ],
    verified: false,
    reviewedAt
  },
  {
    id: "green-hydrogen",
    name: "Green hydrogen via PEM / alkaline electrolysis",
    type: "low-carbon-fuel",
    readiness: "early-deploy",
    abatementPotential:
      "IEA Hydrogen Outlook flags hydrogen as a key decarbonisation lever for steel, ammonia, refining, and heavy transport.",
    costPerTon:
      "Levelised production cost is power-cost-dominated; IEA reports a wide cost range for green hydrogen versus grey, narrowing as electrolyser CAPEX falls and renewable LCOE drops.",
    marketRelevance:
      "Substitution of grey hydrogen in refining and ammonia directly reduces ETS-covered emissions; sustained cheap electrolysis would soften long-horizon EU ETS demand.",
    scopeNote:
      "Cost estimates depend on local renewable LCOE and electrolyser utilisation. Verify with the most recent IEA report before quoting a single number.",
    references: [
      {
        label: "IEA - Global Hydrogen Review (annual)",
        url: "https://www.iea.org/reports/global-hydrogen-review-2024",
        accessed: reviewedAt
      },
      {
        label: "IRENA - Green Hydrogen Cost Reduction",
        url: "https://www.irena.org/publications/2020/Dec/Green-hydrogen-cost-reduction",
        accessed: reviewedAt
      }
    ],
    verified: false,
    reviewedAt
  },
  {
    id: "green-steel-h2-dri",
    name: "Hydrogen-based direct reduced iron (H₂-DRI) for green steel",
    type: "industrial-decarb",
    readiness: "pilot",
    abatementPotential:
      "Steel accounts for roughly 7-9% of global CO₂ per IEA Iron and Steel reports; H₂-DRI replaces coke in primary iron-making and is the leading near-zero pathway.",
    costPerTon:
      "Cost premium versus blast-furnace steel is power- and hydrogen-cost-dependent; declines with electrolyser CAPEX and CBAM cost pass-through.",
    marketRelevance:
      "EU CBAM exposure ties the cost of green steel directly to EUA pricing; deployment changes the demand structure for EU ETS allowances in the steel sector.",
    scopeNote:
      "Pilot plants exist; commercial-scale economics are not yet stabilised. Pilot data is not a forward price.",
    references: [
      {
        label: "IEA - Iron and Steel Technology Roadmap",
        url: "https://www.iea.org/reports/iron-and-steel-technology-roadmap",
        accessed: reviewedAt
      },
      {
        label: "Mission Possible Partnership - Steel transition",
        url: "https://missionpossiblepartnership.org/sectors/",
        accessed: reviewedAt
      }
    ],
    verified: false,
    reviewedAt
  },
  {
    id: "low-clinker-cement",
    name: "Low-clinker / SCM-blended cement (calcined clay, limestone)",
    type: "industrial-decarb",
    readiness: "scale",
    abatementPotential:
      "Per IEA Cement and GCCA roadmaps, clinker substitution and supplementary cementitious materials (SCMs) deliver near-term, low-cost cement abatement.",
    costPerTon:
      "Often cost-competitive or cheaper than OPC at scale, depending on SCM availability; LC3 (limestone calcined clay) is one widely-cited pathway.",
    marketRelevance:
      "Cement is EU-ETS-covered and CBAM-listed; widespread adoption would lower marginal abatement cost and weaken short-horizon allowance scarcity.",
    scopeNote:
      "Standards and specification adoption pace is the binding constraint, not technology. Watch national specification updates.",
    references: [
      {
        label: "IEA - Cement (Tracking Industry)",
        url: "https://www.iea.org/energy-system/industry/cement",
        accessed: reviewedAt
      },
      {
        label: "GCCA - Cement and concrete climate ambition",
        url: "https://gccassociation.org/concretefuture/",
        accessed: reviewedAt
      }
    ],
    verified: false,
    reviewedAt
  },
  {
    id: "biochar-removal",
    name: "Biochar (engineered carbon sequestration in soil)",
    type: "removal",
    readiness: "early-deploy",
    abatementPotential:
      "IPCC AR6 lists biochar as a moderate-cost removal option with co-benefits; per-hectare and per-tonne sequestration depend on feedstock and pyrolysis conditions.",
    costPerTon:
      "Public removal-credit markets show biochar trading well above commodity offset prices, often $100-300/tCO₂ per registry-listed transactions.",
    marketRelevance:
      "Biochar is one of the few durable nature-based pathways with a measurable durability claim, intersecting with VCM and CORSIA-eligible offset supply.",
    scopeNote:
      "Durability and accounting methods vary by registry. Verify the registry methodology before treating a credit as comparable to ETS allowances.",
    references: [
      {
        label: "IPCC AR6 WG3 - Mitigation",
        url: "https://www.ipcc.ch/report/ar6/wg3/",
        accessed: reviewedAt
      },
      {
        label: "Verra VCS Methodologies (for registry context)",
        url: "https://verra.org/programs/verified-carbon-standard/",
        accessed: reviewedAt
      }
    ],
    verified: false,
    reviewedAt
  },
  {
    id: "afolu-forest-restoration",
    name: "Forest restoration & avoided deforestation (AFOLU)",
    type: "nature-based",
    readiness: "scale",
    abatementPotential:
      "AFOLU pathways are a major share of land-sector mitigation per IPCC AR6; durability and additionality are widely-debated.",
    costPerTon:
      "Voluntary market prices for nature-based credits range broadly; integrity-flagged projects trade at discounts.",
    marketRelevance:
      "Nature-based offsets feed VCM and certain compliance markets (where eligible). Market integrity reviews directly affect supply availability.",
    scopeNote:
      "Recent integrity reviews (e.g., ICVCM Core Carbon Principles) have changed buyer preferences. Treat headline volumes as inventory, not as quality.",
    references: [
      {
        label: "IPCC AR6 WG3 - Mitigation, Chapter 7 (AFOLU)",
        url: "https://www.ipcc.ch/report/ar6/wg3/",
        accessed: reviewedAt
      },
      {
        label: "ICVCM - Core Carbon Principles",
        url: "https://icvcm.org/the-core-carbon-principles/",
        accessed: reviewedAt
      }
    ],
    verified: false,
    reviewedAt
  },
  {
    id: "ccs-bioenergy-beccs",
    name: "Bioenergy with carbon capture and storage (BECCS)",
    type: "removal",
    readiness: "pilot",
    abatementPotential:
      "BECCS is a key engineered-plus-biological removal pathway in IPCC AR6 mitigation scenarios meeting 1.5-2°C.",
    costPerTon:
      "Costs depend on biomass supply chain and capture economics; AR6 reports a wide range with significant scenario uncertainty.",
    marketRelevance:
      "Long-horizon: changes the assumed trajectory of net-negative supply. Important for compliance buyers planning long-dated procurement.",
    scopeNote:
      "Sustainability of the biomass supply chain is the binding question, not the capture engineering.",
    references: [
      {
        label: "IPCC AR6 WG3 - Mitigation",
        url: "https://www.ipcc.ch/report/ar6/wg3/",
        accessed: reviewedAt
      },
      {
        label: "IEA - Bioenergy",
        url: "https://www.iea.org/energy-system/renewables/bioenergy",
        accessed: reviewedAt
      }
    ],
    verified: false,
    reviewedAt
  },
  {
    id: "renewable-power-lcoe",
    name: "Renewable LCOE (solar PV, onshore wind, BESS)",
    type: "industrial-decarb",
    readiness: "scale",
    abatementPotential:
      "Replaces marginal thermal generation; the largest single lever for power-sector emissions reduction in IEA scenarios.",
    costPerTon:
      "LCOE has declined an order of magnitude since 2010 per IRENA/IEA; further declines in BESS shift the economics of curtailment-shifted hours.",
    marketRelevance:
      "Renewable share is a primary structural input to ETS demand; weather-driven variability is the short-horizon catalyst (see weather catalyst stack).",
    scopeNote:
      "Cost numbers are widely public but jurisdiction-specific. Use the latest IRENA / IEA report rather than older citations.",
    references: [
      {
        label: "IRENA - Renewable Power Generation Costs",
        url: "https://www.irena.org/publications/2024/Sep/Renewable-Power-Generation-Costs-in-2023",
        accessed: reviewedAt
      },
      {
        label: "IEA - Electricity",
        url: "https://www.iea.org/energy-system/electricity",
        accessed: reviewedAt
      }
    ],
    verified: false,
    reviewedAt
  }
];

/**
 * Lightweight relevance scorer for ranking entries against a market.
 * Used by the UI to surface the most decision-relevant entries first
 * without fabricating any quantitative claim.
 */
export function rankMaterialsForMarket(
  market: "eu-ets" | "k-ets" | "cn-ets" | "shared",
  entries: MaterialResearchEntry[] = materialsResearch
): MaterialResearchEntry[] {
  const score = (entry: MaterialResearchEntry): number => {
    let s = 0;
    if (entry.readiness === "scale") s += 3;
    else if (entry.readiness === "early-deploy") s += 2;
    else if (entry.readiness === "pilot") s += 1;

    if (market === "eu-ets") {
      if (/CBAM|EU ETS|cement|steel|hydrogen|power/i.test(entry.marketRelevance)) s += 2;
    } else if (market === "k-ets") {
      if (/power|hydrogen|steel/i.test(entry.marketRelevance)) s += 1;
    } else if (market === "cn-ets") {
      if (/power|cement|steel/i.test(entry.marketRelevance)) s += 1;
    }

    return s;
  };

  return [...entries].sort((a, b) => score(b) - score(a));
}
