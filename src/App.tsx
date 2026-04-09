import { useEffect, useMemo, useState } from "react";
import { marketDatasetSchemas } from "./data/dataHub";
import {
  marketWatchItems,
  sourceRegistry,
  subscriptionFeatures,
  trustPrinciples
} from "./data/platform";
import { marketProfiles, quantIndicators } from "./data/research";
import { parseCsv, runBacktest } from "./lib/backtest";
import { buildForecast } from "./lib/forecast";
import type {
  BacktestRun,
  BacktestStrategy,
  ConnectedSourceCard,
  ConnectedSourcePayload,
  MarketProfile,
  ParsedSeriesPoint,
  SourceRegistryItem,
  WalkForwardResult
} from "./types";

declare global {
  interface Window {
    desktopBridge?: {
      version: string;
      pickCsvFile: () => Promise<string | null>;
      readTextFile: (path: string) => Promise<string>;
      minimizeWindow: () => Promise<void>;
      toggleMaximizeWindow: () => Promise<boolean>;
      closeWindow: () => Promise<void>;
      isWindowMaximized: () => Promise<boolean>;
      refreshConnectedSources: () => Promise<ConnectedSourcePayload>;
      runWalkForwardModel: (options: {
        inputPath: string;
        marketId: MarketProfile["id"];
        trainWindow: number;
        horizon: number;
      }) => Promise<WalkForwardResult>;
    };
  }
}

type Surface = "today" | "drivers" | "sources" | "lab";
type LabMode = "scenario" | "model" | "backtest";

type SurfaceDefinition = {
  id: Surface;
  label: string;
  title: string;
  summary: string;
};

type FactorFamily = {
  id: string;
  label: string;
  description: string;
  matcher: (category: string) => boolean;
};

type FeedItem = {
  id: string;
  marketId: MarketProfile["id"] | "shared";
  kicker: string;
  title: string;
  body: string;
  emphasis: string;
  link?: string;
};

const surfaceTabs: SurfaceDefinition[] = [
  {
    id: "today",
    label: "Today",
    title: "Carbon board",
    summary: "Three markets, one trusted view."
  },
  {
    id: "drivers",
    label: "Drivers",
    title: "Impact map",
    summary: "See what is pushing each market."
  },
  {
    id: "sources",
    label: "Sources",
    title: "Trust center",
    summary: "Show where every number comes from."
  },
  {
    id: "lab",
    label: "Lab",
    title: "Research lab",
    summary: "Scenario, model, and backtest in one desk."
  }
];

const factorFamilies: FactorFamily[] = [
  {
    id: "policy",
    label: "Policy & supply",
    description: "Cap path, reforms, allocation, and supply controls.",
    matcher: (category) => /policy|supply/i.test(category)
  },
  {
    id: "power",
    label: "Power & industry",
    description: "Power price, dispatch, industrial activity, and generation mix.",
    matcher: (category) => /power|industry/i.test(category)
  },
  {
    id: "fuel",
    label: "Fuel switching",
    description: "Gas, coal, oil, and thermal margin linkage.",
    matcher: (category) => /fuel/i.test(category)
  },
  {
    id: "macro",
    label: "Macro & finance",
    description: "Financial stress, FX, rate, and activity sensitivity.",
    matcher: (category) => /macro|financial/i.test(category)
  },
  {
    id: "weather",
    label: "Weather & seasonality",
    description: "Temperature, residual load, and recurring timing effects.",
    matcher: (category) => /weather|seasonality/i.test(category)
  },
  {
    id: "execution",
    label: "Liquidity & execution",
    description: "Auction rhythm, turnover, participation, and microstructure.",
    matcher: (category) => /market|microstructure|execution|calendar|liquidity|compliance/i.test(category)
  }
];

const strategyLabels: Record<BacktestStrategy, string> = {
  trend: "Trend breakout",
  meanReversion: "Mean reversion",
  spreadRegime: "Spread regime",
  policyMomentum: "Policy momentum"
};

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function formatPct(value: number): string {
  return `${value.toFixed(2)}%`;
}

function formatTimestamp(value?: string): string {
  if (!value) {
    return "Not fetched yet";
  }
  return value.slice(0, 19).replace("T", " ");
}

function statusLabel(status: ConnectedSourceCard["status"]): string {
  if (status === "connected") {
    return "Official";
  }
  if (status === "limited") {
    return "Partial";
  }
  return "Error";
}

function importanceRank(label: string): number {
  if (label === "Core") {
    return 3;
  }
  if (label === "High") {
    return 2;
  }
  return 1;
}

