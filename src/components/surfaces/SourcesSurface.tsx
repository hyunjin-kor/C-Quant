import type { ComponentProps } from "react";
import { InputCoverageGrid } from "../InputCoverageGrid";

type SourceMetric = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  toneClass?: string;
};

type BenchmarkRow = {
  id: string;
  title: string;
  role: string;
  symbol: string;
  provider: string;
  note: string;
  delayNote: string;
  url: string;
  sourceLabel: string;
};

type ReadinessItem = {
  id: string;
  label: string;
  status: string;
  note: string;
};

type ScopeInventoryItem = {
  id: string;
  label: string;
  status: string;
  tone: string;
  summary: string;
  evidence: string[];
  gap: string;
};

type ProvenanceRow = {
  id: string;
  title: string;
  fieldMix: string;
  accessMethod: string;
  accessMethodLabel: string;
  refreshCadence: string;
  refreshCadenceLabel: string;
  sourceHints: string[];
};

type DisclosureItem = {
  id: string;
  label: string;
  status: string;
  tone: string;
  note: string;
};

type AuditItem = {
  id: string;
  label: string;
  value: string;
  detail: string;
};

type RailCard = {
  id: string;
  method: string;
  title: string;
  summary: string;
  meta: string[];
  url: string;
  buttonLabel: string;
};

type RegistryTrackCard = {
  id: string;
  registry: string;
  statusTone: string;
  statusLabel: string;
  summary: string;
  meta: string[];
  steps: Array<{
    id: string;
    label: string;
    status: string;
    note: string;
  }>;
  blockers: string[];
  url: string;
  buttonLabel: string;
};

type DossierCard = {
  id: string;
  header: string;
  region: string;
  title: string;
  summary: string;
  meta: string[];
  stages: Array<{
    id: string;
    label: string;
    status: string;
    note: string;
  }>;
  url: string;
  buttonLabel: string;
};

type RiskOverlayCard = {
  id: string;
  region: string;
  title: string;
  posture: string;
  summary: string;
  components: Array<{
    label: string;
    value: string;
    note: string;
  }>;
  watchItems: string[];
  url: string;
  buttonLabel: string;
};

type SourcesSurfaceProps = {
  officialKicker: string;
  officialTitle: string;
  officialSummary: string;
  officialMetrics: SourceMetric[];
  officialNotes: string[];
  officialUrl?: string;
  officialButtonLabel: string;
  onOpenUrl: (url: string) => void;
  benchmarksKicker: string;
  benchmarksTitle: string;
  benchmarkRows: BenchmarkRow[];
  accountingKicker: string;
  accountingTitle: string;
  accountingSummary: string;
  accountingMetrics: SourceMetric[];
  readinessKicker: string;
  readinessTitle: string;
  readinessItems: ReadinessItem[];
  scopeKicker: string;
  scopeTitle: string;
  scopeSummary: string;
  scopeInventory: ScopeInventoryItem[];
  provenanceKicker: string;
  provenanceTitle: string;
  provenanceRows: ProvenanceRow[];
  disclosureKicker: string;
  disclosureTitle: string;
  disclosureItems: DisclosureItem[];
  auditKicker: string;
  auditTitle: string;
  auditItems: AuditItem[];
  railsKicker: string;
  railsTitle: string;
  railsSummary: string;
  railCards: RailCard[];
  registryKicker: string;
  registryTitle: string;
  registrySummary: string;
  registryCards: RegistryTrackCard[];
  dossiersKicker: string;
  dossiersTitle: string;
  dossiersSummary: string;
  dossierCards: DossierCard[];
  riskKicker: string;
  riskTitle: string;
  riskSummary: string;
  riskCards: RiskOverlayCard[];
  coverageKicker: string;
  coverageTitle: string;
  coverageSummary: string;
  coverageMetaLine: string;
  coverageBlocks: ComponentProps<typeof InputCoverageGrid>["blocks"];
  coverageLocale: ComponentProps<typeof InputCoverageGrid>["locale"];
};

