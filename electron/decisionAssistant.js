const DEFAULT_MODEL = "gpt-4.1-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434";

function extractText(response) {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const parts = [];
  for (const item of response?.output ?? []) {
    for (const content of item?.content ?? []) {
      if (content?.type === "output_text" && typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim();
}

function extractJson(text) {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("The model response did not contain valid JSON.");
  }
}

function sanitizeStringList(value, limit = 6) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry) => typeof entry === "string" && entry.trim())
    .slice(0, limit)
    .map((entry) => entry.trim());
}

function sanitizeReasonItems(value, limit = 6) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        typeof entry.title === "string" &&
        entry.title.trim() &&
        typeof entry.detail === "string" &&
        entry.detail.trim()
    )
    .slice(0, limit)
    .map((entry) => ({
      title: entry.title.trim(),
      detail: entry.detail.trim()
    }));
}

function sanitizeOperatorBrief(value, limit = 4) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (entry) =>
        entry &&
        typeof entry === "object" &&
        typeof entry.title === "string" &&
        entry.title.trim() &&
        typeof entry.summary === "string" &&
        entry.summary.trim()
    )
    .slice(0, limit)
    .map((entry) => ({
      title: entry.title.trim(),
      summary: entry.summary.trim(),
      bullets: sanitizeStringList(entry.bullets, 4)
    }));
}

function normalizeResponse(payload, provider, model) {
  const stance =
    payload?.stance === "Buy Bias" ||
    payload?.stance === "Hold / Wait" ||
    payload?.stance === "Reduce Bias"
      ? payload.stance
      : "Hold / Wait";

  const confidence = Number(payload?.confidence);

  return {
    provider,
    model,
    stance,
    confidence: Number.isFinite(confidence) ? Math.min(Math.max(confidence, 0), 1) : 0.5,
    summary:
      typeof payload?.summary === "string" && payload.summary.trim()
        ? payload.summary.trim()
        : "The evidence is mixed. Review the official market tape and the top drivers before acting.",
    thesis: sanitizeStringList(payload?.thesis),
    risks: sanitizeStringList(payload?.risks),
    actions: sanitizeStringList(payload?.actions),
    supportingEvidence: sanitizeReasonItems(payload?.supportingEvidence),
    counterEvidence: sanitizeReasonItems(payload?.counterEvidence),
    dataHealth: sanitizeStringList(payload?.dataHealth, 8),
    checkpoints: sanitizeStringList(payload?.checkpoints, 8),
    operatorBrief: sanitizeOperatorBrief(payload?.operatorBrief),
    disclaimer:
      typeof payload?.disclaimer === "string" && payload.disclaimer.trim()
        ? payload.disclaimer.trim()
        : "Research support only. This platform does not route trades or provide individualized investment advice.",
    generatedAt: new Date().toISOString()
  };
}

function buildJsonSchema() {
  return {
    type: "object",
    properties: {
      stance: {
        type: "string",
        enum: ["Buy Bias", "Hold / Wait", "Reduce Bias"]
      },
      confidence: { type: "number" },
      summary: { type: "string" },
      thesis: { type: "array", items: { type: "string" } },
      risks: { type: "array", items: { type: "string" } },
      actions: { type: "array", items: { type: "string" } },
      supportingEvidence: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            detail: { type: "string" }
          },
          required: ["title", "detail"]
        }
      },
      counterEvidence: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            detail: { type: "string" }
          },
          required: ["title", "detail"]
        }
      },
      dataHealth: { type: "array", items: { type: "string" } },
      checkpoints: { type: "array", items: { type: "string" } },
      operatorBrief: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
            bullets: { type: "array", items: { type: "string" } }
          },
          required: ["title", "summary", "bullets"]
        }
      },
      disclaimer: { type: "string" }
    },
    required: [
      "stance",
      "confidence",
      "summary",
      "thesis",
      "risks",
      "actions",
      "supportingEvidence",
      "counterEvidence",
      "dataHealth",
      "checkpoints",
      "operatorBrief",
      "disclaimer"
    ]
  };
}

