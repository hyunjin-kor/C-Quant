const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";
const MAX_CHAT_MESSAGE_CHARS = 4_000;
const MAX_GROUNDING_TEXT_CHARS = 240;

function clampText(value, limit) {
  return String(value ?? "").trim().slice(0, limit);
}

function sanitizeChatMessages(value, limit = 12) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        (entry.role === "user" || entry.role === "assistant") &&
        typeof entry.content === "string" &&
        entry.content.trim()
    )
    .slice(-limit)
    .map((entry) => ({
      role: entry.role,
      content: clampText(entry.content, MAX_CHAT_MESSAGE_CHARS)
    }));
}

function sanitizeGrounding(value, limit = 6) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        typeof entry.id === "string" &&
        typeof entry.kind === "string" &&
        typeof entry.label === "string" &&
        typeof entry.detail === "string"
    )
    .slice(0, limit)
    .map((entry) => ({
      id: clampText(entry.id, 80),
      kind: clampText(entry.kind, 40),
      label: clampText(entry.label, 120),
      detail: clampText(entry.detail, MAX_GROUNDING_TEXT_CHARS),
      asOf: typeof entry.asOf === "string" ? clampText(entry.asOf, 40) : "",
      url: typeof entry.url === "string" ? clampText(entry.url, 400) : ""
    }));
}

function normalizeBaseUrl(baseUrl) {
  const trimmed = String(baseUrl ?? "").trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : DEFAULT_OLLAMA_BASE_URL;
}

async function fetchOllamaJson(baseUrl, pathname, init = {}) {
  const url = `${normalizeBaseUrl(baseUrl)}${pathname}`;
  const response = await fetch(url, {
    ...init,
    redirect: "error",
    signal: AbortSignal.timeout(20_000)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama request failed with HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function listOllamaModels(baseUrl = DEFAULT_OLLAMA_BASE_URL) {
  const payload = await fetchOllamaJson(baseUrl, "/api/tags");
  const models = Array.isArray(payload?.models) ? payload.models : [];

  return models
    .map((entry) => ({
      name: String(entry?.name ?? entry?.model ?? "").trim(),
      model: String(entry?.model ?? entry?.name ?? "").trim(),
      modifiedAt: String(entry?.modified_at ?? ""),
      size: Number(entry?.size ?? 0),
      digest: String(entry?.digest ?? ""),
      family: String(entry?.details?.family ?? ""),
      parameterSize: String(entry?.details?.parameter_size ?? ""),
      quantizationLevel: String(entry?.details?.quantization_level ?? "")
    }))
    .filter((entry) => entry.name);
}

function buildChatSystemPrompt(locale) {
  if (locale === "ko") {
    return [
      "당신은 C-Quant 안에서 동작하는 로컬 탄소시장 오퍼레이터 어시스턴트다.",
      "반드시 제공된 데스크 컨텍스트와 대화만 사용한다.",
      "제공되지 않은 가격, 정책, 규정, 거래, 통계, 일정, 문서 내용을 만들지 않는다.",
      "데이터가 오래됐거나 약하면 첫 줄에서 먼저 말하고, 추론은 반드시 추론이라고 표시한다.",
      "이 제품은 주문 실행이나 중개를 하지 않으므로 답변은 연구, 모니터링, 검증 지원으로만 표현한다.",
      "출력 형식은 짧은 마크다운으로 고정한다.",
      "형식:",
      "### Facts",
      "- 제공된 사실만 2~4개",
      "### Inference",
      "- 추론 1~3개. 추론이 없으면 '추론 제한'이라고 적는다.",
      "### Verify Next",
      "- 지금 다시 확인할 항목 2~4개"
    ].join(" ");
  }

  return [
    "You are the local carbon-market operator assistant built into C-Quant.",
    "Use only the supplied desk context and conversation.",
    "Do not invent prices, policies, regulations, fills, statistics, calendars, or source content.",
    "If the data is stale, sparse, or weak, say that first and mark any inference explicitly.",
    "This product does not route orders or intermediate trades, so frame every answer as research, monitoring, and verification support only.",
    "Return short markdown only in this structure:",
    "### Facts",
    "- 2 to 4 supplied facts",
    "### Inference",
    "- 1 to 3 clearly labeled inferences, or say inference is limited",
    "### Verify Next",
    "- 2 to 4 concrete checks"
  ].join(" ");
}

function buildChatContextPrompt(locale, context, grounding) {
  const heading =
    locale === "ko" ? "현재 데스크 컨텍스트 JSON:" : "Current desk context JSON:";
  const groundingHeading =
    locale === "ko" ? "사용 가능한 근거 목록:" : "Available grounding items:";

  return [
    `${heading}\n${JSON.stringify(context ?? {}, null, 2)}`,
    `${groundingHeading}\n${JSON.stringify(grounding, null, 2)}`
  ].join("\n\n");
}

async function runOllamaChat({
  baseUrl = DEFAULT_OLLAMA_BASE_URL,
  model,
  locale,
  context,
  messages
}) {
  const grounding = sanitizeGrounding(context?.grounding);
  const boundaryNote =
    locale === "ko"
      ? "연구·모니터링 지원 전용. 공식 앵커와 비교 테이프가 판단의 기준이며, 답변은 실행 지시가 아니다."
      : "Research and monitoring support only. The official anchor and comparison tape remain the decision baseline, not an execution instruction.";

  const response = await fetchOllamaJson(normalizeBaseUrl(baseUrl), "/api/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        {
          role: "system",
          content: buildChatSystemPrompt(locale)
        },
        {
          role: "system",
          content: buildChatContextPrompt(locale, context, grounding)
        },
        ...sanitizeChatMessages(messages)
      ],
      options: {
        temperature: 0.15
      },
      keep_alive: "10m"
    })
  });

  const content = String(response?.message?.content ?? "").trim();
  if (!content) {
    throw new Error("Ollama returned an empty chat response.");
  }

  return {
    provider: "ollama",
    model,
    content,
    grounding,
    boundaryNote,
    generatedAt: new Date().toISOString(),
    doneReason:
      typeof response?.done_reason === "string" ? response.done_reason : undefined,
    totalDurationMs: Number.isFinite(response?.total_duration)
      ? Math.round(response.total_duration / 1_000_000)
      : undefined,
    loadDurationMs: Number.isFinite(response?.load_duration)
      ? Math.round(response.load_duration / 1_000_000)
      : undefined,
    promptEvalCount: Number.isFinite(response?.prompt_eval_count)
      ? response.prompt_eval_count
      : undefined,
    evalCount: Number.isFinite(response?.eval_count) ? response.eval_count : undefined
  };
}

module.exports = {
  DEFAULT_OLLAMA_BASE_URL,
  listOllamaModels,
  runOllamaChat
};
