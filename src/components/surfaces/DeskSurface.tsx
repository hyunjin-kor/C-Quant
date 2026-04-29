import { ColumnChart, DonutMeter, PressureBar, WaterfallChart, type ChartPoint } from "../charts";
import { InteractiveMarketChart } from "../InteractiveMarketChart";

type InteractiveSeries = {
  id: string;
  label: string;
  color: string;
  points: ChartPoint[];
  variant?: "area" | "line" | "candles" | "histogram";
  lineStyle?: "solid" | "dashed";
  valueFormatter?: (value: number) => string;
};

type BoardRow = {
  id: string;
  active: boolean;
  freshnessLevel: string;
  marketName: string;
  sourceName: string;
  officialPrice: string;
  officialChange: string;
  freshnessLabel: string;
  freshnessSummary: string;
  benchmarkTitle: string;
  benchmarkValue: string;
  gapLabel: string;
  correlationLabel: string;
  directionMatchLabel: string;
  stanceClass: string;
  stanceLabel: string;
  confidenceLabel: string;
  title: string;
};

type MetricTile = {
  label: string;
  value: string;
};

type ChipOption = {
  id: string;
  label: string;
  active: boolean;
};

type NoteItem = {
  title: string;
  detail: string;
};

type SupportItem = {
  title: string;
  detail: string;
};

type DeskSurfaceProps = {
  boardKicker: string;
  boardTitle: string;
  boardSummary: string;
  marketColumnLabel: string;
  officialColumnLabel: string;
  liveTapeColumnLabel: string;
  gapColumnLabel: string;
  correlationColumnLabel: string;
  stanceColumnLabel: string;
  vsOfficialLabel: string;
  boardRows: BoardRow[];
  onSelectMarket: (marketId: string) => void;
  officialKicker: string;
  officialTitle: string;
  officialSubtitle: string;
  officialMetrics: MetricTile[];
  officialSeries: InteractiveSeries[];
  officialChartTitle: string;
  officialChartSubtitle: string;
  officialGuideLabel: string;
  officialEmptyTitle: string;
  officialEmptySubtitle: string;
  officialVolumeTitle: string;
  officialVolumeSeries: ChartPoint[];
  officialVolumeEmptyTitle: string;
  officialVolumeEmptySubtitle: string;
  accentColor: string;
  locale: string;
  liveKicker: string;
  liveTitle: string;
  liveSubtitle: string;
  benchmarkOptions: ChipOption[];
  onSelectBenchmark: (benchmarkId: string) => void;
  rangeOptions: ChipOption[];
  onSelectRange: (rangeId: string) => void;
  liveMetrics: MetricTile[];
  liveStatusClass: string;
  liveStatusLabel: string;
  liveProvider: string;
  liveExchange: string;
  liveAsOf: string;
  latestLiveStats: MetricTile[];
  liveSeries: InteractiveSeries[];
  liveChartTitle: string;
  liveChartSubtitle: string;
  liveGuideLabel: string;
  liveEmptyTitle: string;
  liveEmptySubtitle: string;
  liveNotes: NoteItem[];
  relativeKicker: string;
  relativeTitle: string;
  relativeSummary: string;
  relativeSeries: InteractiveSeries[];
  relativeGuideLabel: string;
  relativeEmptyTitle: string;
  relativeEmptySubtitle: string;
  postureKicker: string;
  postureTitle: string;
  postureScore: number;
  reduceLabel: string;
  holdLabel: string;
  buyLabel: string;
  confidenceLabel: string;
  confidenceValue: number;
  confidenceSummary: string;
  scoreBuildKicker: string;
  scoreBuildTitle: string;
  waterfallItems: Array<{ label: string; value: number }>;
  memoKicker: string;
  memoTitle: string;
  supportItems: SupportItem[];
  positiveColor: string;
  negativeColor: string;
};

