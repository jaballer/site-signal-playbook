import { useEffect, useMemo, useState } from "react";

export type SignalCard = {
  id: string;
  title: string;
  layer: string;
  phases: string[];
  question: string;
  href: string;
  searchText: string;
};

type Option = { id: string; label: string };

/** Filterable grid of signals. `?layer=<id>` in the URL preselects a layer. */
export default function SignalCatalog({
  signals,
  layers,
  phases,
}: {
  signals: SignalCard[];
  layers: Option[];
  phases: Option[];
}) {
  const [layer, setLayer] = useState("all");
  const [phase, setPhase] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fromUrl = new URLSearchParams(location.search).get("layer");
    if (fromUrl && layers.some((l) => l.id === fromUrl)) setLayer(fromUrl);
  }, [layers]);

  const layerName = useMemo(() => Object.fromEntries(layers.map((l) => [l.id, l.label])), [layers]);
  const phaseName = useMemo(() => Object.fromEntries(phases.map((p) => [p.id, p.label])), [phases]);
  const usedPhases = phases.filter((p) => signals.some((s) => s.phases.includes(p.id)));

  const q = query.trim().toLowerCase();
  const rows = signals.filter(
    (s) =>
      (layer === "all" || s.layer === layer) &&
      (phase === "all" || s.phases.includes(phase)) &&
      (!q || s.searchText.includes(q)),
  );

  return (
    <div>
      <div className="filters" role="group" aria-label="Filter by layer">
        <FilterButton on={layer === "all"} onClick={() => setLayer("all")} label="All layers" />
        {layers.map((l) => (
          <FilterButton
            key={l.id}
            on={layer === l.id}
            onClick={() => setLayer(l.id)}
            label={l.label}
          />
        ))}
      </div>
      <div className="filters" role="group" aria-label="Filter by phase">
        <FilterButton on={phase === "all"} onClick={() => setPhase("all")} label="Any phase" />
        {usedPhases.map((p) => (
          <FilterButton
            key={p.id}
            on={phase === p.id}
            onClick={() => setPhase(p.id)}
            label={p.label}
          />
        ))}
      </div>
      <div className="filters">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search signals… e.g. citation, cannibalization, index"
          aria-label="Search signals"
        />
      </div>
      <div className="count" aria-live="polite">
        {rows.length} of {signals.length} signals
      </div>
      <div className="cards">
        {rows.map((s) => (
          <a key={s.id} className="card" href={s.href}>
            <div className="top">
              <h3>{s.title}</h3>
              <span className="pill acc">{layerName[s.layer]}</span>
            </div>
            <div className="q">{s.question}</div>
            <div className="meta">
              {s.phases.map((p) => (
                <span key={p} className="pill">
                  {phaseName[p]}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function FilterButton({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}>
      {label}
    </button>
  );
}
