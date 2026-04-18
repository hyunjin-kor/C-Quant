import type { MarketInputBlock } from "../types";

export const marketInputBlocks: MarketInputBlock[] = [
  {
    id: "eu-official-anchor",
    marketId: "eu-ets",
    title: "EU official anchor",
    accessMethod: "Official file",
    refreshCadence: "Auction day / official release",
    purpose: "Anchor the desk to the latest official EEX primary market print before reading listed futures and proxies.",
    fields: [
      {
        name: "auction_date",
        priority: "Core",
        description: "Latest auction date used by the official EU primary market card.",
        sourceHint: "EEX EU ETS Auctions"
      },
      {
        name: "auction_clear_price",
        priority: "Core",
        description: "Latest official auction clearing price for the EU allowance primary market.",
        sourceHint: "EEX auction workbook"
      },
      {
        name: "auction_volume",
        priority: "Core",
        description: "Auction volume and primary market depth used to frame the official anchor.",
        sourceHint: "EEX auction workbook"
      },
      {
        name: "auction_cover",
        priority: "Support",
        description: "Auction cover and bid interest used as a short-horizon microstructure check.",
        sourceHint: "EEX auction report"
      }
    ]
  },
  {
    id: "eu-official-context",
    marketId: "eu-ets",
    title: "EU official context",
    accessMethod: "Official web flow / public API",
    refreshCadence: "Policy event / scheduled statistical refresh",
    purpose: "Keep structural policy and power-system context visible next to the price anchor.",
    fields: [
      {
        name: "msr_tnac_notice",
        priority: "Core",
        description: "Official MSR and TNAC notices that shift forward scarcity expectations.",
        sourceHint: "European Commission climate pages"
      },
      {
        name: "auction_calendar",
        priority: "Core",
        description: "Primary auction schedule used to frame near-term supply cadence.",
        sourceHint: "EEX auction calendar"
      },
      {
        name: "power_system_context",
        priority: "Support",
        description: "Power and gas-system context pulled from official European transparency platforms.",
        sourceHint: "ENTSO-E / ENTSOG"
      }
    ]
  },
  {
    id: "eu-listed-comparison",
    marketId: "eu-ets",
    title: "EU listed comparison",
    accessMethod: "Listed benchmark / public chart API",
    refreshCadence: "Intraday",
    purpose: "Compare the official anchor with the live hedge tape and energy drivers without mistaking the proxy for settlement.",
    fields: [
      {
        name: "ice_eua_december",
        priority: "Core",
        description: "Primary listed hedge tape used to compare against the official anchor.",
        sourceHint: "ICE EUA futures"
      },
      {
        name: "ttf_gas",
        priority: "Support",
        description: "Fuel-switching context that helps explain short-term carbon repricing.",
        sourceHint: "Listed gas comparison tape"
      },
      {
        name: "rotterdam_coal",
        priority: "Support",
        description: "Coal leg used to read dark-spread and fuel-switch pressure.",
        sourceHint: "Listed coal comparison tape"
      }
    ]
  },
  {
    id: "k-official-anchor",
    marketId: "k-ets",
    title: "K-ETS official anchor",
    accessMethod: "Official web / official API sample",
    refreshCadence: "Daily official tape",
    purpose: "Anchor domestic carbon read to the official KRX market tape before using any global listed proxy.",
    fields: [
      {
        name: "kau_close",
        priority: "Core",
        description: "Latest official close for the active KAU allowance line.",
        sourceHint: "KRX ETS information platform / open API sample"
      },
      {
        name: "kau_volume",
        priority: "Core",
        description: "Official traded volume used to read market depth and conviction.",
        sourceHint: "KRX ETS information platform / open API sample"
      },
      {
        name: "active_instrument",
        priority: "Core",
        description: "KRX active allowance instrument used for the daily anchor.",
        sourceHint: "KRX ETS market tape"
      }
    ]
  },
  {
    id: "k-official-context",
    marketId: "k-ets",
    title: "K-ETS official context",
    accessMethod: "Official web flow / official file",
    refreshCadence: "Policy event / auction notice",
    purpose: "Track domestic compliance timing, auction notices, and market reform events in the same surface.",
    fields: [
      {
        name: "auction_notice",
        priority: "Core",
        description: "Auction and market-operation notices that shift domestic supply expectations.",
        sourceHint: "KRX / MOE official notice flow"
      },
      {
        name: "compliance_window",
        priority: "Core",
        description: "Compliance seasonality layer for short-term liquidity and timing risk.",
        sourceHint: "K-ETS compliance calendar"
      },
      {
        name: "policy_reform_watch",
        priority: "Support",
        description: "Domestic reform and allocation changes that can alter structure beyond daily price action.",
        sourceHint: "MOE official releases"
      }
    ]
  },
  {
    id: "k-listed-comparison",
    marketId: "k-ets",
    title: "K-ETS listed comparison",
    accessMethod: "Listed proxy / public chart API",
    refreshCadence: "Intraday",
    purpose: "Use listed and macro comparison only as reference, never as a replacement for the official KRX close.",
    fields: [
      {
        name: "krbn_proxy",
        priority: "Core",
        description: "Global listed carbon proxy used when comparing domestic read with offshore listed risk appetite.",
        sourceHint: "KRBN"
      },
      {
        name: "usdkrw_context",
        priority: "Support",
        description: "Macro context used to watch domestic risk transfer and imported energy stress.",
        sourceHint: "Domestic macro layer"
      },
      {
        name: "energy_macro_context",
        priority: "Support",
        description: "Energy and macro overlay used to contextualize domestic price moves.",
        sourceHint: "Public comparison tape"
      }
    ]
  },
  {
    id: "cn-official-anchor",
    marketId: "cn-ets",
    title: "CN ETS official anchor",
    accessMethod: "Official web flow",
    refreshCadence: "Daily bulletin",
    purpose: "Read the national carbon market from the official daily exchange bulletin rather than from offshore proxy action alone.",
    fields: [
      {
        name: "cea_close",
        priority: "Core",
        description: "Official daily closing price from the national carbon market bulletin.",
        sourceHint: "Shanghai Environment and Energy Exchange daily overview"
      },
      {
        name: "cea_volume",
        priority: "Core",
        description: "Daily total turnover published in the official exchange bulletin.",
        sourceHint: "Shanghai Environment and Energy Exchange daily overview"
      },
      {
        name: "cumulative_turnover",
        priority: "Support",
        description: "Cumulative turnover figures used to frame market scale and regime context.",
        sourceHint: "Shanghai Environment and Energy Exchange daily overview"
      }
    ]
  },
  {
    id: "cn-official-context",
    marketId: "cn-ets",
    title: "CN ETS official context",
    accessMethod: "Official web flow / official file",
    refreshCadence: "Policy bulletin / development report",
    purpose: "Separate policy and operating context from the limited official daily tape.",
    fields: [
      {
        name: "mee_release_feed",
        priority: "Core",
        description: "Latest MEE release used to detect changes in national market operations and expansion.",
        sourceHint: "MEE carbon-market release feed"
      },
      {
        name: "development_report",
        priority: "Core",
        description: "National market development report used to frame structure, institutions, and expansion.",
        sourceHint: "MEE development report"
      },
      {
        name: "sector_expansion_watch",
        priority: "Support",
        description: "Expansion and implementation milestones that can change market interpretation without intraday trading.",
        sourceHint: "MEE official notices"
      }
    ]
  },
  {
    id: "cn-listed-comparison",
    marketId: "cn-ets",
    title: "CN ETS listed comparison",
    accessMethod: "Listed proxy / public chart API",
    refreshCadence: "Intraday",
    purpose: "Keep global listed carbon proxies visible, but explicitly below the official Chinese policy and bulletin flow.",
    fields: [
      {
        name: "krbn_proxy",
        priority: "Core",
        description: "Global listed carbon comparison sleeve used only as a reference tape.",
        sourceHint: "KRBN"
      },
      {
        name: "coal_context",
        priority: "Support",
        description: "Coal and power context used to interpret macro energy sensitivity.",
        sourceHint: "Public comparison tape"
      },
      {
        name: "policy_signal_overlay",
        priority: "Support",
        description: "Internal policy timing overlay that keeps the operator focused on official releases.",
        sourceHint: "C-Quant decision layer"
      }
    ]
  }
];
