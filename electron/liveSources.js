const ExcelJS = require("exceljs");

const EEX_AUCTION_PAGE_URL =
  "https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions";
const KRX_MARKET_PAGE_URL =
  "https://ets.krx.co.kr/contents/ETS/03/03010000/ETS03010000.jsp";
const KRX_OPEN_API_DETAIL_URL =
  "https://openapi.krx.co.kr/contents/OPP/USES/service/OPPUSES006_S2.cmd?BO_ID=IZiYdcgRQFMeENJPEMKG";
const KRX_SAMPLE_API_URL = "https://data-dbg.krx.co.kr/svc/sample/apis/gen/ets_bydd_trd";
const KRX_SAMPLE_AUTH_KEY = "74D1B99DFBF345BBA3FB4476510A4BED4C78D13A";
const KRX_DATA_URL = "https://ets.krx.co.kr/contents/ETS/99/ETS99000001.jspx";
const KRX_OTP_URL = "https://ets.krx.co.kr/contents/COM/GenerateOTP.jspx";
const MEE_LIST_URL = "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/";
const YAHOO_CHART_BASE_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const EU_CARD_CACHE_TTL_MS = 10 * 60 * 1000;
const KRX_DAY_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const KRX_CARD_CACHE_TTL_MS = 15 * 60 * 1000;
const CN_CARD_CACHE_TTL_MS = 30 * 60 * 1000;
const QUOTE_CACHE_TTL_MS = 60 * 1000;
const cacheStore = new Map();
const QUOTE_RANGE_PRESETS = {
  "5d": { range: "5d", interval: "1d", seriesLimit: 5 },
  "1m": { range: "1mo", interval: "1d", seriesLimit: 22 },
  "3m": { range: "3mo", interval: "1d", seriesLimit: null },
  "6m": { range: "6mo", interval: "1d", seriesLimit: null },
  "1y": { range: "1y", interval: "1wk", seriesLimit: null }
};

