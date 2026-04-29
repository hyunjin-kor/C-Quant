import type { CSSProperties } from "react";

type CommandStat = {
  label: string;
  value: string;
  detail: string;
};

type CommandHealthTile = {
  label: string;
  value: string;
};

type CommandMarketCard = {
  id: string;
  region: string;
  name: string;
  freshnessLevel: string;
  freshnessLabel: string;
  officialPrice: string;
  benchmarkSymbol: string;
  benchmarkDetail: string;
  stanceClass: string;
  stanceLabel: string;
  confidenceLabel: string;
  freshnessSummary: string;
  theme: {
    accent: string;
    surface: string;
  };
};

type PrincipleCard = {
  id: string;
  title: string;
  description: string;
};

type SupportItem = {
  id: string;
  title: string;
  detail: string;
};

type SourceRegistryCard = {
  id: string;
  method: string;
  title: string;
  summary: string;
  category: string;
  appUse: string;
  url: string;
};

type OperatingModuleCard = {
  id: string;
  kicker: string;
  title: string;
  summary: string;
  tone: string;
  status: string;
  currentBuild: string;
  nextBuild: string;
  boundary: string;
  references: string[];
};

type BenchmarkCard = {
  id: string;
  category: string;
  name: string;
  strength: string;
  differentiator: string;
  featuresToBorrow: string[];
  url: string;
};

type CommunitySignalCard = {
  id: string;
  lens: string;
  title: string;
  summary: string;
  cQuantMove: string;
  url: string;
};

type SubscriptionFeatureCard = {
  id: string;
  title: string;
  description: string;
};

type ArchitectureBenchmarkCard = {
  id: string;
  category: string;
  name: string;
  verifiedCapability: string;
  adaptForCQuant: string;
  boundaryNote: string;
  llmUse: string;
  url: string;
};

type CommandSurfaceProps = {
  selectedMarketId: string;
  heroKicker: string;
  heroTitle: string;
  theme: {
    accent: string;
    surface: string;
  };
  freshnessLevel: string;
  freshnessLabel: string;
  heroSummary: string;
  heroStats: CommandStat[];
  boundaryKicker: string;
  boundaryTitle: string;
  boundaryBody: string;
  healthTiles: CommandHealthTile[];
  verifyKicker: string;
  verifyItems: string[];
  marketCards: CommandMarketCard[];
  onSelectMarket: (marketId: string) => void;
  trustSectionKicker: string;
  trustSectionTitle: string;
  trustSectionSummary: string;
  principles: PrincipleCard[];
  supportingEvidenceTitle: string;
  supportingEvidenceItems: SupportItem[];
  breakerTitle: string;
  breakerItems: string[];
  sourceMapKicker: string;
  sourceMapTitle: string;
  sourceMapSummary: string;
  sourceCards: SourceRegistryCard[];
  onOpenUrl: (url: string) => void;
  operatingStackKicker: string;
  operatingStackTitle: string;
  operatingStackSummary: string;
  operatingModules: OperatingModuleCard[];
  commercialBenchmarkKicker: string;
  commercialBenchmarkTitle: string;
  commercialBenchmarkSummary: string;
  commercialBenchmarkCards: BenchmarkCard[];
  buyerSignalsKicker: string;
  buyerSignalsTitle: string;
  buyerSignalsSummary: string;
  buyerSignals: CommunitySignalCard[];
  subscriptionValueKicker: string;
  subscriptionValueTitle: string;
  subscriptionFeatures: SubscriptionFeatureCard[];
  deliveryStandardKicker: string;
  deliveryStandardTitle: string;
  deliveryStandards: string[];
  referencePlatformsKicker: string;
  referencePlatformsTitle: string;
  referencePlatforms: BenchmarkCard[];
  architectureKicker: string;
  architectureTitle: string;
  architectureSummary: string;
  architectureCards: ArchitectureBenchmarkCard[];
  openSourceDocLabel: string;
  referenceLabel: string;
  sourceLabel: string;
  originalLabel: string;
  officialLabel: string;
  benchmarkLabel: string;
  applyInCQuantLabel: string;
  boundaryNoteLabel: string;
  llmUseLabel: string;
  whyItMattersLabel: string;
  supportingEvidenceEmpty: string;
  currentBuildLabel: string;
  nextBuildLabel: string;
  boundaryLabel: string;
};