function driverWeightScore(marketId: MarketProfile["id"], family?: FactorFamily) {
  const market = marketProfiles.find((item) => item.id === marketId)!;
  const drivers = family
    ? market.drivers.filter((driver) => family.matcher(driver.category))
    : market.drivers;

  return drivers
    .slice()
    .sort((left, right) => {
      const scoreGap =
        importanceRank(right.importance) * 10 + right.weight -
        (importanceRank(left.importance) * 10 + left.weight);
      return scoreGap;
    });
}

function buildFeedItems(
  sourcePayload: ConnectedSourcePayload | null,
  focusMarket: MarketProfile["id"]
): FeedItem[] {
  const cards = sourcePayload?.cards ?? [];
  const focus = marketProfiles.find((item) => item.id === focusMarket)!;
  const feedFromSources = cards.map((card) => ({
    id: card.id,
    marketId: card.marketId,
    kicker: marketProfiles.find((item) => item.id === card.marketId)!.name,
    title: card.headline,
    body: card.summary,
    emphasis: card.metrics[0]?.value ?? card.asOf,
    link: card.sourceUrl
  }));

  return [
    ...feedFromSources,
    {
      id: `${focusMarket}-research-frame`,
      marketId: focusMarket,
      kicker: `${focus.name} research stack`,
      title: "Dominant factor families are stable",
      body: focus.scopeNote,
      emphasis: `${focus.drivers.length} tracked variables`
    },
    {
      id: "boundary-note",
      marketId: "shared",
      kicker: "Product boundary",
      title: "Research and monitoring only",
      body:
        "Use this product for trusted monitoring and interpretation. Trade execution stays outside the platform.",
      emphasis: "No brokerage flow"
    }
  ];
}

function resolvePrimaryMetric(card: ConnectedSourceCard | undefined): string {
  if (!card) {
    return "No official feed";
  }
  return card.metrics[0]?.value ?? card.asOf;
}

function resolveChangeMetric(card: ConnectedSourceCard | undefined): string {
  if (!card) {
    return "Awaiting data";
  }
  const match = card.metrics.find((metric) =>
    /change|return/i.test(metric.label)
  );
  return match?.value ?? card.metrics[1]?.value ?? "Official release";
}

function groupRegistryByMarket() {
  return [
    ...marketProfiles.map((market) => ({
      market: { id: market.id, name: market.name },
      items: sourceRegistry.filter((item) => item.markets.includes(market.id))
    })),
    {
      market: { id: "shared", name: "Shared infrastructure" },
      items: sourceRegistry.filter((item) => item.markets.includes("shared"))
    }
  ];
}

function WindowChrome() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function syncState() {
      if (!window.desktopBridge?.isWindowMaximized) {
        return;
      }
      const value = await window.desktopBridge.isWindowMaximized();
      if (mounted) {
        setIsMaximized(value);
      }
    }

    void syncState();
    const handle = () => void syncState();
    window.addEventListener("resize", handle);

    return () => {
      mounted = false;
      window.removeEventListener("resize", handle);
    };
  }, []);

  async function handleToggleMaximize() {
    const value = await window.desktopBridge?.toggleMaximizeWindow?.();
    if (typeof value === "boolean") {
      setIsMaximized(value);
    }
  }

  return (
    <div className="window-chrome">
      <div className="window-drag-area">
        <span className="window-title">C-Quant</span>
        <span className="window-subtitle">Carbon intelligence terminal</span>
      </div>
      <div className="window-controls">
        <button
          className="window-control"
          onClick={() => void window.desktopBridge?.minimizeWindow?.()}
          aria-label="Minimize window"
        >
          -
        </button>
        <button
          className="window-control"
          onClick={() => void handleToggleMaximize()}
          aria-label={isMaximized ? "Restore window" : "Maximize window"}
        >
          {isMaximized ? "❐" : "□"}
        </button>
        <button
          className="window-control close"
          onClick={() => void window.desktopBridge?.closeWindow?.()}
          aria-label="Close window"
        >
          ×
        </button>
      </div>
    </div>
  );
}