const DEFAULT_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9,ko;q=0.8,zh-CN;q=0.7"
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function toIsoDate(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return "";
  }

  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
    value.getDate()
  )}`;
}

function toCompactDate(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return "";
  }

  return `${value.getFullYear()}${pad(value.getMonth() + 1)}${pad(
    value.getDate()
  )}`;
}

function compactToIsoDate(value) {
  const normalized = normalizeWhitespace(value);
  if (!/^\d{8}$/.test(normalized)) {
    return normalized;
  }

  return `${normalized.slice(0, 4)}-${normalized.slice(4, 6)}-${normalized.slice(6, 8)}`;
}

function normalizeWhitespace(value) {
  return String(value ?? "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value) {
  return normalizeWhitespace(String(value ?? "").replace(/<[^>]+>/g, " "));
}

function getLiveQuoteConfigs() {
  const currentYear = new Date().getFullYear();
  const currentSuffix = String(currentYear).slice(-2);
  const nextSuffix = String(currentYear + 1).slice(-2);
  const previousSuffix = String(currentYear - 1).slice(-2);

  return [
    {
      id: "eua-dec-benchmark",
      title: "ICE EUA December benchmark future",
      symbolCandidates: [`ECFZ${currentSuffix}.NYM`, `ECFZ${nextSuffix}.NYM`, `ECFZ${previousSuffix}.NYM`],
      category: "Benchmark futures",
      markets: ["eu-ets", "shared"],
      provider: "Public chart API",
      sourceUrl: "https://www.ice.com/products/197",
      role: "Primary listed hedge tape for EU carbon risk",
      note:
        "December benchmark contract used as the main listed EUA reference. Some free chart feeds expose the live price faster than the full historical curve.",
      delayNote:
        "Reference chart API feed. Exchange delay may apply."
    },
    {
      id: "ttf-gas-future",
      title: "Dutch TTF gas future",
      symbolCandidates: ["TTF=F"],
      category: "Driver future",
      markets: ["eu-ets", "shared"],
      provider: "Public chart API",
      sourceUrl: "https://www.ice.com/products/27996665/Dutch-TTF-Gas-Futures",
      role: "Fuel-switching driver for EU carbon",
      note: "Gas remains one of the key inputs behind short-term carbon repricing.",
      delayNote:
        "Reference chart API feed. Exchange delay may apply."
    },
    {
      id: "brent-future",
      title: "Brent crude future",
      symbolCandidates: ["BZ=F"],
      category: "Driver future",
      markets: ["shared"],
      provider: "Public chart API",
      sourceUrl: "https://www.ice.com/products/219/Brent-Crude-Futures",
      role: "Macro energy proxy",
      note: "Useful for broad energy risk context when carbon trades with the wider commodity complex.",
      delayNote:
        "Reference chart API feed. Exchange delay may apply."
    },
    {
      id: "co2-l-proxy",
      title: "WisdomTree Carbon ETC",
      symbolCandidates: ["CO2.L"],
      category: "Listed proxy",
      markets: ["eu-ets", "shared"],
      provider: "Public chart API",
      sourceUrl: "https://www.wisdomtree.eu/en-gb/etps/alternative/wisdomtree-carbon",
      role: "Exchange-traded EU carbon proxy",
      note: "Useful as a listed carbon proxy alongside the benchmark EUA future.",
      delayNote:
        "Reference chart API feed. Exchange delay may apply."
    },
    {
      id: "krbn-proxy",
      title: "KRBN global carbon ETF",
      symbolCandidates: ["KRBN"],
      category: "Listed proxy",
      markets: ["k-ets", "cn-ets", "shared"],
      provider: "Public chart API",
      sourceUrl: "https://kraneshares.com/etf/krbn/",
      role: "Listed carbon proxy when local ETS futures are not available",
      note: "Proxy only. Do not treat this as an official local ETS settlement.",
      delayNote:
        "Reference chart API feed. Use as a listed proxy, not as the official carbon price."
    },
    {
      id: "keua-proxy",
      title: "KEUA Europe carbon ETF",
      symbolCandidates: ["KEUA"],
      category: "Listed proxy",
      markets: ["eu-ets", "shared"],
      provider: "Public chart API",
      sourceUrl: "https://kraneshares.com/etf/keua/",
      role: "Listed proxy for EU carbon exposure",
      note: "Proxy only. The official listed hedge anchor remains the ICE EUA future.",
      delayNote:
        "Reference chart API feed. Use as a listed proxy, not as the official carbon price."
    },
    {
      id: "kcca-proxy",
      title: "KCCA California carbon ETF",
      symbolCandidates: ["KCCA"],
      category: "Listed proxy",
      markets: ["shared"],
      provider: "Public chart API",
      sourceUrl: "https://kraneshares.com/etf/kcca/",
      role: "Listed North American carbon proxy for cross-market risk appetite",
      note: "Proxy only. Useful as an additional listed carbon sleeve, not as a local ETS settlement.",
      delayNote:
        "Reference chart API feed. Use as a listed proxy, not as an official carbon price."
    }
  ];
}

function makeAbsoluteUrl(baseUrl, href) {
  return new URL(href, baseUrl).href;
}

function firstArrayValue(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  for (const value of Object.values(payload ?? {})) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function parseDateValue(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }

  if (typeof value === "string" && value.trim()) {
    const cleaned = value.trim().replace(/\./g, "-").replace(/\//g, "-");
    const parsed = new Date(cleaned);
    if (!Number.isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }
  }

  return null;
}

function formatNumber(value, decimals = 2) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return String(value ?? "");
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numeric);
}

function parseNumeric(value) {
  const numeric = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

async function withCache(key, ttlMs, loader) {
  const cached = cacheStore.get(key);

  if (cached && Date.now() - cached.fetchedAt < ttlMs) {
    return cached.value;
  }

  const value = await loader();
  cacheStore.set(key, {
    fetchedAt: Date.now(),
    value
  });
  return value;
}

function makeLinks(...items) {
  const accessed = toIsoDate(new Date());
  return items.map((item) => ({
    ...item,
    accessed
  }));
}

function makeErrorCard({
  id,
  marketId,
  sourceName,
  sourceUrl,
  coverage,
  error
}) {
  return {
    id,
    marketId,
    sourceName,
    coverage,
    sourceUrl,
    status: "error",
    asOf: toIsoDate(new Date()),
    headline: "Connection unavailable",
    summary: error,
    metrics: [],
    notes: [
      "The app could not fetch this official source in the current environment."
    ],
    links: makeLinks({ label: "Official source", url: sourceUrl })
  };
}

async function fetchWithTimeout(url, init = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} from ${url}`);
    }

    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchText(url, init = {}, timeoutMs) {
  const response = await fetchWithTimeout(url, init, timeoutMs);
  return response.text();
}

