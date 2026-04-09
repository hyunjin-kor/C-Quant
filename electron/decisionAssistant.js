const DEFAULT_MODEL = "gpt-4.1-mini";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

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
    disclaimer:
      typeof payload?.disclaimer === "string" && payload.disclaimer.trim()
        ? payload.disclaimer.trim()
        : "Research support only. This platform does not route trades or provide individualized investment advice.",
    generatedAt: new Date().toISOString()
  };
}

function buildPrompt(payload, locale) {
  const sharedInstruction =
    "Use only the supplied data. Do not invent prices, history, or regulations. If the supplied data is stale or incomplete, say so clearly. The platform does not intermediate trades, so frame the answer as a decision-support overlay, not individualized advice.";

  if (locale === "ko") {
    return {
      system:
        "당신은 탄소배출권 의사결정 지원 분석가다. " +
        sharedInstruction +
        ' JSON만 출력하라. 스키마는 {"stance":"Buy Bias|Hold / Wait|Reduce Bias","confidence":0~1,"summary":"...","thesis":["..."],"risks":["..."],"actions":["..."],"supportingEvidence":[{"title":"...","detail":"..."}],"counterEvidence":[{"title":"...","detail":"..."}],"dataHealth":["..."],"checkpoints":["..."],"disclaimer":"..."} 이다.',
      user:
        "아래 JSON을 읽고 현재 시장을 왜 매수 우위/관망/매도 우위로 보는지 자세히 정리하라. " +
        "반드시 근거, 반대 근거, 데이터 상태, 다음 체크 항목을 분리해서 적어라.\n\n" +
        JSON.stringify(payload, null, 2)
    };
  }

  return {
    system:
      "You are a carbon allowance decision-support analyst. " +
      sharedInstruction +
      ' Return JSON only using this schema: {"stance":"Buy Bias|Hold / Wait|Reduce Bias","confidence":0-1,"summary":"...","thesis":["..."],"risks":["..."],"actions":["..."],"supportingEvidence":[{"title":"...","detail":"..."}],"counterEvidence":[{"title":"...","detail":"..."}],"dataHealth":["..."],"checkpoints":["..."],"disclaimer":"..."}',
    user:
      "Read the following JSON and explain in detail why the market currently leans buy, hold, or reduce. " +
      "Separate supporting evidence, counter-evidence, data health, and next checkpoints.\n\n" +
      JSON.stringify(payload, null, 2)
  };
}

function buildExplainablePrompt(payload, locale) {
  const sharedInstruction =
    "Use only the supplied data. Do not invent prices, history, regulations, or catalysts. If the supplied data is stale, missing, or weak, say that clearly. This product is a decision-support platform only, so do not present the output as individualized financial advice.";

  if (locale === "ko") {
    return {
      system:
        "당신은 탄소배출권 의사결정 지원 분석가다. " +
        sharedInstruction +
        ' JSON만 출력하라. 스키마는 {"stance":"Buy Bias|Hold / Wait|Reduce Bias","confidence":0~1,"summary":"...","thesis":["..."],"risks":["..."],"actions":["..."],"supportingEvidence":[{"title":"...","detail":"..."}],"counterEvidence":[{"title":"...","detail":"..."}],"dataHealth":["..."],"checkpoints":["..."],"disclaimer":"..."} 이다.',
      user:
        "아래 JSON만 읽고 현재 시장을 왜 매수 우위, 관망, 매도 우위로 보는지 아주 자세하게 설명하라. " +
        "반드시 쉬운 말로 쓰고, 각 항목에서 가격을 어느 방향으로 움직이는지, 왜 중요한지, 무엇을 다시 확인해야 하는지 분리해서 정리하라. " +
        "특히 supportingEvidence와 counterEvidence는 제목 한 줄이 아니라 사용자가 바로 이해할 수 있는 상세 설명으로 채워라.\n\n" +
        JSON.stringify(payload, null, 2)
    };
  }

  return {
    system:
      "You are a carbon allowance decision-support analyst. " +
      sharedInstruction +
      ' Return JSON only using this schema: {"stance":"Buy Bias|Hold / Wait|Reduce Bias","confidence":0-1,"summary":"...","thesis":["..."],"risks":["..."],"actions":["..."],"supportingEvidence":[{"title":"...","detail":"..."}],"counterEvidence":[{"title":"...","detail":"..."}],"dataHealth":["..."],"checkpoints":["..."],"disclaimer":"..."}',
    user:
      "Read the following JSON and explain in detail why the market currently leans buy, hold, or reduce. " +
      "Use plain language. Separate supporting evidence, counter-evidence, data health, and next checkpoints. " +
      "For each evidence item, explain which way it pushes the market, why it matters, and what could invalidate it.\n\n" +
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

module.exports = {
  DEFAULT_MODEL,
  runOpenAIDecisionAssistant
};