function Header(props: {
  surface: Surface;
  onSurfaceChange: (surface: Surface) => void;
  focusMarket: MarketProfile["id"];
  onMarketChange: (marketId: MarketProfile["id"]) => void;
  fetchedAt?: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const surface = surfaceTabs.find((item) => item.id === props.surface)!;

  return (
    <header className="masthead">
      <div className="brand-row">
        <div className="brand-seal">CQ</div>
        <div>
          <div className="brand-name">C-Quant</div>
          <div className="brand-subtitle">Carbon intelligence terminal</div>
        </div>
      </div>

      <nav className="surface-nav">
        {surfaceTabs.map((tab) => (
          <button
            key={tab.id}
            className={`surface-tab ${props.surface === tab.id ? "active" : ""}`}
            onClick={() => props.onSurfaceChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="header-side">
        <div className="market-switch">
          {marketProfiles.map((market) => (
            <button
              key={market.id}
              className={`market-chip ${props.focusMarket === market.id ? "active" : ""}`}
              onClick={() => props.onMarketChange(market.id)}
            >
              {market.name}
            </button>
          ))}
        </div>
        <div className="header-actions">
          <span className="soft-badge">{surface.title}</span>
          <span className="soft-badge">Last sync {formatTimestamp(props.fetchedAt)}</span>
          <button className="refresh-button" onClick={props.onRefresh}>
            {props.refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
    </header>
  );
}

function MarketBoard(props: {
  focusMarket: MarketProfile["id"];
  onMarketChange: (marketId: MarketProfile["id"]) => void;
  sourcePayload: ConnectedSourcePayload | null;
}) {
  return (
    <section className="market-strip">
      {marketProfiles.map((market) => {
        const card = props.sourcePayload?.cards.find((item) => item.marketId === market.id);
        return (
          <button
            key={market.id}
            className={`market-card ${props.focusMarket === market.id ? "active" : ""}`}
            onClick={() => props.onMarketChange(market.id)}
          >
            <div className="market-card-head">
              <span>{market.name}</span>
              <span className={`status-pill ${card?.status ?? "error"}`}>
                {statusLabel(card?.status ?? "error")}
              </span>
            </div>
            <div className="market-price">{resolvePrimaryMetric(card)}</div>
            <div className="market-change">{resolveChangeMetric(card)}</div>
            <p>{card?.summary ?? market.stageNote}</p>
            <div className="mini-row">
              {(card?.metrics.slice(0, 3) ?? []).map((metric) => (
                <div key={metric.label} className="mini-stat">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </button>
        );
      })}
    </section>
  );
}

function TodaySurface(props: {
  focusMarket: MarketProfile["id"];
  onMarketChange: (marketId: MarketProfile["id"]) => void;
  sourcePayload: ConnectedSourcePayload | null;
  sourcesError: string | null;
}) {
  const focus = marketProfiles.find((item) => item.id === props.focusMarket)!;
  const focusCard =
    props.sourcePayload?.cards.find((item) => item.marketId === props.focusMarket) ?? null;
  const feedItems = buildFeedItems(props.sourcePayload, props.focusMarket);
  const topDrivers = driverWeightScore(props.focusMarket).slice(0, 5);

  return (
    <section className="screen">
      <section className="poster">
        <div className="poster-copy">
          <span className="eyebrow">Subscriber-ready carbon intelligence</span>
          <h1>{focus.name} with the other two markets on the same screen.</h1>
          <p>
            Built for participants who need trusted carbon-market context, source-aware
            monitoring, and factor tracking before they trade elsewhere.
          </p>
          <div className="poster-tags">
            <span className="soft-badge">Official sources first</span>
            <span className="soft-badge">No brokerage flow</span>
            <span className="soft-badge">Research and alerts</span>
          </div>
        </div>

        <div className="poster-panel">
          <div className="panel-label">Today briefing</div>
          <h3>{focusCard?.headline ?? `${focus.name} source waiting`}</h3>
          <p>{focusCard?.summary ?? focus.stageNote}</p>
          <div className="brief-highlight">
            <strong>{resolvePrimaryMetric(focusCard ?? undefined)}</strong>
            <span>{resolveChangeMetric(focusCard ?? undefined)}</span>
          </div>
          {props.sourcesError && <p className="warning-text">{props.sourcesError}</p>}
        </div>
      </section>

      <section className="content-stack">
        <section className="section-block">
          <div className="section-head">
            <div>
              <span className="section-kicker">Global carbon board</span>
              <h2>All three markets at a glance</h2>
            </div>
          </div>
          <MarketBoard
            focusMarket={props.focusMarket}
            onMarketChange={props.onMarketChange}
            sourcePayload={props.sourcePayload}
          />
        </section>

        <section className="dual-layout">
          <article className="section-block">
            <div className="section-head">
              <div>
                <span className="section-kicker">Impact board</span>
                <h2>What moves each market</h2>
              </div>
            </div>
            <div className="matrix-board">
              <div className="matrix-row head">
                <div>Factor family</div>
                {marketProfiles.map((market) => (
                  <div key={market.id}>{market.name}</div>
                ))}
              </div>
              {factorFamilies.map((family) => (
                <div key={family.id} className="matrix-row">
                  <div className="family-cell">
                    <strong>{family.label}</strong>
                    <span>{family.description}</span>
                  </div>
                  {marketProfiles.map((market) => {
                    const drivers = driverWeightScore(market.id, family).slice(0, 2);
                    return (
                      <div key={`${family.id}-${market.id}`} className="matrix-cell">
                        {drivers.length > 0 ? (
                          <>
                            <strong>{drivers[0].variable}</strong>
                            <span>{drivers[0].importance}</span>
                            {drivers[1] && <p>{drivers[1].variable}</p>}
                          </>
                        ) : (
                          <span className="muted-text">No mapped driver</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </article>

          <aside className="side-stack">
            <article className="section-block side">
              <div className="section-head">
                <div>
                  <span className="section-kicker">Carbon feed</span>
                  <h2>What changed</h2>
                </div>
              </div>
              <div className="feed-list">
                {feedItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="feed-item">
                    <div className="feed-kicker">{item.kicker}</div>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                    <div className="feed-foot">
                      <span>{item.emphasis}</span>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noreferrer">
                          Source
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="section-block side">
              <div className="section-head">
                <div>
                  <span className="section-kicker">Trust center</span>
                  <h2>Why users can rely on this</h2>
                </div>
              </div>
              <div className="trust-list">
                {trustPrinciples.map((item) => (
                  <div key={item.id} className="trust-item">
                    <strong>{item.title}</strong>
                    <p>{item.description}</p>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </section>

        <section className="dual-layout">
          <article className="section-block">
            <div className="section-head">
              <div>
                <span className="section-kicker">{focus.name} focus</span>
                <h2>Top drivers and signal inputs</h2>
              </div>
            </div>
            <div className="driver-list">
              {topDrivers.map((driver) => (
                <div key={driver.id} className="driver-card">
                  <div className="driver-meta">
                    <span className={`importance-dot ${driver.importance.toLowerCase()}`} />
                    <strong>{driver.variable}</strong>
                  </div>
                  <p>{driver.note}</p>
                  <div className="driver-tags">
                    <span className="soft-badge">{driver.category}</span>
                    <span className="soft-badge">{driver.importance}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="side-stack">
            <article className="section-block side">
              <div className="section-head">
                <div>
                  <span className="section-kicker">Signal shelf</span>
                  <h2>Execution references</h2>
                </div>
              </div>
              <div className="signal-shelf">
                {quantIndicators.slice(0, 4).map((signal) => (
                  <div key={signal.id} className="signal-item">
                    <strong>{signal.name}</strong>
                    <p>{signal.whyItMatters}</p>
                    <div className="signal-tags">
                      {signal.requiredColumns.map((column) => (
                        <span key={column} className="soft-badge">
                          {column}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="section-block side premium-panel">
              <div className="section-head">
                <div>
                  <span className="section-kicker">Premium layer</span>
                  <h2>What subscribers pay for</h2>
                </div>
              </div>
              <div className="premium-list">
                {subscriptionFeatures.map((feature) => (
                  <div key={feature.id} className="premium-item">
                    <strong>{feature.title}</strong>
                    <p>{feature.description}</p>
                  </div>
                ))}
              </div>
            </article>
          </aside>
        </section>

        <MarketWatchSection />
      </section>
    </section>
  );
}

function DriversSurface({ focusMarket }: { focusMarket: MarketProfile["id"] }) {
  const focus = marketProfiles.find((item) => item.id === focusMarket)!;
  const grouped = factorFamilies.map((family) => ({
    family,
    drivers: driverWeightScore(focusMarket, family)
  }));
  const schema = marketDatasetSchemas.find((item) => item.marketId === focusMarket);

  return (
    <section className="screen">
      <section className="content-stack">
        <section className="dual-layout">
          <article className="section-block">
            <div className="section-head">
              <div>
                <span className="section-kicker">{focus.name} factor detail</span>
                <h2>Research-backed factor map</h2>
              </div>
            </div>
            <div className="factor-groups">
              {grouped.map(({ family, drivers }) => (
                <div key={family.id} className="factor-group">
                  <div className="factor-group-head">
                    <strong>{family.label}</strong>
                    <span>{drivers.length} variables</span>
                  </div>
                  <p>{family.description}</p>
                  <div className="driver-list">
                    {drivers.slice(0, 4).map((driver) => (
                      <div key={driver.id} className="driver-card compact">
                        <div className="driver-meta">
                          <span className={`importance-dot ${driver.importance.toLowerCase()}`} />
                          <strong>{driver.variable}</strong>
                        </div>
                        <p>{driver.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="side-stack">
            <article className="section-block side">
              <div className="section-head">
                <div>
                  <span className="section-kicker">Model boundary</span>
                  <h2>How to use these drivers</h2>
                </div>
              </div>
              <p className="plain-copy">{focus.scopeNote}</p>
              <ul className="plain-list">
                {focus.modelBlueprint.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="section-block side">
              <div className="section-head">
                <div>
                  <span className="section-kicker">Data readiness</span>
                  <h2>Required schema</h2>
                </div>
              </div>
              {schema ? (
                <div className="schema-list">
                  {schema.columns.map((column) => (
                    <div key={column.name} className="schema-item">
                      <strong>{column.name}</strong>
                      <span>{column.required ? "Required" : "Optional"}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted-text">No schema registered for this market.</p>
              )}
            </article>
          </aside>
        </section>

        <MarketWatchSection />
      </section>
    </section>
  );
}

function SourcesSurface(props: {
  sourcePayload: ConnectedSourcePayload | null;
  sourcesError: string | null;
}) {
  const grouped = groupRegistryByMarket();

  return (
    <section className="screen">
      <section className="content-stack">
        <section className="dual-layout">
          <article className="section-block">
            <div className="section-head">
              <div>
                <span className="section-kicker">Registry</span>
                <h2>Confirmed data routes</h2>
              </div>
            </div>
            <div className="registry-list">
              {grouped.map(({ market, items }) => (
                <div key={market.id} className="registry-group">
                  <div className="registry-group-head">
                    <strong>{market.name}</strong>
                    <span>{items.length} confirmed routes</span>
                  </div>
                  {items.map((item) => (
                    <RegistryItem key={item.id} item={item} />
                  ))}
                </div>
              ))}
            </div>
          </article>

          <aside className="side-stack">
            <article className="section-block side">
              <div className="section-head">
                <div>
                  <span className="section-kicker">Live connection</span>
                  <h2>Current official fetch state</h2>
                </div>
              </div>
              <div className="connection-list">
                {(props.sourcePayload?.cards ?? []).map((card) => (
                  <div key={card.id} className="connection-item">
                    <div>
                      <strong>{card.sourceName}</strong>
                      <p>{card.summary}</p>
                    </div>
                    <span className={`status-pill ${card.status}`}>{statusLabel(card.status)}</span>
                  </div>
                ))}
              </div>
              {props.sourcesError && <p className="warning-text">{props.sourcesError}</p>}
            </article>

            <article className="section-block side">
              <div className="section-head">
                <div>
                  <span className="section-kicker">Source discipline</span>
                  <h2>Operating rules</h2>
                </div>
              </div>
              <ul className="plain-list">
                <li>Official web flows stay labeled as web flows unless public API docs were confirmed.</li>
                <li>Commercial feeds are shown separately from free public data routes.</li>
                <li>Every number shown in the app should trace back to a visible source link.</li>
              </ul>
            </article>
          </aside>
        </section>
      </section>
    </section>
  );
}

function RegistryItem({ item }: { item: SourceRegistryItem }) {
  return (
    <div className="registry-item">
      <div className="registry-item-head">
        <strong>{item.title}</strong>
        <span className="soft-badge">{item.method}</span>
      </div>
      <p>{item.whyItMatters}</p>
      <div className="registry-meta">
        <span>{item.category}</span>
        <span>{item.appUse}</span>
      </div>
      <ul className="plain-list compact">
        {item.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      <a href={item.url} target="_blank" rel="noreferrer">
        Open official source
      </a>
    </div>
  );
}

function MarketWatchSection() {
  const groups = [
    "Official futures venue",
    "Official exchange page",
    "Official issuer page",
    "External market watch"
  ].map((category) => ({
    category,
    items: marketWatchItems.filter((item) => item.category === category)
  }));

  return (
    <section className="section-block">
      <div className="section-head">
        <div>
          <span className="section-kicker">Market watch</span>
          <h2>All-in-one external watch layer</h2>
        </div>
      </div>
      <div className="watch-groups">
        {groups.map((group) => (
          <div key={group.category} className="watch-group">
            <div className="registry-group-head">
              <strong>{group.category}</strong>
              <span>{group.items.length} links</span>
            </div>
            <div className="watch-list">
              {group.items.map((item) => (
                <a
                  key={item.id}
                  className="watch-item"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <div className="watch-item-head">
                    <strong>{item.title}</strong>
                    <span className="soft-badge">{item.role}</span>
                  </div>
                  <p>{item.note}</p>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function LabSurface(props: {
  focusMarket: MarketProfile["id"];
  sourcePayload: ConnectedSourcePayload | null;
  factorState: Record<string, number>;
  onFactorChange: (driverId: string, value: number) => void;
  onScenarioReset: () => void;
}) {
  const [mode, setMode] = useState<LabMode>("scenario");
  const [modelInputPath, setModelInputPath] = useState("");
  const [trainWindow, setTrainWindow] = useState(180);
  const [horizon, setHorizon] = useState(5);
  const [modelResult, setModelResult] = useState<WalkForwardResult | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isRunningModel, setIsRunningModel] = useState(false);
  const [csvPath, setCsvPath] = useState("");
  const [series, setSeries] = useState<ParsedSeriesPoint[]>([]);
  const [strategy, setStrategy] = useState<BacktestStrategy>("trend");
  const [feeBps, setFeeBps] = useState(4);
  const [backtestResult, setBacktestResult] = useState<BacktestRun | null>(null);
  const [backtestError, setBacktestError] = useState<string | null>(null);

  const focus = marketProfiles.find((item) => item.id === props.focusMarket)!;
  const focusCard =
    props.sourcePayload?.cards.find((item) => item.marketId === props.focusMarket) ?? null;
  const groupedDrivers = factorFamilies.map((family) => ({
    family,
    drivers: driverWeightScore(props.focusMarket, family)
  }));
  const forecast = useMemo(
    () => buildForecast(props.focusMarket, props.factorState),
    [props.focusMarket, props.factorState]
  );

  async function chooseModelFile() {
    const path = await window.desktopBridge?.pickCsvFile();
    if (path) {
      setModelInputPath(path);
      setModelError(null);
    }
  }

  async function runModel() {
    if (!window.desktopBridge?.runWalkForwardModel) {
      setModelError("Walk-forward execution is available in the packaged desktop app.");
      return;
    }
    if (!modelInputPath) {
      setModelError("Choose a CSV file first.");
      return;
    }
    setIsRunningModel(true);
    setModelError(null);
    try {
      const result = await window.desktopBridge.runWalkForwardModel({
        inputPath: modelInputPath,
        marketId: props.focusMarket,
        trainWindow,
        horizon
      });
      setModelResult(result);
    } catch (error) {
      setModelError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRunningModel(false);
    }
  }

  async function chooseBacktestFile() {
    if (!window.desktopBridge?.pickCsvFile || !window.desktopBridge.readTextFile) {
      setBacktestError("CSV loading is available in the packaged desktop app.");
      return;
    }
    const path = await window.desktopBridge.pickCsvFile();
    if (!path) {
      return;
    }
    try {
      const text = await window.desktopBridge.readTextFile(path);
      const parsed = parseCsv(text);
      setCsvPath(path);
      setSeries(parsed);
      setBacktestError(null);
      setBacktestResult(null);
    } catch (error) {
      setBacktestError(error instanceof Error ? error.message : String(error));
    }
  }

  function runBacktestLocally() {
    try {
      const result = runBacktest(series, strategy, feeBps);
      setBacktestResult(result);
      setBacktestError(null);
    } catch (error) {
      setBacktestError(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <section className="screen">
      <section className="content-stack">
        <section className="section-block">
          <div className="section-head">
            <div>
              <span className="section-kicker">Research desk</span>
              <h2>{focus.name} lab</h2>
            </div>
            <div className="lab-switch">
              {(["scenario", "model", "backtest"] as LabMode[]).map((entry) => (
                <button
                  key={entry}
                  className={`lab-tab ${mode === entry ? "active" : ""}`}
                  onClick={() => setMode(entry)}
                >
                  {entry}
                </button>
              ))}
            </div>
          </div>

          {mode === "scenario" && (
            <div className="dual-layout">
              <article className="section-block nested">
                <div className="section-head">
                  <div>
                    <span className="section-kicker">Scenario engine</span>
                    <h2>Stress the factor stack</h2>
                  </div>
                  <button className="refresh-button subtle" onClick={props.onScenarioReset}>
                    Reset
                  </button>
                </div>
                <div className="slider-groups">
                  {groupedDrivers.map(({ family, drivers }) => (
                    <div key={family.id} className="slider-group">
                      <strong>{family.label}</strong>
                      {drivers.slice(0, 4).map((driver) => (
                        <label key={driver.id} className="slider-row">
                          <div>
                            <span>{driver.variable}</span>
                            <strong>{formatNumber(props.factorState[driver.id] ?? 0)}</strong>
                          </div>
                          <input
                            type="range"
                            min="-1"
                            max="1"
                            step="0.1"
                            value={props.factorState[driver.id] ?? 0}
                            onChange={(event) =>
                              props.onFactorChange(driver.id, Number(event.target.value))
                            }
                          />
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              </article>

              <aside className="side-stack">
                <article className="section-block side accent">
                  <div className="section-head">
                    <div>
                      <span className="section-kicker">Directional read</span>
                      <h2>{forecast.direction}</h2>
                    </div>
                  </div>
                  <div className="stats-grid">
                    <div className="stat-box">
                      <span>Score</span>
                      <strong>{formatNumber(forecast.score)}</strong>
                    </div>
                    <div className="stat-box">
                      <span>Confidence</span>
                      <strong>{formatPct(forecast.confidence * 100)}</strong>
                    </div>
                  </div>
                </article>

                <article className="section-block side">
                  <div className="section-head">
                    <div>
                      <span className="section-kicker">Official context</span>
                      <h2>Current market note</h2>
                    </div>
                  </div>
                  <p>{focusCard?.summary ?? focus.stageNote}</p>
                </article>
              </aside>
            </div>
          )}

          {mode === "model" && (
            <div className="dual-layout">
              <article className="section-block nested">
                <div className="input-grid">
                  <label className="input-card">
                    <span>Input CSV</span>
                    <button className="refresh-button subtle" onClick={() => void chooseModelFile()}>
                      Choose file
                    </button>
                    <p>{modelInputPath || "No file selected"}</p>
                  </label>
                  <label className="input-card">
                    <span>Train window</span>
                    <input
                      className="text-input"
                      type="number"
                      min="60"
                      value={trainWindow}
                      onChange={(event) => setTrainWindow(Number(event.target.value))}
                    />
                  </label>
                  <label className="input-card">
                    <span>Forecast horizon</span>
                    <input
                      className="text-input"
                      type="number"
                      min="1"
                      value={horizon}
                      onChange={(event) => setHorizon(Number(event.target.value))}
                    />
                  </label>
                </div>
                <button className="refresh-button strong" onClick={() => void runModel()}>
                  {isRunningModel ? "Running..." : "Run walk-forward model"}
                </button>
                {modelError && <p className="warning-text">{modelError}</p>}
              </article>

              <aside className="side-stack">
                <article className="section-block side">
                  <div className="section-head">
                    <div>
                      <span className="section-kicker">Validation output</span>
                      <h2>Latest run</h2>
                    </div>
                  </div>
                  {modelResult ? (
                    <>
                      <div className="stats-grid">
                        <div className="stat-box">
                          <span>MAE</span>
                          <strong>{formatNumber(modelResult.summary.mae)}</strong>
                        </div>
                        <div className="stat-box">
                          <span>RMSE</span>
                          <strong>{formatNumber(modelResult.summary.rmse)}</strong>
                        </div>
                        <div className="stat-box">
                          <span>MAPE</span>
                          <strong>{formatPct(modelResult.summary.mapePct)}</strong>
                        </div>
                        <div className="stat-box">
                          <span>Direction hit</span>
                          <strong>{formatPct(modelResult.summary.directionalAccuracyPct)}</strong>
                        </div>
                      </div>
                      <div className="feature-list">
                        {modelResult.topFeatures.slice(0, 6).map((item) => (
                          <div key={item.feature} className="feature-item">
                            <span>{item.feature}</span>
                            <strong>{formatNumber(item.importance)}</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="muted-text">No model run yet.</p>
                  )}
                </article>
              </aside>
            </div>
          )}

          {mode === "backtest" && (
            <div className="dual-layout">
              <article className="section-block nested">
                <div className="input-grid">
                  <label className="input-card">
                    <span>Input CSV</span>
                    <button className="refresh-button subtle" onClick={() => void chooseBacktestFile()}>
                      Choose file
                    </button>
                    <p>{csvPath || "No file selected"}</p>
                  </label>
                  <label className="input-card">
                    <span>Strategy</span>
                    <select
                      className="text-input"
                      value={strategy}
                      onChange={(event) => setStrategy(event.target.value as BacktestStrategy)}
                    >
                      {Object.entries(strategyLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="input-card">
                    <span>Fee (bps)</span>
                    <input
                      className="text-input"
                      type="number"
                      min="0"
                      value={feeBps}
                      onChange={(event) => setFeeBps(Number(event.target.value))}
                    />
                  </label>
                </div>
                <button className="refresh-button strong" onClick={runBacktestLocally}>
                  Run backtest
                </button>
                {backtestError && <p className="warning-text">{backtestError}</p>}
              </article>

              <aside className="side-stack">
                <article className="section-block side">
                  <div className="section-head">
                    <div>
                      <span className="section-kicker">Backtest readout</span>
                      <h2>Performance summary</h2>
                    </div>
                  </div>
                  {backtestResult ? (
                    <div className="feature-list">
                      <div className="feature-item">
                        <span>Total return</span>
                        <strong>{formatPct(backtestResult.metrics.totalReturnPct)}</strong>
                      </div>
                      <div className="feature-item">
                        <span>Annualized return</span>
                        <strong>{formatPct(backtestResult.metrics.annualizedReturnPct)}</strong>
                      </div>
                      <div className="feature-item">
                        <span>Volatility</span>
                        <strong>{formatPct(backtestResult.metrics.annualizedVolPct)}</strong>
                      </div>
                      <div className="feature-item">
                        <span>Sharpe</span>
                        <strong>{formatNumber(backtestResult.metrics.sharpe)}</strong>
                      </div>
                      <div className="feature-item">
                        <span>Max drawdown</span>
                        <strong>{formatPct(backtestResult.metrics.maxDrawdownPct)}</strong>
                      </div>
                      <div className="feature-item">
                        <span>Trades</span>
                        <strong>{backtestResult.metrics.tradeCount}</strong>
                      </div>
                    </div>
                  ) : (
                    <p className="muted-text">No backtest run yet.</p>
                  )}
                  <p className="muted-text">
                    Loaded rows: {series.length > 0 ? `${series.length}` : "0"}
                  </p>
                </article>
              </aside>
            </div>
          )}
        </section>
      </section>
    </section>
  );
}

export default function App() {
  const [surface, setSurface] = useState<Surface>("today");
  const [focusMarket, setFocusMarket] = useState<MarketProfile["id"]>("eu-ets");
  const [sourcePayload, setSourcePayload] = useState<ConnectedSourcePayload | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [sourcesError, setSourcesError] = useState<string | null>(null);
  const [factorState, setFactorState] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      marketProfiles.flatMap((market) =>
        market.drivers.map((driver) => [driver.id, 0])
      )
    )
  );

  async function refreshConnectedSources() {
    if (!window.desktopBridge?.refreshConnectedSources) {
      setSourcesError("Official source refresh is available in the packaged desktop app.");
      return;
    }
    setRefreshing(true);
    setSourcesError(null);
    try {
      const payload = await window.desktopBridge.refreshConnectedSources();
      setSourcePayload(payload);
    } catch (error) {
      setSourcesError(error instanceof Error ? error.message : String(error));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refreshConnectedSources();
  }, []);

  function handleFactorChange(driverId: string, value: number) {
    setFactorState((current) => ({ ...current, [driverId]: value }));
  }

  function resetScenario() {
    const market = marketProfiles.find((item) => item.id === focusMarket)!;
    setFactorState((current) => {
      const next = { ...current };
      market.drivers.forEach((driver) => {
        next[driver.id] = 0;
      });
      return next;
    });
  }

  return (
    <div className="terminal-shell">
      <WindowChrome />
      <Header
        surface={surface}
        onSurfaceChange={setSurface}
        focusMarket={focusMarket}
        onMarketChange={setFocusMarket}
        fetchedAt={sourcePayload?.fetchedAt}
        onRefresh={refreshConnectedSources}
        refreshing={refreshing}
      />

      <main className="scroll-body">
        {surface === "today" && (
          <TodaySurface
            focusMarket={focusMarket}
            onMarketChange={setFocusMarket}
            sourcePayload={sourcePayload}
            sourcesError={sourcesError}
          />
        )}
        {surface === "drivers" && <DriversSurface focusMarket={focusMarket} />}
        {surface === "sources" && (
          <SourcesSurface sourcePayload={sourcePayload} sourcesError={sourcesError} />
        )}
        {surface === "lab" && (
          <LabSurface
            focusMarket={focusMarket}
            sourcePayload={sourcePayload}
            factorState={factorState}
            onFactorChange={handleFactorChange}
            onScenarioReset={resetScenario}
          />
        )}
      </main>
    </div>
  );
}