async function fetchBuffer(url, init = {}, timeoutMs) {
  const response = await fetchWithTimeout(url, init, timeoutMs);
  return Buffer.from(await response.arrayBuffer());
}

async function fetchJson(url, init = {}, timeoutMs) {
  const response = await fetchWithTimeout(url, init, timeoutMs);
  return response.json();
}

function lastFiniteValue(values) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const candidate = Number(values[index]);
    if (Number.isFinite(candidate)) {
      return candidate;
    }
  }
  return null;
}

function toDateLabelFromUnix(timestamp) {
  const numeric = Number(timestamp);
  if (!Number.isFinite(numeric)) {
    return "";
  }
  return toIsoDate(new Date(numeric * 1000));
}

function buildSeriesFromYahoo(timestamps, closes, seriesLimit = 22) {
  const points = [];

  for (let index = 0; index < Math.min(timestamps.length, closes.length); index += 1) {
    const value = Number(closes[index]);
    if (!Number.isFinite(value)) {
      continue;
    }

    const date = toDateLabelFromUnix(timestamps[index]);
    if (!date) {
      continue;
    }

    points.push({
      date,
      value
    });
  }

  return seriesLimit === null ? points : points.slice(-seriesLimit);
}

async function fetchYahooChartResult(symbol, options = {}) {
  const range = options.range ?? "1mo";
  const interval = options.interval ?? "1d";
  const url =
    `${YAHOO_CHART_BASE_URL}/${encodeURIComponent(symbol)}` +
    `?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(
      range
    )}&includePrePost=false&events=div%2Csplits`;
  const payload = await fetchJson(
    url,
    {
      headers: {
        ...DEFAULT_HEADERS,
        accept: "application/json,text/plain,*/*"
      }
    },
    15000
  );
  const error = payload?.chart?.error;
  if (error) {
    throw new Error(`${error.code ?? "ChartError"}: ${error.description ?? "Unknown error"}`);
  }

  const result = payload?.chart?.result?.[0];
  if (!result) {
    throw new Error(`No chart result returned for ${symbol}.`);
  }

  return result;
}

async function fetchLiveQuote(config, options = {}) {
  let selectedSymbol = "";
  let result = null;
  const seriesLimit =
    Object.prototype.hasOwnProperty.call(options, "seriesLimit") ? options.seriesLimit : 22;

  for (const candidate of config.symbolCandidates) {
    try {
      result = await fetchYahooChartResult(candidate, options);
      selectedSymbol = candidate;
      break;
    } catch {
      // Try the next configured symbol candidate.
    }
  }

  if (!result || !selectedSymbol) {
    throw new Error(`No live quote could be resolved for ${config.title}.`);
  }

  const meta = result.meta ?? {};
  const timestamps = Array.isArray(result.timestamp) ? result.timestamp : [];
  const closes = Array.isArray(result?.indicators?.quote?.[0]?.close)
    ? result.indicators.quote[0].close
    : [];
  const series = buildSeriesFromYahoo(timestamps, closes, seriesLimit);
  const priceCandidate = Number(meta.regularMarketPrice);
  const lastClose = lastFiniteValue(closes);
  const price = Number.isFinite(priceCandidate) ? priceCandidate : lastClose;
  const previousCloseCandidate = Number(meta.chartPreviousClose ?? meta.previousClose);
  const previousClose = Number.isFinite(previousCloseCandidate) ? previousCloseCandidate : null;
  const change =
    Number.isFinite(price) && Number.isFinite(previousClose) ? price - previousClose : null;
  const changePct =
    Number.isFinite(change) && Number.isFinite(previousClose) && previousClose !== 0
      ? (change / previousClose) * 100
      : null;
  const asOf = timestamps.length > 0 ? toDateLabelFromUnix(timestamps[timestamps.length - 1]) : "";

  return {
    id: config.id,
    title: config.title,
    symbol: selectedSymbol,
    category: config.category,
    markets: config.markets,
    status: Number.isFinite(price) ? "connected" : "limited",
    provider: config.provider,
    sourceUrl: config.sourceUrl,
    role: config.role,
    note: config.note,
    delayNote: config.delayNote,
    asOf: asOf || toIsoDate(new Date()),
    price: Number.isFinite(price) ? price : null,
    previousClose,
    change,
    changePct,
    currency: String(meta.currency ?? ""),
    exchange: String(meta.fullExchangeName ?? meta.exchangeName ?? ""),
    series
  };
}

