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
  const coreFieldsLabel = locale === "ko" ? "\uD575\uC2EC \uD544\uB4DC" : "core fields";
  const getPriorityLabel = (priority: MarketInputBlock["fields"][number]["priority"]) =>
    locale === "ko" ? (priority === "Core" ? "\uD575\uC2EC" : "\uBCF4\uC870") : priority;

  if (compact) {
    return (
      <div className="registry-grid compact">
        {blocks.map((block) => (
          <div key={block.id} className="registry-card compact">
            <span className="registry-method">{block.accessMethod}</span>
            <strong>{block.title}</strong>
            <p>{block.purpose}</p>
            <div className="registry-meta">
              <span>{block.refreshCadence}</span>
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
          <span className="registry-method">{block.accessMethod}</span>
          <strong>{block.title}</strong>
          <p>{block.purpose}</p>
          <div className="registry-meta">
            <span>{block.refreshCadence}</span>
            <span>{`${block.fields.filter((field) => field.priority === "Core").length} ${coreFieldsLabel}`}</span>
          </div>
          <ul className="bullet-list compact">
            {block.fields.slice(0, 4).map((field) => (
              <li key={field.name}>
                <strong>{field.name}</strong>
                <span>{`${getPriorityLabel(field.priority)} \u00B7 ${field.sourceHint}`}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