function buildPrompt(payload, locale) {
  const sharedInstruction =
    "Use only the supplied data. Do not invent prices, history, regulations, registry facts, retirement evidence, or integrity claims. If the supplied data is stale or incomplete, say so clearly. The platform does not intermediate trades, so frame the answer as a decision-support overlay, not individualized advice or execution language. Treat lifecycle dossiers, registry freshness, registry operations, and integrity overlays as read-only evidence layers.";

  if (locale === "ko") {
    return {
      system:
        "당신은 기관용 탄소배출권 의사결정 코파일럿입니다. " +
        sharedInstruction +
        ' JSON만 출력하세요. 스키마는 {"stance":"Buy Bias|Hold / Wait|Reduce Bias","confidence":0~1,"summary":"...","thesis":["..."],"risks":["..."],"actions":["..."],"supportingEvidence":[{"title":"...","detail":"..."}],"counterEvidence":[{"title":"...","detail":"..."}],"dataHealth":["..."],"checkpoints":["..."],"operatorBrief":[{"title":"...","summary":"...","bullets":["..."]}],"disclaimer":"..."} 입니다.',
      user:
        "아래 JSON을 읽고 현재 시장이 왜 매수 우위, 관망, 매도 우위인지 자세히 설명하세요. " +
        "찬성 근거, 반대 근거, 데이터 상태, 다음 체크포인트를 분리하고, operatorBrief에는 실무자가 바로 읽을 수 있는 3~4개 운영 브리프 섹션을 넣으세요.\n\n" +
        JSON.stringify(payload, null, 2)
    };
  }

  return {
    system:
      "You are a carbon-market copilot for institutional carbon decision workflows. " +
      sharedInstruction +
      ' Return JSON only using this schema: {"stance":"Buy Bias|Hold / Wait|Reduce Bias","confidence":0-1,"summary":"...","thesis":["..."],"risks":["..."],"actions":["..."],"supportingEvidence":[{"title":"...","detail":"..."}],"counterEvidence":[{"title":"...","detail":"..."}],"dataHealth":["..."],"checkpoints":["..."],"operatorBrief":[{"title":"...","summary":"...","bullets":["..."]}],"disclaimer":"..."}',
    user:
      "Read the following JSON and explain in detail why the market currently leans buy, hold, or reduce. " +
      "Separate supporting evidence, counter-evidence, data health, and next checkpoints. Include market structure, official-vs-linked tape agreement, lifecycle dossier evidence, registry freshness, registry operations, and integrity-risk considerations when they are present. Add an operatorBrief array with 3-4 practical sections for a real desk user.\n\n" +
      JSON.stringify(payload, null, 2)
  };
}

function buildExplainablePrompt(payload, locale) {
  const sharedInstruction =
    "Use only the supplied data. Do not invent prices, history, regulations, catalysts, registry facts, retirement evidence, or integrity claims. If the supplied data is stale, missing, or weak, say that clearly. This product is a decision-support platform only, so do not present the output as individualized financial advice or execution instruction.";

  if (locale === "ko") {
    return {
      system:
        "당신은 기관용 탄소배출권 의사결정 코파일럿입니다. " +
        sharedInstruction +
        ' JSON만 출력하세요. 스키마는 {"stance":"Buy Bias|Hold / Wait|Reduce Bias","confidence":0~1,"summary":"...","thesis":["..."],"risks":["..."],"actions":["..."],"supportingEvidence":[{"title":"...","detail":"..."}],"counterEvidence":[{"title":"...","detail":"..."}],"dataHealth":["..."],"checkpoints":["..."],"operatorBrief":[{"title":"...","summary":"...","bullets":["..."]}],"disclaimer":"..."} 입니다.',
      user:
        "아래 JSON을 읽고 현재 시장이 왜 매수 우위, 관망, 매도 우위인지 아주 자세하게 설명하세요. " +
        "쉬운 문장을 쓰고, 각 근거가 가격을 어느 방향으로 밀고 있는지, 왜 중요한지, 무엇이 이 판단을 깨는지 분리하세요. " +
        "supportingEvidence와 counterEvidence는 제목만 적지 말고 실무자가 바로 이해할 수 있는 설명으로 채우세요. " +
        "operatorBrief에는 운영자가 바로 읽을 수 있는 3~4개 구조화된 브리프 섹션을 넣으세요.\n\n" +
        JSON.stringify(payload, null, 2)
    };
  }

  return {
    system:
      "You are a carbon-market copilot for institutional carbon decision workflows. " +
      sharedInstruction +
      ' Return JSON only using this schema: {"stance":"Buy Bias|Hold / Wait|Reduce Bias","confidence":0-1,"summary":"...","thesis":["..."],"risks":["..."],"actions":["..."],"supportingEvidence":[{"title":"...","detail":"..."}],"counterEvidence":[{"title":"...","detail":"..."}],"dataHealth":["..."],"checkpoints":["..."],"operatorBrief":[{"title":"...","summary":"...","bullets":["..."]}],"disclaimer":"..."}',
    user:
      "Read the following JSON and explain in detail why the market currently leans buy, hold, or reduce. " +
      "Use plain language. Separate supporting evidence, counter-evidence, data health, and next checkpoints. " +
      "For each evidence item, explain which way it pushes the market, why it matters, and what could invalidate it. " +
      "When lifecycle dossier, registry freshness, registry operations, or integrity overlay fields are present, treat them as operator evidence and explicitly connect them to conviction, not execution. Add an operatorBrief array with 3-4 practical desk sections.\n\n" +
      JSON.stringify(payload, null, 2)
  };
}