function getLiveQuoteConfigById(quoteId) {
  return getLiveQuoteConfigs().find((config) => config.id === quoteId) ?? null;
}

async function getLiveQuoteHistory(quoteId, presetId = "3m") {
  const config = getLiveQuoteConfigById(quoteId);
  if (!config) {
    throw new Error(`Unknown live quote: ${quoteId}`);
  }

  const preset = QUOTE_RANGE_PRESETS[presetId] ?? QUOTE_RANGE_PRESETS["3m"];

  return withCache(`quote:${quoteId}:${presetId}`, QUOTE_CACHE_TTL_MS, () =>
    fetchLiveQuote(config, preset)
  );
}

function makeErrorQuote(config, error) {
  return {
    id: config.id,
    title: config.title,
    symbol: config.symbolCandidates[0],
    category: config.category,
    markets: config.markets,
    status: "error",
    provider: config.provider,
    sourceUrl: config.sourceUrl,
    role: config.role,
    note: `Live quote unavailable: ${error}`,
    delayNote: config.delayNote,
    asOf: toIsoDate(new Date()),
    price: null,
    previousClose: null,
    change: null,
    changePct: null,
    currency: "",
    exchange: "",
    series: []
  };
}

async function runQuoteTask(config) {
  try {
    return await withCache(`quote:${config.id}`, QUOTE_CACHE_TTL_MS, () =>
      fetchLiveQuote(config)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return makeErrorQuote(config, message);
  }
}

async function fetchKrxApiRowsByDate(compactDate) {
  return withCache(`krx-day:${compactDate}`, KRX_DAY_CACHE_TTL_MS, async () => {
    const url = `${KRX_SAMPLE_API_URL}?basDd=${compactDate}`;
    const payload = await fetchJson(
      url,
      {
        headers: {
          ...DEFAULT_HEADERS,
          accept: "application/json,text/plain,*/*",
          AUTH_KEY: KRX_SAMPLE_AUTH_KEY
        }
      },
      15000
    );

    return Array.isArray(payload?.OutBlock_1) ? payload.OutBlock_1 : [];
  });
}

function chooseActiveKrxApiInstrument(rows) {
  const allowances = rows
    .filter((row) => /^KAU\d{2}$/.test(normalizeWhitespace(row.ISU_NM)))
    .map((row) => ({
      code: normalizeWhitespace(row.ISU_CD),
      name: normalizeWhitespace(row.ISU_NM),
      close: parseNumeric(row.TDD_CLSPRC),
      change: parseNumeric(row.CMPPREVDD_PRC),
      returnPct: parseNumeric(row.FLUC_RT),
      open: parseNumeric(row.TDD_OPNPRC),
      high: parseNumeric(row.TDD_HGPRC),
      low: parseNumeric(row.TDD_LWPRC),
      volume: parseNumeric(row.ACC_TRDVOL) ?? 0,
      value: parseNumeric(row.ACC_TRDVAL) ?? 0,
      year: Number(normalizeWhitespace(row.ISU_NM).slice(-2))
    }))
    .sort((left, right) => {
      if (right.volume !== left.volume) {
        return right.volume - left.volume;
      }

      return right.year - left.year;
    });

  return allowances[0] ?? null;
}

async function fetchLatestKrxTradingSnapshot() {
  const today = new Date();

  for (let offset = 0; offset < 10; offset += 1) {
    const candidateDate = new Date(today);
    candidateDate.setDate(today.getDate() - offset);
    const compactDate = toCompactDate(candidateDate);
    const rows = await fetchKrxApiRowsByDate(compactDate);

    if (rows.length > 0) {
      return {
        compactDate,
        rows
      };
    }
  }

  throw new Error("KRX sample API returned no recent ETS rows.");
}

async function fetchKrxHistorySeries(instrumentCode, asOfCompactDate) {
  const asOfDate = parseDateValue(compactToIsoDate(asOfCompactDate));
  const dateCandidates = [];

  for (let offset = 0; offset < 45; offset += 1) {
    const candidateDate = new Date(asOfDate);
    candidateDate.setDate(asOfDate.getDate() - offset);
    dateCandidates.push(toCompactDate(candidateDate));
  }

  const dayRows = await Promise.all(dateCandidates.map((date) => fetchKrxApiRowsByDate(date)));

  return dayRows
    .map((rows, index) => {
      const matchedRow = rows.find(
        (row) => normalizeWhitespace(row.ISU_CD) === instrumentCode
      );

      if (!matchedRow) {
        return null;
      }

      const close = parseNumeric(matchedRow.TDD_CLSPRC);
      if (!Number.isFinite(close)) {
        return null;
      }

      return {
        date: compactToIsoDate(dateCandidates[index]),
        value: close,
        volume: parseNumeric(matchedRow.ACC_TRDVOL) ?? 0
      };
    })
    .filter(Boolean)
    .sort((left, right) => new Date(left.date) - new Date(right.date))
    .slice(-24);
}

async function fetchEuEtsCard() {
  return withCache("card:eu-ets-official", EU_CARD_CACHE_TTL_MS, async () => {
    const candidateYears = [new Date().getFullYear(), new Date().getFullYear() - 1];
    let workbookBuffer = null;
    let directDataUrl = "";

    for (const year of candidateYears) {
      const candidateUrl =
        "https://public.eex-group.com/eex/eua-auction-report/" +
        `emission-spot-primary-market-auction-report-${year}-data.xlsx`;

      try {
        workbookBuffer = await fetchBuffer(candidateUrl, {
          headers: DEFAULT_HEADERS
        });
        directDataUrl = candidateUrl;
        break;
      } catch (error) {
        if (year === candidateYears[candidateYears.length - 1]) {
          throw error;
        }
      }
    }

    const workbookReader = new ExcelJS.Workbook();
    await workbookReader.xlsx.load(workbookBuffer);
    const worksheet =
      workbookReader.getWorksheet("Primary Market Auction") ??
      workbookReader.worksheets[0];
    const rows = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      rows.push(row.values.slice(2));
    });

    const dataRows = rows
      .slice(5)
      .map((row) => ({
        date: parseDateValue(row[0]),
        auctionName: normalizeWhitespace(row[2]),
        contract: normalizeWhitespace(row[3]),
        auctionPrice: row[5],
        volume: row[10],
        coverRatio: row[20],
        revenue: row[23]
      }))
      .filter((row) => row.date && row.auctionName);

    if (dataRows.length === 0) {
      throw new Error("No EEX auction rows were found in the official workbook.");
    }

    dataRows.sort((left, right) => right.date - left.date);
    const latest = dataRows[0];
    const previous = dataRows[1] ?? latest;
    const priceDelta = Number(latest.auctionPrice) - Number(previous.auctionPrice);
    const recentSeries = dataRows
      .slice()
      .sort((left, right) => left.date - right.date)
      .slice(-14)
      .map((row) => ({
        date: toIsoDate(row.date),
        value: Number(row.auctionPrice),
        volume: Number(row.volume)
      }));

    return {
      id: "eu-ets-official",
      marketId: "eu-ets",
      sourceName: "EEX EUA auction report",
      coverage: "Official EU primary auction tape",
      sourceUrl: EEX_AUCTION_PAGE_URL,
      status: "connected",
      asOf: toIsoDate(latest.date),
      headline: latest.auctionName,
      summary: `Latest official primary auction cleared at EUR ${formatNumber(
        latest.auctionPrice
      )}/tCO2.`,
      metrics: [
        { label: "Auction price", value: `EUR ${formatNumber(latest.auctionPrice)}/tCO2` },
        { label: "Auction volume", value: `${formatNumber(latest.volume, 0)} tCO2` },
        { label: "Cover ratio", value: `${formatNumber(latest.coverRatio)}x` },
        { label: "Auction revenue", value: `EUR ${formatNumber(latest.revenue, 0)}` },
        {
          label: "Price change vs prior auction",
          value: `${priceDelta >= 0 ? "+" : ""}${formatNumber(priceDelta)} EUR/tCO2`
        }
      ],
      notes: [
        "This official feed covers primary auctions. It does not replace ICE secondary-market futures data."
      ],
      series: recentSeries,
      seriesLabel: "Auction price",
      volumeSeries: recentSeries.map((point) => ({
        date: point.date,
        value: point.volume ?? 0
      })),
      links: makeLinks(
        { label: "EEX auction page", url: EEX_AUCTION_PAGE_URL },
        { label: "Direct auction workbook", url: directDataUrl }
      )
    };
  });
}

