type ValueFormatter = (value: number) => string;

export type ChartPoint = {
  label: string;
  value: number;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

export function LineChart({
  points,
  color,
  valueFormatter,
  height = 280,
  title,
  subtitle
}: {
  points: ChartPoint[];
  color: string;
  valueFormatter?: ValueFormatter;
  height?: number;
  title?: string;
  subtitle?: string;
}) {
  const values = points.map((point) => point.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div className="chart-panel">
      {(title || subtitle) && (
        <div className="chart-meta">
          {title ? <strong>{title}</strong> : null}
          {subtitle ? <span>{subtitle}</span> : null}
        </div>
      )}
      <div className="line-chart-shell" style={{ height }}>
        <Sparkline points={points} color={color} fill />
        <div className="line-chart-axis">
          <span>{valueFormatter ? valueFormatter(max) : max.toFixed(2)}</span>
          <span>{valueFormatter ? valueFormatter(min) : min.toFixed(2)}</span>
        </div>
      </div>
      <div className="chart-footnote">
        <span>{first?.label ?? ""}</span>
        <span>{last?.label ?? ""}</span>
      </div>
    </div>
  );
}

export function MultiLineChart({
  points,
  series,
  height = 260,
  valueFormatter
}: {
  points: MultiLinePoint[];
  series: MultiLineSeries[];
  height?: number;
  valueFormatter?: ValueFormatter;
}) {
  const flattened = points.flatMap((point) =>
    series
      .map((item) => point.values[item.id])
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  );
  const min = Math.min(...flattened, 0);
  const max = Math.max(...flattened, 1);
  const range = max - min || 1;
  const innerWidth = WIDTH - PADDING * 2;
  const innerHeight = HEIGHT - PADDING * 2;

  const pathForSeries = (seriesId: string) =>
    points
      .map((point, index) => {
        const value = point.values[seriesId];
        if (typeof value !== "number" || !Number.isFinite(value)) {
          return "";
        }
        const x =
          PADDING +
          (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
        const y = PADDING + ((max - value) / range) * innerHeight;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .filter(Boolean)
      .join(" ");

  return (
    <div className="chart-panel">
      <div className="multi-line-shell" style={{ height }}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none">
          {series.map((item) => (
            <path
              key={item.id}
              d={pathForSeries(item.id)}
              fill="none"
              stroke={item.color}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
        <div className="line-chart-axis">
          <span>{valueFormatter ? valueFormatter(max) : max.toFixed(2)}</span>
          <span>{valueFormatter ? valueFormatter(min) : min.toFixed(2)}</span>
        </div>
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
        <span>{points[0]?.label ?? ""}</span>
        <span>{points[points.length - 1]?.label ?? ""}</span>
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