export function SourcesSurface({
  officialKicker,
  officialTitle,
  officialSummary,
  officialMetrics,
  officialNotes,
  officialUrl,
  officialButtonLabel,
  onOpenUrl,
  benchmarksKicker,
  benchmarksTitle,
  benchmarkRows,
  accountingKicker,
  accountingTitle,
  accountingSummary,
  accountingMetrics,
  readinessKicker,
  readinessTitle,
  readinessItems,
  scopeKicker,
  scopeTitle,
  scopeSummary,
  scopeInventory,
  provenanceKicker,
  provenanceTitle,
  provenanceRows,
  disclosureKicker,
  disclosureTitle,
  disclosureItems,
  auditKicker,
  auditTitle,
  auditItems,
  railsKicker,
  railsTitle,
  railsSummary,
  railCards,
  registryKicker,
  registryTitle,
  registrySummary,
  registryCards,
  dossiersKicker,
  dossiersTitle,
  dossiersSummary,
  dossierCards,
  riskKicker,
  riskTitle,
  riskSummary,
  riskCards,
  coverageKicker,
  coverageTitle,
  coverageSummary,
  coverageMetaLine,
  coverageBlocks,
  coverageLocale
}: SourcesSurfaceProps) {
  return (
    <>
      <section className="panel">
        <div className="section-header">
          <div>
            <span className="section-kicker">{officialKicker}</span>
            <h2>{officialTitle}</h2>
          </div>
          <p>{officialSummary}</p>
        </div>

        <div className="source-grid">
          {officialMetrics.map((item) => (
            <div key={item.id} className="source-block">
              <span>{item.label}</span>
              <strong className={item.toneClass}>{item.value}</strong>
              {item.detail ? <small className="meta-line">{item.detail}</small> : null}
            </div>
          ))}
        </div>

        <ul className="bullet-list">
          {officialNotes.map((note) => (
            <li key={note}>
              <span>{note}</span>
            </li>
          ))}
        </ul>

        {officialUrl ? (
          <button type="button" className="button ghost" onClick={() => onOpenUrl(officialUrl)}>
            {officialButtonLabel}
          </button>
        ) : null}
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <span className="section-kicker">{benchmarksKicker}</span>
            <h2>{benchmarksTitle}</h2>
          </div>
        </div>

        <div className="source-list">
          {benchmarkRows.map((quote) => (
            <div key={quote.id} className="source-row">
              <div>
                <strong>{quote.title}</strong>
                <span>{quote.role}</span>
              </div>
              <div>
                <strong>{quote.symbol}</strong>
                <span>{quote.provider}</span>
              </div>
              <div>
                <strong>{quote.note}</strong>
                <span>{quote.delayNote}</span>
              </div>
              <button
                type="button"
                className="button ghost small"
                onClick={() => onOpenUrl(quote.url)}
              >
                {quote.sourceLabel}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="command-two-up">
        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{accountingKicker}</span>
              <h2>{accountingTitle}</h2>
            </div>
            <p>{accountingSummary}</p>
          </div>

          <div className="source-grid">
            {accountingMetrics.map((item) => (
              <div key={item.id} className="source-block">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                {item.detail ? <small className="meta-line">{item.detail}</small> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{readinessKicker}</span>
              <h2>{readinessTitle}</h2>
            </div>
          </div>

          <ul className="bullet-list compact">
            {readinessItems.map((item) => (
              <li key={item.id}>
                <strong>{`${item.label} · ${item.status}`}</strong>
                <span>{item.note}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="command-two-up">
        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{scopeKicker}</span>
              <h2>{scopeTitle}</h2>
            </div>
            <p>{scopeSummary}</p>
          </div>

          <div className="inventory-grid">
            {scopeInventory.map((item) => (
              <article key={item.id} className="inventory-card">
                <div className="module-card-top">
                  <div>
                    <span className={`inventory-status tone-${item.tone}`}>{item.status}</span>
                    <h3>{item.label}</h3>
                  </div>
                </div>
                <p className="inventory-summary">{item.summary}</p>
                <div className="inventory-evidence">
                  {item.evidence.map((evidence) => (
                    <span key={evidence}>{evidence}</span>
                  ))}
                </div>
                <p className="field-note">{item.gap}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{provenanceKicker}</span>
              <h2>{provenanceTitle}</h2>
            </div>
          </div>

          <div className="source-list">
            {provenanceRows.map((item) => (
              <div key={item.id} className="source-row provenance-row">
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.fieldMix}</span>
                </div>
                <div>
                  <strong>{item.accessMethod}</strong>
                  <span>{item.accessMethodLabel}</span>
                </div>
                <div>
                  <strong>{item.refreshCadence}</strong>
                  <span>{item.refreshCadenceLabel}</span>
                </div>
                <div className="inventory-evidence compact">
                  {item.sourceHints.map((hint) => (
                    <span key={hint}>{hint}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="command-two-up">
        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{disclosureKicker}</span>
              <h2>{disclosureTitle}</h2>
            </div>
          </div>

          <div className="registry-grid compact">
            {disclosureItems.map((item) => (
              <div key={item.id} className="registry-card compact">
                <div className="module-card-top">
                  <strong>{item.label}</strong>
                  <span className={`inventory-status tone-${item.tone}`}>{item.status}</span>
                </div>
                <p>{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{auditKicker}</span>
              <h2>{auditTitle}</h2>
            </div>
          </div>

          <div className="audit-grid">
            {auditItems.map((item) => (
              <div key={item.id} className="audit-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small className="meta-line">{item.detail}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="command-two-up">
        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{railsKicker}</span>
              <h2>{railsTitle}</h2>
            </div>
            <p>{railsSummary}</p>
          </div>

          <div className="registry-grid">
            {railCards.map((item) => (
              <div key={item.id} className="registry-card">
                <span className="registry-method">{item.method}</span>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
                <div className="registry-meta">
                  {item.meta.map((meta) => (
                    <span key={meta}>{meta}</span>
                  ))}
                </div>
                <button
                  type="button"
                  className="button ghost small"
                  onClick={() => onOpenUrl(item.url)}
                >
                  {item.buttonLabel}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{registryKicker}</span>
              <h2>{registryTitle}</h2>
            </div>
            <p>{registrySummary}</p>
          </div>

          <div className="registry-grid compact">
            {registryCards.map((track) => (
              <div key={track.id} className="registry-card">
                <div className="module-card-top">
                  <span className="section-kicker">{track.registry}</span>
                  <span className={`feed-pill tone-${track.statusTone}`}>{track.statusLabel}</span>
                </div>
                <p>{track.summary}</p>
                <div className="registry-meta">
                  {track.meta.map((meta) => (
                    <span key={meta}>{meta}</span>
                  ))}
                </div>
                <ul className="bullet-list compact">
                  {track.steps.map((step) => (
                    <li key={step.id}>
                      <strong>{`${step.label} · ${step.status}`}</strong>
                      <span>{step.note}</span>
                    </li>
                  ))}
                </ul>
                <ul className="plain-list">
                  {track.blockers.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="button ghost small"
                  onClick={() => onOpenUrl(track.url)}
                >
                  {track.buttonLabel}
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
              <span className="section-kicker">{dossiersKicker}</span>
              <h2>{dossiersTitle}</h2>
            </div>
            <p>{dossiersSummary}</p>
          </div>

          <div className="registry-grid compact">
            {dossierCards.map((dossier) => (
              <div key={dossier.id} className="registry-card">
                <div className="module-card-top">
                  <span className="registry-method">{dossier.header}</span>
                  <span className="feed-pill tone-neutral">{dossier.region}</span>
                </div>
                <strong>{dossier.title}</strong>
                <p>{dossier.summary}</p>
                <div className="registry-meta">
                  {dossier.meta.map((meta) => (
                    <span key={meta}>{meta}</span>
                  ))}
                </div>
                <ul className="bullet-list compact">
                  {dossier.stages.map((stage) => (
                    <li key={stage.id}>
                      <strong>{`${stage.label} · ${stage.status}`}</strong>
                      <span>{stage.note}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="button ghost small"
                  onClick={() => onOpenUrl(dossier.url)}
                >
                  {dossier.buttonLabel}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{riskKicker}</span>
              <h2>{riskTitle}</h2>
            </div>
            <p>{riskSummary}</p>
          </div>

          <div className="registry-grid compact">
            {riskCards.map((overlay) => (
              <div key={overlay.id} className="registry-card">
                <div className="module-card-top">
                  <span className="registry-method">{overlay.region}</span>
                  <span className="feed-pill tone-neutral">{overlay.title}</span>
                </div>
                <strong>{overlay.posture}</strong>
                <p>{overlay.summary}</p>
                <ul className="bullet-list compact">
                  {overlay.components.map((component) => (
                    <li key={component.label}>
                      <strong>{`${component.label} · ${component.value}`}</strong>
                      <span>{component.note}</span>
                    </li>
                  ))}
                </ul>
                <ul className="plain-list">
                  {overlay.watchItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="button ghost small"
                  onClick={() => onOpenUrl(overlay.url)}
                >
                  {overlay.buttonLabel}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <span className="section-kicker">{coverageKicker}</span>
            <h2>{coverageTitle}</h2>
          </div>
          <p>{coverageSummary}</p>
        </div>

        <p className="meta-line">{coverageMetaLine}</p>
        <InputCoverageGrid blocks={coverageBlocks} locale={coverageLocale} />
      </section>
    </>
  );
}