async function fetchKrxCard() {
  return withCache("card:k-ets-official", KRX_CARD_CACHE_TTL_MS, async () => {
    const latestSnapshot = await fetchLatestKrxTradingSnapshot();
    const activeInstrument = chooseActiveKrxApiInstrument(latestSnapshot.rows);

    if (!activeInstrument) {
      throw new Error("KRX sample API did not return an active KAU instrument.");
    }

    const recentSeries = await fetchKrxHistorySeries(
      activeInstrument.code,
      latestSnapshot.compactDate
    );

    if (recentSeries.length === 0) {
      throw new Error("KRX sample API returned no recent series for the active allowance.");
    }

    const recentVolumes = recentSeries
      .map((point) => point.volume ?? 0)
      .filter((value) => Number.isFinite(value))
      .slice(-20);
    const averageVolume =
      recentVolumes.length > 0
        ? recentVolumes.reduce((sum, value) => sum + value, 0) / recentVolumes.length
        : 0;
    const latestPoint = recentSeries[recentSeries.length - 1];

    return {
      id: "k-ets-official",
      marketId: "k-ets",
      sourceName: "KRX ETS sample API",
      coverage: "Official KRX Open API sample (daily market tape)",
      sourceUrl: KRX_OPEN_API_DETAIL_URL,
      status: "connected",
      asOf: compactToIsoDate(latestSnapshot.compactDate),
      headline: `${activeInstrument.name} official close`,
      summary: `Official KRX sample API data for ${activeInstrument.name} on ${compactToIsoDate(
        latestSnapshot.compactDate
      )}.`,
      metrics: [
        { label: "Close", value: `KRW ${formatNumber(activeInstrument.close, 0)}` },
        {
          label: "Day change",
          value: `${activeInstrument.change >= 0 ? "+" : ""}${formatNumber(
            activeInstrument.change,
            0
          )} KRW`
        },
        { label: "Return", value: `${formatNumber(activeInstrument.returnPct, 2)}%` },
        { label: "Volume", value: `${formatNumber(latestPoint.volume ?? 0, 0)} t` },
        { label: "20d avg volume", value: `${formatNumber(averageVolume, 0)} t` }
      ],
      notes: [
        "This uses the official KRX Open API sample endpoint published on the service detail page.",
        "Daily market tape only. Zero-volume rows are preserved as official records."
      ],
      series: recentSeries,
      seriesLabel: "Official close",
      volumeSeries: recentSeries.map((point) => ({
        date: point.date,
        value: point.volume ?? 0
      })),
      links: makeLinks(
        { label: "KRX Open API detail", url: KRX_OPEN_API_DETAIL_URL },
        { label: "KRX ETS market page", url: KRX_MARKET_PAGE_URL }
      )
    };
  });
}

