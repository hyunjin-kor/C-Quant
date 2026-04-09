const ExcelJS = require("exceljs");

const EEX_AUCTION_PAGE_URL =
  "https://www.eex.com/en/markets/environmental-markets/eu-ets-auctions";
const KRX_MARKET_PAGE_URL =
  "https://ets.krx.co.kr/contents/ETS/03/03010000/ETS03010000.jsp";
const KRX_DATA_URL = "https://ets.krx.co.kr/contents/ETS/99/ETS99000001.jspx";
const KRX_OTP_URL = "https://ets.krx.co.kr/contents/COM/GenerateOTP.jspx";
const MEE_LIST_URL = "https://www.mee.gov.cn/ywgz/ydqhbh/wsqtkz/";

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

async function getKrxOtp(name, bld) {
  const params = new URLSearchParams({ name, bld });
  const response = await fetchText(`${KRX_OTP_URL}?${params.toString()}`, {
    headers: DEFAULT_HEADERS
  });

  return response.trim();
}

async function postKrxForm(formData) {
  const body = new URLSearchParams();
  Object.entries(formData).forEach(([key, value]) => {
    body.append(key, value);
  });

  const response = await fetchText(
    KRX_DATA_URL,
    {
      method: "POST",
      headers: {
        ...DEFAULT_HEADERS,
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        origin: "https://ets.krx.co.kr",
        referer: KRX_MARKET_PAGE_URL
      },
      body
    },
    15000
  );

  return JSON.parse(response);
}

function chooseActiveKrxInstrument(items) {
  const currentYearSuffix = Number(String(new Date().getFullYear()).slice(-2));
  const allowanceItems = items
    .filter((item) => /^KAU\d{2}$/.test(item.isu_abbrv))
    .map((item) => ({
      ...item,
      year: Number(item.isu_abbrv.slice(-2))
    }))
    .sort((left, right) => left.year - right.year);

  return (
    allowanceItems.find((item) => item.year >= currentYearSuffix) ??
    allowanceItems[0] ??
    items.find((item) => item.isu_cd && item.isu_abbrv !== "ALL") ??
    null
  );
}

async function fetchEuEtsCard() {
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
}

async function fetchKrxCard() {
  const instrumentCode = await getKrxOtp("selectbox", "COM/ets_itemSearch2");
  const instrumentPayload = await postKrxForm({ code: instrumentCode });
  const instruments = firstArrayValue(instrumentPayload);
  const activeInstrument = chooseActiveKrxInstrument(instruments);

  if (!activeInstrument) {
    throw new Error("KRX did not return an active KAU instrument.");
  }

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 35);

  const currentCode = await getKrxOtp(
    "tablesubmit",
    "ETS/03/03010000/ets03010000_04"
  );
  const currentPayload = await postKrxForm({
    code: currentCode,
    bldcode: "ETS/03/03010000/ets03010000_04",
    isu_cd: activeInstrument.isu_cd,
    fromdate: toCompactDate(today),
    todate: toCompactDate(today)
  });
  const currentRows = firstArrayValue(currentPayload);
  const current = currentRows[0];

  const historyCode = await getKrxOtp("grid", "ETS/03/03010000/ets03010000_05");
  const historyPayload = await postKrxForm({
    code: historyCode,
    gNo: "d3d9446802a44259755d38e6d163e820",
    isu_cd: activeInstrument.isu_cd,
    fromdate: toCompactDate(thirtyDaysAgo),
    todate: toCompactDate(today)
  });
  const history = firstArrayValue(historyPayload);

  if (!current || history.length === 0) {
    throw new Error("KRX returned no price rows for the selected allowance.");
  }

  const recentVolumes = history
    .slice(0, 20)
    .map((row) => Number(String(row.acc_trdvol ?? "0").replace(/,/g, "")))
    .filter((value) => Number.isFinite(value));
  const averageVolume =
    recentVolumes.length > 0
      ? recentVolumes.reduce((sum, value) => sum + value, 0) / recentVolumes.length
      : 0;
  const recentSeries = history
    .map((row) => ({
      date: normalizeWhitespace(row.trd_dd).replace(/\./g, "-"),
      value: Number(String(row.tdd_clsprc ?? "0").replace(/,/g, "")),
      volume: Number(String(row.acc_trdvol ?? "0").replace(/,/g, ""))
    }))
    .filter((row) => Number.isFinite(row.value))
    .sort((left, right) => new Date(left.date) - new Date(right.date))
    .slice(-24);

  return {
    id: "k-ets-official",
    marketId: "k-ets",
    sourceName: "KRX ETS market tape",
    coverage: "Official KRX market price and volume",
    sourceUrl: KRX_MARKET_PAGE_URL,
    status: "connected",
    asOf: history[0].trd_dd,
    headline: `${current.isu_cd} official close`,
    summary: `KRX official screen data for ${current.isu_cd} on ${history[0].trd_dd}.`,
    metrics: [
      { label: "Close", value: `KRW ${current.tdd_clsprc}` },
      { label: "Day change", value: `${current.cmpprevdd_prc} KRW` },
      { label: "Return", value: `${current.fluc_rt}%` },
      { label: "Volume", value: `${history[0].acc_trdvol} t` },
      { label: "20d avg volume", value: `${formatNumber(averageVolume, 0)} t` }
    ],
    notes: [
      "KRX returns valid zero-volume rows on inactive trading days. The app surfaces the official value without backfilling."
    ],
    series: recentSeries,
    seriesLabel: "Official close",
    volumeSeries: recentSeries.map((point) => ({
      date: point.date,
      value: point.volume ?? 0
    })),
    links: makeLinks({ label: "KRX market page", url: KRX_MARKET_PAGE_URL })
  };
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
      sourceName: "KRX ETS market tape",
      sourceUrl: KRX_MARKET_PAGE_URL,
      coverage: "Official KRX market price and volume"
    }),
    runSourceTask(fetchCnEtsCard, {
      id: "cn-ets-official",
      marketId: "cn-ets",
      sourceName: "MEE carbon-market release feed",
      sourceUrl: MEE_LIST_URL,
      coverage: "Official policy and operations feed"
    })
  ]);

  return {
    fetchedAt: new Date().toISOString(),
    cards,
    warnings: cards
      .filter((card) => card.status === "error")
      .map((card) => `${card.sourceName}: ${card.summary}`)
  };
}

module.exports = {
  getConnectedSources
};
