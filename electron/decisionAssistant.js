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

function sanitizeStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((entry) => typeof entry === "string" && entry.trim())
    .slice(0, 6)
    .map((entry) => entry.trim());
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
        " 반드시 JSON만 출력하라. 스키마는 {\"stance\":\"Buy Bias|Hold / Wait|Reduce Bias\",\"confidence\":0~1,\"summary\":\"...\",\"thesis\":[\"...\"],\"risks\":[\"...\"],\"actions\":[\"...\"],\"disclaimer\":\"...\"} 이다.",
      user:
        "아래 JSON을 읽고, 현재 사용자가 참고할 수 있는 판단을 요약하라. " +
        "매수 우위는 Buy Bias, 관망은 Hold / Wait, 매도 우위는 Reduce Bias로만 표시하라.\n\n" +
        JSON.stringify(payload, null, 2)
    };
  }

  return {
    system:
      "You are a carbon allowance decision-support analyst. " +
      sharedInstruction +
      ' Return JSON only using this schema: {"stance":"Buy Bias|Hold / Wait|Reduce Bias","confidence":0-1,"summary":"...","thesis":["..."],"risks":["..."],"actions":["..."],"disclaimer":"..."}',
    user:
      "Read the following JSON and summarize the current decision posture for the user. " +
      "Use only Buy Bias, Hold / Wait, or Reduce Bias for stance.\n\n" +
      JSON.stringify(payload, null, 2)
  };
}

async function runOpenAIDecisionAssistant({
  apiKey,
  model = DEFAULT_MODEL,
  locale,
  payload
}) {
  const prompt = buildPrompt(payload, locale);
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