function parseMeeListEntries(html) {
  const matches = html.matchAll(
    /<li[^>]*>\s*<span class="date">([^<]+)<\/span><a href="([^"]+)"[^>]*>(.*?)<\/a>\s*<\/li>/g
  );

  return Array.from(matches).map((match) => ({
    date: normalizeWhitespace(match[1]),
    url: makeAbsoluteUrl(MEE_LIST_URL, match[2]),
    title: stripHtml(match[3])
  }));
}

function parseMetaValue(html, name) {
  const pattern = new RegExp(
    `<meta\\s+name="${name}"\\s+content="([^"]*)"\\s*\\/?>`,
    "i"
  );
  const match = html.match(pattern);
  return match ? normalizeWhitespace(match[1]) : "";
}

function extractMeeOperationalMetrics(html) {
  const text = stripHtml(html);
  const yearEndClose = text.match(/年底收盘价为([0-9.]+)元\/吨/);
  const yearlyAverage = text.match(/全年交易均价为([0-9.]+)元\/吨/);
  const yearlyVolume = text.match(/全年配额成交量([0-9.]+亿吨)/);
  const yearlyTurnover =
    text.match(/全年配额成交量[0-9.]+亿吨，同比增长约[0-9.]+%，成交额([0-9.]+亿元)/) ??
    text.match(/成交额([0-9.]+亿元)/);

  const metrics = [];

  if (yearEndClose) {
    metrics.push({ label: "Year-end close", value: `${yearEndClose[1]} CNY/t` });
  }
  if (yearlyAverage) {
    metrics.push({ label: "Average price", value: `${yearlyAverage[1]} CNY/t` });
  }
  if (yearlyVolume) {
    metrics.push({ label: "Annual volume", value: yearlyVolume[1] });
  }
  if (yearlyTurnover) {
    metrics.push({ label: "Annual turnover", value: yearlyTurnover[1] });
  }

  return metrics;
}