export function DeskSurface({
  boardKicker,
  boardTitle,
  boardSummary,
  marketColumnLabel,
  officialColumnLabel,
  liveTapeColumnLabel,
  gapColumnLabel,
  correlationColumnLabel,
  stanceColumnLabel,
  vsOfficialLabel,
  boardRows,
  onSelectMarket,
  officialKicker,
  officialTitle,
  officialSubtitle,
  officialMetrics,
  officialSeries,
  officialChartTitle,
  officialChartSubtitle,
  officialGuideLabel,
  officialEmptyTitle,
  officialEmptySubtitle,
  officialVolumeTitle,
  officialVolumeSeries,
  officialVolumeEmptyTitle,
  officialVolumeEmptySubtitle,
  accentColor,
  locale,
  liveKicker,
  liveTitle,
  liveSubtitle,
  benchmarkOptions,
  onSelectBenchmark,
  rangeOptions,
  onSelectRange,
  liveMetrics,
  liveStatusClass,
  liveStatusLabel,
  liveProvider,
  liveExchange,
  liveAsOf,
  latestLiveStats,
  liveSeries,
  liveChartTitle,
  liveChartSubtitle,
  liveGuideLabel,
  liveEmptyTitle,
  liveEmptySubtitle,
  liveNotes,
  relativeKicker,
  relativeTitle,
  relativeSummary,
  relativeSeries,
  relativeGuideLabel,
  relativeEmptyTitle,
  relativeEmptySubtitle,
  postureKicker,
  postureTitle,
  postureScore,
  reduceLabel,
  holdLabel,
  buyLabel,
  confidenceLabel,
  confidenceValue,
  confidenceSummary,
  scoreBuildKicker,
  scoreBuildTitle,
  waterfallItems,
  memoKicker,
  memoTitle,
  supportItems,
  positiveColor,
  negativeColor
}: DeskSurfaceProps) {
  return (
    <>
      <section className="panel">
        <div className="section-header">
          <div>
            <span className="section-kicker">{boardKicker}</span>
            <h2>{boardTitle}</h2>
          </div>
          <p>{boardSummary}</p>
        </div>

        <div className="board-table">
          <div className="board-head">
            <span>{marketColumnLabel}</span>
            <span>{officialColumnLabel}</span>
            <span>{liveTapeColumnLabel}</span>
            <span>{gapColumnLabel}</span>
            <span>{correlationColumnLabel}</span>
            <span>{stanceColumnLabel}</span>
          </div>

          {boardRows.map((row) => (
            <button
              key={row.id}
              type="button"
              className={`board-row ${row.active ? "active" : ""} ${
                row.freshnessLevel === "stale"
                  ? "stale-source"
                  : row.freshnessLevel === "watch"
                    ? "watch-source"
                    : ""
              }`}
              onClick={() => onSelectMarket(row.id)}
              title={row.title}
            >
              <div className="board-cell market">
                <strong>{row.marketName}</strong>
                <span>{row.sourceName}</span>
              </div>
              <div className="board-cell">
                <strong>{row.officialPrice}</strong>
                <span>{row.officialChange}</span>
                <div className="board-meta-row">
                  <span className={`freshness-badge ${row.freshnessLevel}`}>
                    {row.freshnessLabel}
                  </span>
                  <span className="board-inline-meta">{row.freshnessSummary}</span>
                </div>
              </div>
              <div className="board-cell">
                <strong>{row.benchmarkTitle}</strong>
                <span>{row.benchmarkValue}</span>
              </div>
              <div className="board-cell">
                <strong>{row.gapLabel}</strong>
                <span>{vsOfficialLabel}</span>
              </div>
              <div className="board-cell">
                <strong>{row.correlationLabel}</strong>
                <span>{row.directionMatchLabel}</span>
              </div>
              <div className="board-cell stance">
                <strong className={`stance-pill ${row.stanceClass}`}>{row.stanceLabel}</strong>
                <span>{row.confidenceLabel}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="desk-two-up">
        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{officialKicker}</span>
              <h2>{officialTitle}</h2>
            </div>
            <p>{officialSubtitle}</p>
          </div>

          <div className="metric-strip">
            {officialMetrics.map((metric) => (
              <div key={metric.label} className="metric-tile">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>

          <InteractiveMarketChart
            series={officialSeries}
            title={officialChartTitle}
            subtitle={officialChartSubtitle}
            locale={locale}
            height={320}
            guideLabel={officialGuideLabel}
            emptyTitle={officialEmptyTitle}
            emptySubtitle={officialEmptySubtitle}
          />

          <div className="subsection">
            <div className="subsection-head">
              <strong>{officialVolumeTitle}</strong>
            </div>
            {officialVolumeSeries.length > 0 ? (
              <ColumnChart points={officialVolumeSeries} color={accentColor} />
            ) : (
              <div className="status-card">
                <strong>{officialVolumeEmptyTitle}</strong>
                <p>{officialVolumeEmptySubtitle}</p>
              </div>
            )}
          </div>
        </div>

        <div className="panel">
          <div className="section-header">
            <div>
              <span className="section-kicker">{liveKicker}</span>
              <h2>{liveTitle}</h2>
            </div>
            <p>{liveSubtitle}</p>
          </div>

          <div className="control-row">
            <div className="chip-group">
              {benchmarkOptions.map((quote) => (
                <button
                  key={quote.id}
                  type="button"
                  className={`chip ${quote.active ? "active" : ""}`}
                  onClick={() => onSelectBenchmark(quote.id)}
                >
                  {quote.label}
                </button>
              ))}
            </div>
            <div className="chip-group compact">
              {rangeOptions.map((range) => (
                <button
                  key={range.id}
                  type="button"
                  className={`chip ${range.active ? "active" : ""}`}
                  onClick={() => onSelectRange(range.id)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div className="metric-strip">
            {liveMetrics.map((metric) => (
              <div key={metric.label} className="metric-tile">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>

          <div className="feed-inline">
            <span className={`feed-pill ${liveStatusClass}`}>{liveStatusLabel}</span>
            <span>{liveProvider}</span>
            <span>{liveExchange}</span>
            <span>{liveAsOf}</span>
          </div>

          {latestLiveStats.length > 0 ? (
            <div className="chart-market-stats">
              {latestLiveStats.map((stat) => (
                <div key={stat.label} className="chart-market-stat">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          ) : null}

          <InteractiveMarketChart
            series={liveSeries}
            title={liveChartTitle}
            subtitle={liveChartSubtitle}
            locale={locale}
            height={340}
            tone="dark"
            guideLabel={liveGuideLabel}
            emptyTitle={liveEmptyTitle}
            emptySubtitle={liveEmptySubtitle}
          />

          <div className="note-list">
            {liveNotes.map((item) => (
              <div key={item.title} className="note-item">
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <span className="section-kicker">{relativeKicker}</span>
            <h2>{relativeTitle}</h2>
          </div>
          <p>{relativeSummary}</p>
        </div>

        <InteractiveMarketChart
          series={relativeSeries}
          locale={locale}
          height={360}
          guideLabel={relativeGuideLabel}
          emptyTitle={relativeEmptyTitle}
          emptySubtitle={relativeEmptySubtitle}
        />
      </section>

      <section className="desk-three-up">
        <div className="panel">
          <div className="section-header slim">
            <div>
              <span className="section-kicker">{postureKicker}</span>
              <h2>{postureTitle}</h2>
            </div>
          </div>
          <PressureBar
            value={postureScore}
            negativeLabel={reduceLabel}
            neutralLabel={holdLabel}
            positiveLabel={buyLabel}
          />
          <DonutMeter
            value={confidenceValue}
            label={confidenceLabel}
            subLabel={confidenceSummary}
            color={accentColor}
          />
        </div>

        <div className="panel">
          <div className="section-header slim">
            <div>
              <span className="section-kicker">{scoreBuildKicker}</span>
              <h2>{scoreBuildTitle}</h2>
            </div>
          </div>
          <WaterfallChart
            items={waterfallItems}
            positiveColor={positiveColor}
            negativeColor={negativeColor}
          />
        </div>

        <div className="panel">
          <div className="section-header slim">
            <div>
              <span className="section-kicker">{memoKicker}</span>
              <h2>{memoTitle}</h2>
            </div>
          </div>
          <ul className="bullet-list">
            {supportItems.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
