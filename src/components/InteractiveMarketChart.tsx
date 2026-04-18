import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle
} from "lightweight-charts";
import type { ChartPoint } from "./charts";

type InteractiveSeries = {
  id: string;
  label: string;
  color: string;
  points: ChartPoint[];
  variant?: "area" | "line" | "candles" | "histogram";
  lineStyle?: "solid" | "dashed";
  valueFormatter?: (value: number) => string;
};

type HoverValue = {
  id: string;
  label: string;
  color: string;
  value: string;
};

function parseChartTime(label: string) {
  const parsed = new Date(label);
  if (!Number.isNaN(parsed.getTime())) {
    return Math.floor(parsed.getTime() / 1000);
  }

  return label;
}

function formatHoverLabel(locale: string, value: string | number | { year: number; month: number; day: number }) {
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(parsed);
    }

    return value;
  }

  if (typeof value === "number") {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(value * 1000));
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value.year, value.month - 1, value.day));
}

function defaultFormatter(value: number) {
  return value.toFixed(2);
}

export function InteractiveMarketChart({
  title,
  subtitle,
  series,
  locale = "en-US",
  height = 320,
  tone = "light",
  guideLabel,
  emptyTitle,
  emptySubtitle
}: {
  title?: string;
  subtitle?: string;
  series: InteractiveSeries[];
  locale?: string;
  height?: number;
  tone?: "light" | "dark";
  guideLabel: string;
  emptyTitle: string;
  emptySubtitle: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const [hoverValues, setHoverValues] = useState<HoverValue[] | null>(null);

  const activeSeries = useMemo(
    () => series.filter((item) => item.points.length > 0),
    [series]
  );

  const latestValues = useMemo(
    () =>
      activeSeries.map((item) => {
        const latest = item.points[item.points.length - 1];
        const formatter = item.valueFormatter ?? defaultFormatter;
        return {
          id: item.id,
          label: item.label,
          color: item.color,
          value: latest ? formatter(latest.value) : "n/a"
        };
      }),
    [activeSeries]
  );

  useEffect(() => {
    if (!containerRef.current || activeSeries.length === 0) {
      return;
    }

    const isDark = tone === "dark";
    const chart = createChart(containerRef.current, {
      autoSize: true,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: isDark ? "#cbd5e1" : "#64748b",
        attributionLogo: true
      },
      grid: {
        vertLines: { color: isDark ? "rgba(148, 163, 184, 0.08)" : "rgba(148, 163, 184, 0.12)" },
        horzLines: { color: isDark ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.16)" }
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.18, bottom: 0.12 }
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false
      },
      crosshair: {
        mode: CrosshairMode.Normal
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      }
    });

    const chartSeries = activeSeries.map((item) => {
      const chartApi =
        item.variant === "candles"
          ? chart.addSeries(CandlestickSeries, {
              upColor: item.color,
              downColor: "#ef4444",
              wickUpColor: item.color,
              wickDownColor: "#ef4444",
              borderVisible: false,
              lastValueVisible: true,
              priceLineVisible: false
            })
          : item.variant === "histogram"
          ? chart.addSeries(HistogramSeries, {
              color: item.color,
              base: 0,
              lastValueVisible: false,
              priceLineVisible: false,
              priceScaleId: "volume",
              priceFormat: {
                type: "volume"
              }
            })
          : item.variant === "line"
          ? chart.addSeries(LineSeries, {
              color: item.color,
              lineWidth: 2.5,
              lineStyle: item.lineStyle === "dashed" ? LineStyle.Dashed : LineStyle.Solid,
              crosshairMarkerRadius: 4,
              lastValueVisible: true,
              priceLineVisible: false
            })
          : chart.addSeries(AreaSeries, {
              lineColor: item.color,
              topColor: `${item.color}33`,
              bottomColor: `${item.color}05`,
              lineWidth: 2.5,
              crosshairMarkerRadius: 4,
              lastValueVisible: true,
              priceLineVisible: false
            });

      chartApi.setData(
        item.variant === "candles"
          ? item.points
              .filter(
                (point) =>
                  typeof point.open === "number" &&
                  typeof point.high === "number" &&
                  typeof point.low === "number" &&
                  typeof point.close === "number"
              )
              .map((point) => ({
                time: parseChartTime(point.label),
                open: point.open,
                high: point.high,
                low: point.low,
                close: point.close
              }))
          : item.variant === "histogram"
          ? item.points.map((point) => ({
              time: parseChartTime(point.label),
              value: point.value,
              color:
                typeof point.open === "number" && typeof point.close === "number"
                  ? point.close >= point.open
                    ? "#16a34a"
                    : "#ef4444"
                  : item.color
            }))
          : item.points.map((point) => ({
              time: parseChartTime(point.label),
              value: point.value
            }))
      );

      return {
        definition: item,
        api: chartApi
      };
    });

    if (activeSeries.some((item) => item.variant === "histogram")) {
      chart.priceScale("volume").applyOptions({
        borderVisible: false,
        visible: false,
        scaleMargins: {
          top: 0.76,
          bottom: 0
        }
      });
    }

    const handleCrosshairMove = (param: Parameters<typeof chart.subscribeCrosshairMove>[0] extends (arg: infer T) => void ? T : never) => {
      if (!param.time) {
        setHoverLabel(null);
        setHoverValues(null);
        return;
      }

      const nextValues = chartSeries
        .map(({ definition, api }) => {
          const rawValue = param.seriesData.get(api) as { value?: number; close?: number } | undefined;
          const numeric =
            typeof rawValue?.value === "number"
              ? rawValue.value
              : typeof rawValue?.close === "number"
                ? rawValue.close
                : null;

          if (numeric === null) {
            return null;
          }

          return {
            id: definition.id,
            label: definition.label,
            color: definition.color,
            value: (definition.valueFormatter ?? defaultFormatter)(numeric)
          };
        })
        .filter(Boolean) as HoverValue[];

      setHoverLabel(formatHoverLabel(locale, param.time));
      setHoverValues(nextValues);
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);
    chart.timeScale().fitContent();

    return () => {
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
    };
  }, [activeSeries, height, locale, tone]);

  if (activeSeries.length === 0) {
    return (
      <div className="terminal-chart-empty">
        <strong>{emptyTitle}</strong>
        <span>{emptySubtitle}</span>
      </div>
    );
  }

  const displayedValues = hoverValues ?? latestValues;

  return (
    <div className={`terminal-chart ${tone === "dark" ? "dark" : ""}`}>
      {(title || subtitle) && (
        <div className="terminal-chart-head">
          <div>
            {title ? <strong>{title}</strong> : null}
            {subtitle ? <span>{subtitle}</span> : null}
          </div>
          <div className="terminal-chart-time">{hoverLabel ?? guideLabel}</div>
        </div>
      )}

      <div className="terminal-chart-legend">
        {displayedValues.map((item) => (
          <div key={item.id} className="terminal-chart-chip">
            <span className="terminal-chart-chip-label">
              <i style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="terminal-chart-canvas" style={{ height }} ref={containerRef} />
    </div>
  );
}