export function CommandSurface({
  selectedMarketId,
  heroKicker,
  heroTitle,
  theme,
  freshnessLevel,
  freshnessLabel,
  heroSummary,
  heroStats,
  boundaryKicker,
  boundaryTitle,
  boundaryBody,
  healthTiles,
  verifyKicker,
  verifyItems,
  marketCards,
  onSelectMarket,
  trustSectionKicker,
  trustSectionTitle,
  trustSectionSummary,
  principles,
  supportingEvidenceTitle,
  supportingEvidenceItems,
  breakerTitle,
  breakerItems,
  sourceMapKicker,
  sourceMapTitle,
  sourceMapSummary,
  sourceCards,
  onOpenUrl,
  operatingStackKicker,
  operatingStackTitle,
  operatingStackSummary,
  operatingModules,
  commercialBenchmarkKicker,
  commercialBenchmarkTitle,
  commercialBenchmarkSummary,
  commercialBenchmarkCards,
  buyerSignalsKicker,
  buyerSignalsTitle,
  buyerSignalsSummary,
  buyerSignals,
  subscriptionValueKicker,
  subscriptionValueTitle,
  subscriptionFeatures,
  deliveryStandardKicker,
  deliveryStandardTitle,
  deliveryStandards,
  referencePlatformsKicker,
  referencePlatformsTitle,
  referencePlatforms,
  architectureKicker,
  architectureTitle,
  architectureSummary,
  architectureCards,
  openSourceDocLabel,
  referenceLabel,
  sourceLabel,
  originalLabel,
  officialLabel,
  benchmarkLabel,
  applyInCQuantLabel,
  boundaryNoteLabel,
  llmUseLabel,
  whyItMattersLabel,
  supportingEvidenceEmpty,
  currentBuildLabel,
  nextBuildLabel,
  boundaryLabel
}: CommandSurfaceProps) {
  return (
    <>
      <section
        className="command-hero"
        style={
          {
            "--command-accent": theme.accent,
            "--command-surface": theme.surface
          } as CSSProperties
        }
      >
        <div className="command-hero-main">
          <div className="command-hero-top">
            <div>
              <span className="section-kicker">{heroKicker}</span>
              <h2>{heroTitle}</h2>
            </div>
            <span className={`freshness-badge ${freshnessLevel}`}>{freshnessLabel}</span>
          </div>

          <p className="command-hero-copy">{heroSummary}</p>

          <div className="command-hero-metrics">
            {heroStats.map((stat) => (
              <div key={stat.label} className="command-stat">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.detail}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="command-hero-side">
          <div className="command-brief-card emphasis">
            <span className="section-kicker">{boundaryKicker}</span>
            <strong>{boundaryTitle}</strong>
            <p>{boundaryBody}</p>
          </div>

          <div className="command-health-grid">
            {healthTiles.map((tile) => (
              <div key={tile.label} className="command-health-tile">
                <span>{tile.label}</span>
                <strong>{tile.value}</strong>
              </div>
            ))}
          </div>

          <div className="command-brief-card">
            <span className="section-kicker">{verifyKicker}</span>
            <ul className="plain-list">
              {verifyItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="command-market-grid">
        {marketCards.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`command-market-card ${card.id === selectedMarketId ? "active" : ""}`}
            onClick={() => onSelectMarket(card.id)}
            style={
              {
                "--market-accent": card.theme.accent,
                "--market-surface": card.theme.surface
              } as CSSProperties
            }
          >
            <div className="command-market-top">
              <div>
                <span className="section-kicker">{card.region}</span>
                <h3>{card.name}</h3>
              </div>
              <span className={`freshness-badge ${card.freshnessLevel}`}>
                {card.freshnessLabel}
              </span>
            </div>

            <div className="command-market-metrics">
              <div>
                <span>{officialLabel}</span>
                <strong>{card.officialPrice}</strong>
              </div>
              <div>
                <span>{benchmarkLabel}</span>
                <strong>{card.benchmarkSymbol}</strong>
                <small>{card.benchmarkDetail}</small>
              </div>
            </div>

            <div className="command-market-footer">
              <strong className={`stance-pill ${card.stanceClass}`}>{card.stanceLabel}</strong>
              <span>{card.confidenceLabel}</span>
              <span>{card.freshnessSummary}</span>
            </div>
          </button>
        ))}
      </section>

      <section className="command-two-up">
        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{trustSectionKicker}</span>
              <h2>{trustSectionTitle}</h2>
            </div>
            <p>{trustSectionSummary}</p>
          </div>

          <div className="principle-grid">
            {principles.map((principle) => (
              <div key={principle.id} className="principle-card">
                <span className="section-kicker">{principle.title}</span>
                <p>{principle.description}</p>
              </div>
            ))}
          </div>

          <div className="command-split-grid">
            <div className="status-card">
              <strong>{supportingEvidenceTitle}</strong>
              <ul className="plain-list">
                {supportingEvidenceItems.map((item) => (
                  <li key={item.id}>{`${item.title}: ${item.detail}`}</li>
                ))}
                {supportingEvidenceItems.length === 0 ? <li>{supportingEvidenceEmpty}</li> : null}
              </ul>
            </div>
            <div className="status-card warning">
              <strong>{breakerTitle}</strong>
              <ul className="plain-list">
                {breakerItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{sourceMapKicker}</span>
              <h2>{sourceMapTitle}</h2>
            </div>
            <p>{sourceMapSummary}</p>
          </div>

          <div className="registry-grid">
            {sourceCards.map((item) => (
              <div key={item.id} className="registry-card">
                <span className="registry-method">{item.method}</span>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
                <div className="registry-meta">
                  <span>{item.category}</span>
                  <span>{item.appUse}</span>
                </div>
                <button
                  type="button"
                  className="button ghost small"
                  onClick={() => onOpenUrl(item.url)}
                >
                  {openSourceDocLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="command-two-up">
        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{operatingStackKicker}</span>
              <h2>{operatingStackTitle}</h2>
            </div>
            <p>{operatingStackSummary}</p>
          </div>

          <div className="module-grid">
            {operatingModules.map((module) => (
              <div key={module.id} className="registry-card module-card">
                <div className="module-card-top">
                  <span className="section-kicker">{module.kicker}</span>
                  <span className={`feed-pill tone-${module.tone}`}>{module.status}</span>
                </div>
                <strong>{module.title}</strong>
                <p>{module.summary}</p>
                <div className="registry-meta">
                  {module.references.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <ul className="bullet-list compact">
                  <li>
                    <strong>{currentBuildLabel}</strong>
                    <span>{module.currentBuild}</span>
                  </li>
                  <li>
                    <strong>{nextBuildLabel}</strong>
                    <span>{module.nextBuild}</span>
                  </li>
                  <li>
                    <strong>{boundaryLabel}</strong>
                    <span>{module.boundary}</span>
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{commercialBenchmarkKicker}</span>
              <h2>{commercialBenchmarkTitle}</h2>
            </div>
            <p>{commercialBenchmarkSummary}</p>
          </div>

          <div className="registry-grid">
            {commercialBenchmarkCards.map((platform) => (
              <div key={platform.id} className="registry-card">
                <span className="registry-method">{platform.category}</span>
                <strong>{platform.name}</strong>
                <p>{platform.strength}</p>
                <ul className="bullet-list compact">
                  <li>
                    <strong>{whyItMattersLabel}</strong>
                    <span>{platform.differentiator}</span>
                  </li>
                </ul>
                <div className="registry-meta">
                  {platform.featuresToBorrow.map((feature) => (
                    <span key={feature}>{feature}</span>
                  ))}
                </div>
                <button
                  type="button"
                  className="button ghost small"
                  onClick={() => onOpenUrl(platform.url)}
                >
                  {referenceLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <span className="section-kicker">{buyerSignalsKicker}</span>
            <h2>{buyerSignalsTitle}</h2>
          </div>
          <p>{buyerSignalsSummary}</p>
        </div>

        <div className="registry-grid">
          {buyerSignals.map((signal) => (
            <div key={signal.id} className="registry-card">
              <span className="registry-method">{signal.lens}</span>
              <strong>{signal.title}</strong>
              <p>{signal.summary}</p>
              <ul className="bullet-list compact">
                <li>
                  <strong>{applyInCQuantLabel}</strong>
                  <span>{signal.cQuantMove}</span>
                </li>
              </ul>
              <button
                type="button"
                className="button ghost small"
                onClick={() => onOpenUrl(signal.url)}
              >
                {sourceLabel}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="command-three-up">
        <div className="panel">
          <div className="section-header slim">
            <div>
              <span className="section-kicker">{subscriptionValueKicker}</span>
              <h2>{subscriptionValueTitle}</h2>
            </div>
          </div>

          <ul className="bullet-list compact">
            {subscriptionFeatures.map((feature) => (
              <li key={feature.id}>
                <strong>{feature.title}</strong>
                <span>{feature.description}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <div className="section-header slim">
            <div>
              <span className="section-kicker">{deliveryStandardKicker}</span>
              <h2>{deliveryStandardTitle}</h2>
            </div>
          </div>

          <ul className="bullet-list compact">
            {deliveryStandards.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <div className="section-header slim">
            <div>
              <span className="section-kicker">{referencePlatformsKicker}</span>
              <h2>{referencePlatformsTitle}</h2>
            </div>
          </div>

          <div className="registry-grid compact">
            {referencePlatforms.map((platform) => (
              <div key={platform.id} className="registry-card compact">
                <span className="registry-method">{platform.category}</span>
                <strong>{platform.name}</strong>
                <p>{platform.differentiator}</p>
                <div className="registry-meta">
                  {platform.featuresToBorrow.slice(0, 2).map((feature) => (
                    <span key={feature}>{feature}</span>
                  ))}
                </div>
                <button
                  type="button"
                  className="button ghost small"
                  onClick={() => onOpenUrl(platform.url)}
                >
                  {referenceLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <span className="section-kicker">{architectureKicker}</span>
            <h2>{architectureTitle}</h2>
          </div>
          <p>{architectureSummary}</p>
        </div>

        <div className="registry-grid">
          {architectureCards.map((benchmark) => (
            <div key={benchmark.id} className="registry-card">
              <span className="registry-method">{benchmark.category}</span>
              <strong>{benchmark.name}</strong>
              <p>{benchmark.verifiedCapability}</p>
              <ul className="bullet-list compact">
                <li>
                  <strong>{applyInCQuantLabel}</strong>
                  <span>{benchmark.adaptForCQuant}</span>
                </li>
                <li>
                  <strong>{boundaryNoteLabel}</strong>
                  <span>{benchmark.boundaryNote}</span>
                </li>
                <li>
                  <strong>{llmUseLabel}</strong>
                  <span>{benchmark.llmUse}</span>
                </li>
              </ul>
              <button
                type="button"
                className="button ghost small"
                onClick={() => onOpenUrl(benchmark.url)}
              >
                {originalLabel}
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