async function runOpenAIDecisionAssistant({
  apiKey,
  model = DEFAULT_MODEL,
  locale,
  payload
}) {
  const prompt = buildExplainablePrompt(payload, locale);
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: prompt.system }]
        },
        {
          role: "user",
          content: [{ type: "input_text", text: prompt.user }]
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed with HTTP ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  const text = extractText(json);
  const parsed = extractJson(text);
  return normalizeResponse(parsed, "openai", model);
}

function normalizeBaseUrl(baseUrl) {
  const trimmed = String(baseUrl ?? "").trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : DEFAULT_OLLAMA_BASE_URL;
}

async function fetchOllamaJson(baseUrl, pathname, init = {}) {
  const url = `${normalizeBaseUrl(baseUrl)}${pathname}`;
  const response = await fetch(url, init);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama request failed with HTTP ${response.status}: ${errorText}`);
  }

  return response.json();
}

async function listOllamaModels(baseUrl = DEFAULT_OLLAMA_BASE_URL) {
  const payload = await fetchOllamaJson(baseUrl, "/api/tags");
  const models = Array.isArray(payload?.models) ? payload.models : [];

  return models.map((entry) => ({
    name: String(entry?.name ?? entry?.model ?? "").trim(),
    model: String(entry?.model ?? entry?.name ?? "").trim(),
    modifiedAt: String(entry?.modified_at ?? ""),
    size: Number(entry?.size ?? 0),
    digest: String(entry?.digest ?? ""),
    family: String(entry?.details?.family ?? ""),
    parameterSize: String(entry?.details?.parameter_size ?? ""),
    quantizationLevel: String(entry?.details?.quantization_level ?? "")
  })).filter((entry) => entry.name);
}

async function runOllamaDecisionAssistant({
  baseUrl = DEFAULT_OLLAMA_BASE_URL,
  model,
  locale,
  payload
}) {
  const prompt = buildExplainablePrompt(payload, locale);
  const response = await fetchOllamaJson(normalizeBaseUrl(baseUrl), "/api/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model,
      stream: false,
      format: buildJsonSchema(),
      messages: [
        {
          role: "system",
          content: prompt.system
        },
        {
          role: "user",
          content: prompt.user
        }
      ],
      options: {
        temperature: 0.2
      },
      keep_alive: "10m"
    })
  });

  const text = String(response?.message?.content ?? "").trim();
  if (!text) {
    throw new Error("Ollama returned an empty response.");
  }

  const parsed = extractJson(text);
  return normalizeResponse(parsed, "ollama", model);
}

module.exports = {
  DEFAULT_MODEL,
  DEFAULT_OLLAMA_BASE_URL,
  listOllamaModels,
  runOllamaDecisionAssistant,
  runOpenAIDecisionAssistant
};