async function fetchCnEtsCard() {
  return withCache("card:cn-ets-official", CN_CARD_CACHE_TTL_MS, async () => {
  const listHtml = await fetchText(MEE_LIST_URL, {
    headers: DEFAULT_HEADERS
  });
  const entries = parseMeeListEntries(listHtml).filter((entry) =>
    /碳市场|碳排放权交易市场/.test(entry.title)
  );

  if (entries.length === 0) {
    throw new Error("MEE list page returned no carbon-market entries.");
  }

  const latestEntry = entries[0];
  let metrics = [];
  let metricsEntry = null;

  for (const entry of entries.slice(0, 6)) {
    const articleHtml = await fetchText(entry.url, {
      headers: {
        ...DEFAULT_HEADERS,
        referer: MEE_LIST_URL
      }
    });
    const articleMetrics = extractMeeOperationalMetrics(articleHtml);
    if (articleMetrics.length > 0) {
      metrics = articleMetrics;
      metricsEntry = {
        ...entry,
        title: parseMetaValue(articleHtml, "ArticleTitle") || entry.title,
        date: parseMetaValue(articleHtml, "PubDate").slice(0, 10) || entry.date
      };
      break;
    }
  }

  const notes = [
    "This official feed reflects MEE policy and operations releases, not a stable daily exchange tape."
  ];

  if (metricsEntry && metricsEntry.url !== latestEntry.url) {
    notes.push(
      `Numeric operating metrics are taken from the latest MEE bulletin with published market statistics (${metricsEntry.date}).`
    );
  }

  return {
    id: "cn-ets-official",
    marketId: "cn-ets",
    sourceName: "MEE carbon-market release feed",
    coverage: "Official policy and operations feed",
    sourceUrl: latestEntry.url,
    status: metrics.length > 0 ? "limited" : "connected",
    asOf: latestEntry.date,
    headline: latestEntry.title,
    summary:
      metrics.length > 0
        ? `Latest official MEE carbon-market release dated ${latestEntry.date}.`
        : `Latest official MEE carbon-market release dated ${latestEntry.date}. Numeric market statistics were not published in the latest item.`,
    metrics,
    notes,
    links: makeLinks(
      { label: "MEE feed page", url: MEE_LIST_URL },
      { label: "Latest official release", url: latestEntry.url },
      ...(metricsEntry && metricsEntry.url !== latestEntry.url
        ? [{ label: "Latest stats bulletin", url: metricsEntry.url }]
        : [])
    )
  };
  });
}

async function runSourceTask(task, fallbackConfig) {
  try {
    return await task();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return makeErrorCard({
      ...fallbackConfig,
      error: message
    });
  }
}

async function getConnectedSources() {
  const cards = await Promise.all([
    runSourceTask(fetchEuEtsCard, {
      id: "eu-ets-official",
      marketId: "eu-ets",
      sourceName: "EEX EUA auction report",
      sourceUrl: EEX_AUCTION_PAGE_URL,
      coverage: "Official EU primary auction tape"
    }),
    runSourceTask(fetchKrxCard, {
      id: "k-ets-official",
      marketId: "k-ets",
      sourceName: "KRX ETS sample API",
      sourceUrl: KRX_OPEN_API_DETAIL_URL,
      coverage: "Official KRX Open API sample (daily market tape)"
    }),
    runSourceTask(fetchCnEtsCard, {
      id: "cn-ets-official",
      marketId: "cn-ets",
      sourceName: "MEE carbon-market release feed",
      sourceUrl: MEE_LIST_URL,
      coverage: "Official policy and operations feed"
    })
  ]);
  const liveQuotes = await Promise.all(getLiveQuoteConfigs().map((config) => runQuoteTask(config)));

  return {
    fetchedAt: new Date().toISOString(),
    cards,
    liveQuotes,
    warnings: cards
      .filter((card) => card.status === "error")
      .map((card) => `${card.sourceName}: ${card.summary}`)
      .concat(
        liveQuotes
          .filter((quote) => quote.status === "error")
          .map((quote) => `${quote.title}: ${quote.note}`)
      )
  };
}

module.exports = {
  getConnectedSources,
  getLiveQuoteHistory
};
