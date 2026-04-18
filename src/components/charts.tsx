import { useMemo, useState, type PointerEvent } from "react";

type ValueFormatter = (value: number) => string;

export type ChartPoint = {
  label: string;
  value: number;
  volume?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
};

export type MultiLinePoint = {
  label: string;
  values: Record<string, number | null | undefined>;
};

export type MultiLineSeries = {
  id: string;
  label: string;
  color: string;
};

export type HeatmapRow = {
  id: string;
  label: string;
  values: number[];
};

export type WaterfallItem = {
  label: string;
  value: number;
};

const WIDTH = 100;
const HEIGHT = 100;
const PADDING = 8;
const DEFAULT_LOCALE = typeof navigator === "undefined" ? "en-US" : navigator.language;

type PositionedPoint = ChartPoint & {
  index: number;
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getValueExtent(values: number[]) {
  if (values.length === 0) {
    return {
      min: 0,
      max: 1,
      range: 1
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) {
    const padding = Math.abs(min) > 0 ? Math.abs(min) * 0.04 : 1;
    return {
      min: min - padding,
      max: max + padding,
      range: padding * 2
    };
  }

  const padding = (max - min) * 0.08;
  return {
    min: min - padding,
    max: max + padding,
    range: max - min + padding * 2
  };
}

function buildPointPath(points: ChartPoint[], width: number, height: number) {
  if (points.length === 0) {
    return "";
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const innerWidth = width - PADDING * 2;
  const innerHeight = height - PADDING * 2;
  const range = max - min || 1;

  return points
    .map((point, index) => {
      const x =
        PADDING +
        (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
      const y = PADDING + ((max - point.value) / range) * innerHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(points: ChartPoint[], width: number, height: number) {
  if (points.length === 0) {
    return "";
  }

  const path = buildPointPath(points, width, height);
  const innerWidth = width - PADDING * 2;
  const baseline = height - PADDING;
  const endX = PADDING + innerWidth;
  return `${path} L ${endX.toFixed(2)} ${baseline.toFixed(2)} L ${PADDING} ${baseline.toFixed(2)} Z`;
}

function buildPlottedPoints(
  points: Array<ChartPoint & { index?: number }>,
  width: number,
  height: number,
  minValue: number,
  maxValue: number
): PositionedPoint[] {
  const innerWidth = width - PADDING * 2;
  const innerHeight = height - PADDING * 2;
  const range = maxValue - minValue || 1;

  return points.map((point, index) => {
    const x =
      PADDING +
      (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
    const y = PADDING + ((maxValue - point.value) / range) * innerHeight;

    return {
      ...point,
      index: typeof point.index === "number" ? point.index : index,
      x,
      y
    };
  });
}

function buildPathFromPlotted(points: PositionedPoint[]) {
  if (points.length === 0) {
    return "";
  }

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

function buildAreaPathFromPlotted(points: PositionedPoint[], width: number, height: number) {
  if (points.length === 0) {
    return "";
  }

  const path = buildPathFromPlotted(points);
  const baseline = height - PADDING;
  const lastPoint = points[points.length - 1];
  return `${path} L ${lastPoint.x.toFixed(2)} ${baseline.toFixed(2)} L ${points[0].x.toFixed(
    2
  )} ${baseline.toFixed(2)} Z`;
}

function resolvePointIndexFromPointer(
  event: PointerEvent<HTMLDivElement>,
  pointsLength: number
) {
  if (pointsLength <= 1) {
    return 0;
  }

  const bounds = event.currentTarget.getBoundingClientRect();
  const relativeX = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
  return Math.round(relativeX * (pointsLength - 1));
}

function buildBars(points: ChartPoint[], height: number) {
  const max = Math.max(...points.map((point) => point.value), 1);
  return points.map((point) => ({
    ...point,
    scaled: clamp(point.value / max, 0, 1) * height
  }));
}

export function Sparkline({
  points,
  color,
  fill = false
}: {
  points: ChartPoint[];
  color: string;
  fill?: boolean;
}) {
  if (points.length === 0) {
    return <div className="chart-empty" />;
  }

  return (
    <svg className="sparkline" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
      {fill ? <path d={buildAreaPath(points, WIDTH, HEIGHT)} fill={`${color}22`} /> : null}
      <path
        d={buildPointPath(points, WIDTH, HEIGHT)}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatTrendDateLabel(locale: string, label: string) {
  const parsed = new Date(label);
  if (Number.isNaN(parsed.getTime())) {
    return label;
  }

  const hasTime = label.includes("T");
  return new Intl.DateTimeFormat(locale, {
    month: "numeric",
    day: "numeric",
    ...(hasTime
      ? {
          hour: "numeric",
          minute: "2-digit"
        }
      : {})
  }).format(parsed);
}

function formatChartValue(valueFormatter: ValueFormatter | undefined, value: number) {
  return valueFormatter ? valueFormatter(value) : value.toFixed(2);
}

export function MiniTrendChart({
  points,
  color,
  locale = DEFAULT_LOCALE,
  valueFormatter,
  lowLabel,
  highLabel,
  emptyTitle,
  emptySubtitle
}: {
  points: ChartPoint[];
  color: string;
  locale?: string;
  valueFormatter?: ValueFormatter;
  lowLabel: string;
  highLabel: string;
  emptyTitle: string;
  emptySubtitle: string;
}) {
  if (points.length === 0) {
    return (
      <div className="mini-trend-card empty">
        <strong>{emptyTitle}</strong>
        <span>{emptySubtitle}</span>
      </div>
    );
  }

  const first = points[0];
  const last = points[points.length - 1];
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const changePct = first.value === 0 ? 0 : ((last.value - first.value) / Math.abs(first.value)) * 100;
  const tone =
    changePct > 0.05 ? "positive" : changePct < -0.05 ? "negative" : "neutral";
  const formatValue = valueFormatter ?? ((value: number) => value.toFixed(2));

  return (
    <div className="mini-trend-card">
      <div className="mini-trend-top">
        <span>
          {formatTrendDateLabel(locale, first.label)} - {formatTrendDateLabel(locale, last.label)}
        </span>
        <strong className={tone}>
          {changePct > 0 ? "+" : ""}
          {changePct.toFixed(1)}%
        </strong>
      </div>
      <div className="mini-trend-chart">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
          <line x1={PADDING} x2={WIDTH - PADDING} y1={24} y2={24} className="mini-trend-guide" />
          <line x1={PADDING} x2={WIDTH - PADDING} y1={50} y2={50} className="mini-trend-guide" />
          <line x1={PADDING} x2={WIDTH - PADDING} y1={76} y2={76} className="mini-trend-guide" />
          <path d={buildAreaPath(points, WIDTH, HEIGHT)} fill={`${color}16`} />
          <path
            d={buildPointPath(points, WIDTH, HEIGHT)}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx={WIDTH - PADDING}
            cy={
              PADDING +
              ((Math.max(...values) - last.value) / (Math.max(...values) - Math.min(...values) || 1)) *
                (HEIGHT - PADDING * 2)
            }
            r="3.8"
            fill={color}
          />
        </svg>
      </div>
      <div className="mini-trend-foot">
        <span>{lowLabel} {formatValue(min)}</span>
        <span>{highLabel} {formatValue(max)}</span>
      </div>
    </div>
  );
}

export function LineChart({
  points,
  color,
  valueFormatter,
  height = 280,
  title,
  subtitle,
  locale = DEFAULT_LOCALE
}: {
  points: ChartPoint[];
  color: string;
  valueFormatter?: ValueFormatter;
  height?: number;
  title?: string;
  subtitle?: string;
  locale?: string;
}) {
  const values = points.map((point) => point.value);
  const rawMin = values.length ? Math.min(...values) : 0;
  const rawMax = values.length ? Math.max(...values) : 1;
  const extent = useMemo(() => getValueExtent(values), [values]);
  const plottedPoints = useMemo(
    () => buildPlottedPoints(points, WIDTH, HEIGHT, extent.min, extent.max),
    [extent.max, extent.min, points]
  );
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const first = points[0];
  const last = points[points.length - 1];
  const activePoint =
    plottedPoints[hoveredIndex ?? Math.max(plottedPoints.length - 1, 0)] ?? null;

  if (points.length === 0) {
    return (
      <div className="chart-panel">
        {(title || subtitle) && (
          <div className="chart-meta">
            {title ? <strong>{title}</strong> : null}
            {subtitle ? <span>{subtitle}</span> : null}
          </div>
        )}
        <div className="chart-empty-state">No chart data</div>
      </div>
    );
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    setHoveredIndex(resolvePointIndexFromPointer(event, plottedPoints.length));
  };

  return (
    <div className="chart-panel">
      {(title || subtitle) && (
        <div className="chart-meta">
          {title ? <strong>{title}</strong> : null}
          {subtitle ? <span>{subtitle}</span> : null}
        </div>
      )}
      <div
        className="line-chart-shell interactive"
        style={{ height }}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
        onPointerLeave={() => setHoveredIndex(null)}
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
          <line x1={PADDING} x2={WIDTH - PADDING} y1={22} y2={22} className="chart-guide-line" />
          <line x1={PADDING} x2={WIDTH - PADDING} y1={50} y2={50} className="chart-guide-line" />
          <line x1={PADDING} x2={WIDTH - PADDING} y1={78} y2={78} className="chart-guide-line" />
          <path d={buildAreaPathFromPlotted(plottedPoints, WIDTH, HEIGHT)} fill={`${color}16`} />
          <path
            d={buildPathFromPlotted(plottedPoints)}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {activePoint ? (
            <>
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={PADDING}
                y2={HEIGHT - PADDING}
                className="chart-cursor-line"
              />
              <circle cx={activePoint.x} cy={activePoint.y} r="4.2" fill={color} />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="7.5"
                fill={`${color}18`}
                className="chart-cursor-ring"
              />
            </>
          ) : null}
        </svg>
        <div className="line-chart-axis">
          <span>{formatChartValue(valueFormatter, rawMax)}</span>
          <span>{formatChartValue(valueFormatter, rawMin)}</span>
        </div>
        {activePoint ? (
          <div
            className={`chart-tooltip ${
              activePoint.x / WIDTH > 0.72 ? "is-left" : ""
            }`}
            style={{
              left: `${clamp((activePoint.x / WIDTH) * 100, 10, 90)}%`,
              top: `${clamp((activePoint.y / HEIGHT) * 100, 18, 82)}%`
            }}
          >
            <strong>{formatChartValue(valueFormatter, activePoint.value)}</strong>
            <span>{formatTrendDateLabel(locale, activePoint.label)}</span>
          </div>
        ) : null}
      </div>
      <div className="chart-footnote">
        <span>{first ? formatTrendDateLabel(locale, first.label) : ""}</span>
        <span>{last ? formatTrendDateLabel(locale, last.label) : ""}</span>
      </div>
    </div>
  );
}

export function MultiLineChart({
  points,
  series,
  height = 260,
  valueFormatter,
  locale = "en-US"
}: {
  points: MultiLinePoint[];
  series: MultiLineSeries[];
  height?: number;
  valueFormatter?: ValueFormatter;
  locale?: string;
}) {
  const flattened = points.flatMap((point) =>
    series
      .map((item) => point.values[item.id])
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  );
  const rawMin = flattened.length ? Math.min(...flattened) : 0;
  const rawMax = flattened.length ? Math.max(...flattened) : 1;
  const extent = useMemo(() => getValueExtent(flattened), [flattened]);
  const plottedBySeries = useMemo(() => {
    return Object.fromEntries(
      series.map((item) => {
        const seriesPoints = points
          .map((point) => point.values[item.id])
          .map((value, index) => {
            if (typeof value !== "number" || !Number.isFinite(value)) {
              return null;
            }
            return {
              label: points[index]?.label ?? "",
              value,
              index
            } satisfies ChartPoint & { index: number };
          })
          .filter((point): point is ChartPoint & { index: number } => Boolean(point));

        return [
          item.id,
          buildPlottedPoints(seriesPoints, WIDTH, HEIGHT, extent.min, extent.max)
        ];
      })
    ) as Record<string, PositionedPoint[]>;
  }, [extent.max, extent.min, points, series]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const activeIndex = hoveredIndex ?? Math.max(points.length - 1, 0);
  const activeLabel = points[activeIndex]?.label ?? "";
  const activeSeriesPoints = series
    .map((item) => {
      const value = points[activeIndex]?.values[item.id];
      const plottedPoint = plottedBySeries[item.id]?.find((point) => point.index === activeIndex) ?? null;

      if (typeof value !== "number" || !Number.isFinite(value) || !plottedPoint) {
        return null;
      }

      return {
        series: item,
        value,
        point: plottedPoint
      };
    })
    .filter(Boolean) as Array<{
    series: MultiLineSeries;
    value: number;
    point: PositionedPoint;
  }>;

  if (points.length === 0 || flattened.length === 0) {
    return <div className="chart-empty-state">No chart data</div>;
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    setHoveredIndex(resolvePointIndexFromPointer(event, points.length));
  };

  return (
    <div className="chart-panel">
      <div
        className="multi-line-shell interactive"
        style={{ height }}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
        onPointerLeave={() => setHoveredIndex(null)}
      >
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
          <line x1={PADDING} x2={WIDTH - PADDING} y1={22} y2={22} className="chart-guide-line" />
          <line x1={PADDING} x2={WIDTH - PADDING} y1={50} y2={50} className="chart-guide-line" />
          <line x1={PADDING} x2={WIDTH - PADDING} y1={78} y2={78} className="chart-guide-line" />
          {series.map((item) => (
            <path
              key={item.id}
              d={buildPathFromPlotted(plottedBySeries[item.id] ?? [])}
              fill="none"
              stroke={item.color}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {activeSeriesPoints[0] ? (
            <line
              x1={activeSeriesPoints[0].point.x}
              x2={activeSeriesPoints[0].point.x}
              y1={PADDING}
              y2={HEIGHT - PADDING}
              className="chart-cursor-line"
            />
          ) : null}
          {activeSeriesPoints.map((entry) => (
            <circle
              key={`${entry.series.id}-${entry.point.index}`}
              cx={entry.point.x}
              cy={entry.point.y}
              r="4"
              fill={entry.series.color}
            />
          ))}
        </svg>
        <div className="line-chart-axis">
          <span>{formatChartValue(valueFormatter, rawMax)}</span>
          <span>{formatChartValue(valueFormatter, rawMin)}</span>
        </div>
        {activeSeriesPoints.length > 0 ? (
          <div
            className={`chart-tooltip multi-value ${
              activeSeriesPoints[0].point.x / WIDTH > 0.72 ? "is-left" : ""
            }`}
            style={{
              left: `${clamp((activeSeriesPoints[0].point.x / WIDTH) * 100, 10, 90)}%`,
              top: `${clamp((activeSeriesPoints[0].point.y / HEIGHT) * 100, 18, 82)}%`
            }}
          >
            <strong>{formatTrendDateLabel(locale, activeLabel)}</strong>
            <div className="chart-tooltip-list">
              {activeSeriesPoints.map((entry) => (
                <span key={entry.series.id}>
                  <i style={{ backgroundColor: entry.series.color }} />
                  {entry.series.label}: {formatChartValue(valueFormatter, entry.value)}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className="chart-legend">
        {series.map((item) => (
          <span key={item.id}>
            <i style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
      <div className="chart-footnote">
        <span>{points[0] ? formatTrendDateLabel(locale, points[0].label) : ""}</span>
        <span>
          {points[points.length - 1]
            ? formatTrendDateLabel(locale, points[points.length - 1].label)
            : ""}
        </span>
      </div>
    </div>
  );
}

export function ColumnChart({
  points,
  color,
  valueFormatter,
  height = 170
}: {
  points: ChartPoint[];
  color: string;
  valueFormatter?: ValueFormatter;
  height?: number;
}) {
  if (points.length === 0) {
    return (
      <div className="column-chart empty" style={{ height }}>
        <div className="chart-empty-state">No chart data</div>
      </div>
    );
  }

  const bars = buildBars(points, height - 36);

  return (
    <div className="column-chart" style={{ height }}>
      <div className="column-chart-bars">
        {bars.map((point) => (
          <div key={point.label} className="column-bar">
            <div className="column-value">
              {valueFormatter ? valueFormatter(point.value) : point.value.toFixed(2)}
            </div>
            <div className="column-track">
              <div
                className="column-fill"
                style={{ height: `${point.scaled}px`, backgroundColor: color }}
              />
            </div>
            <div className="column-label">{point.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function heatColor(value: number) {
  const safe = clamp(value, -1, 1);
  if (safe > 0) {
    return `rgba(45, 196, 129, ${0.18 + safe * 0.5})`;
  }
  if (safe < 0) {
    return `rgba(255, 111, 97, ${0.18 + Math.abs(safe) * 0.5})`;
  }
  return "rgba(80, 92, 120, 0.12)";
}

export function Heatmap({
  columns,
  rows
}: {
  columns: string[];
  rows: HeatmapRow[];
}) {
  return (
    <div className="heatmap">
      <div className="heatmap-header">
        <span />
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.id} className="heatmap-row">
          <span className="heatmap-row-label">{row.label}</span>
          {row.values.map((value, index) => (
            <span
              key={`${row.id}-${columns[index]}`}
              className="heatmap-cell"
              style={{ backgroundColor: heatColor(value) }}
              title={`${row.label}: ${value.toFixed(2)}`}
            >
              {value > 0.15 ? "+" : value < -0.15 ? "-" : "0"}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function WaterfallChart({
  items,
  positiveColor,
  negativeColor
}: {
  items: WaterfallItem[];
  positiveColor: string;
  negativeColor: string;
}) {
  const max = Math.max(...items.map((item) => Math.abs(item.value)), 0.1);

  return (
    <div className="waterfall">
      {items.map((item) => (
        <div key={item.label} className="waterfall-row">
          <div className="waterfall-label">{item.label}</div>
          <div className="waterfall-track">
            <div className="waterfall-zero" />
            <div
              className={`waterfall-fill ${item.value >= 0 ? "positive" : "negative"}`}
              style={{
                width: `${(Math.abs(item.value) / max) * 50}%`,
                backgroundColor: item.value >= 0 ? positiveColor : negativeColor,
                marginLeft: item.value >= 0 ? "50%" : `${50 - (Math.abs(item.value) / max) * 50}%`
              }}
            />
          </div>
          <div className="waterfall-value">{item.value >= 0 ? "+" : ""}{item.value.toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}

export function DonutMeter({
  value,
  label,
  subLabel,
  color
}: {
  value: number;
  label: string;
  subLabel?: string;
  color: string;
}) {
  const safe = clamp(value, 0, 1);
  const background = `conic-gradient(${color} ${safe * 360}deg, rgba(83, 94, 119, 0.14) 0deg)`;

  return (
    <div className="donut-meter">
      <div className="donut-outer" style={{ background }}>
        <div className="donut-inner">
          <strong>{Math.round(safe * 100)}%</strong>
          <span>{label}</span>
        </div>
      </div>
      {subLabel ? <p>{subLabel}</p> : null}
    </div>
  );
}

export function PressureBar({
  value,
  negativeLabel,
  neutralLabel,
  positiveLabel
}: {
  value: number;
  negativeLabel: string;
  neutralLabel: string;
  positiveLabel: string;
}) {
  const safe = clamp(value, -1, 1);
  const position = ((safe + 1) / 2) * 100;

  return (
    <div className="pressure-bar">
      <div className="pressure-track">
        <span className="pressure-zone negative" />
        <span className="pressure-zone neutral" />
        <span className="pressure-zone positive" />
        <span className="pressure-marker" style={{ left: `${position}%` }} />
      </div>
      <div className="pressure-scale">
        <span>{negativeLabel}</span>
        <span>{neutralLabel}</span>
        <span>{positiveLabel}</span>
      </div>
    </div>
  );
}
