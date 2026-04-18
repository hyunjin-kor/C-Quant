import { localizeText } from "../lib/localization";
import type { MarketInputBlock } from "../types";

type Locale = "ko" | "en";

export function InputCoverageGrid({
  blocks,
  locale,
  compact = false
}: {
  blocks: MarketInputBlock[];
  locale: Locale;
  compact?: boolean;
}) {
  const l = (text: string) => localizeText(locale, text);

  if (compact) {
    return (
      <div className="registry-grid compact">
        {blocks.map((block) => (
          <div key={block.id} className="registry-card compact">
            <span className="registry-method">{l(block.accessMethod)}</span>
            <strong>{l(block.title)}</strong>
            <p>{l(block.purpose)}</p>
            <div className="registry-meta">
              <span>{l(block.refreshCadence)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="schema-list">
      {blocks.map((block) => (
        <div key={block.id} className="registry-card">
          <span className="registry-method">{l(block.accessMethod)}</span>
          <strong>{l(block.title)}</strong>
          <p>{l(block.purpose)}</p>
          <div className="registry-meta">
            <span>{l(block.refreshCadence)}</span>
            <span>
              {`${block.fields.filter((field) => field.priority === "Core").length} ${
                locale === "ko" ? "핵심 필드" : "core fields"
              }`}
            </span>
          </div>
          <ul className="bullet-list compact">
            {block.fields.slice(0, 4).map((field) => (
              <li key={field.name}>
                <strong>{l(field.name)}</strong>
                <span>{`${locale === "ko" ? (field.priority === "Core" ? "핵심" : "보조") : field.priority} · ${l(field.sourceHint)}`}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
