import { useEffect, useState } from "react";
import { site } from "../../site.ts";

export type PhaseView = {
  id: string;
  order: number;
  title: string;
  when: string;
  whyHtml: string;
  checklistHtml: string[];
  deliverablesHtml: string[];
};

type Checks = Record<string, boolean>;

/** Checklist keys are `phaseId:itemIndex`, so reordering a phase's items shifts saved ticks. */
const keyFor = (phaseId: string, index: number) => `${phaseId}:${index}`;

function readChecks(): Checks {
  try {
    return JSON.parse(localStorage.getItem(site.storageKeys.checklist) ?? "{}") as Checks;
  } catch {
    return {};
  }
}

export default function PhaseChecklist({ phases }: { phases: PhaseView[] }) {
  const [current, setCurrent] = useState(0);
  const [checks, setChecks] = useState<Checks>({});

  function selectPhase(index: number) {
    const phase = phases[index];
    if (!phase) return;
    setCurrent(index);
    const hash = `#phase-${phase.id}`;
    if (location.hash !== hash) {
      history.replaceState(null, "", hash);
    }
  }

  useEffect(() => {
    setChecks(readChecks());
    // Links to a phase on the same page only change the hash, so select on every change.
    const selectFromHash = () => {
      const fromHash = phases.findIndex((p) => `#phase-${p.id}` === location.hash);
      if (fromHash >= 0) setCurrent(fromHash);
    };
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [phases]);

  function toggle(key: string, on: boolean) {
    const next = { ...checks, [key]: on };
    setChecks(next);
    try {
      localStorage.setItem(site.storageKeys.checklist, JSON.stringify(next));
    } catch {
      // Ticks still work for this visit when storage is unavailable.
    }
  }

  const total = phases.reduce((sum, p) => sum + p.checklistHtml.length, 0);
  const done = phases.reduce(
    (sum, p) => sum + p.checklistHtml.filter((_, i) => checks[keyFor(p.id, i)]).length,
    0,
  );
  const phase = phases[current];

  return (
    <div>
      <div className="progress" aria-live="polite">
        {done} / {total} checklist items done
      </div>
      <div className="phases">
        {phases.map((p, i) => (
          <button
            key={p.id}
            type="button"
            id={`phase-${p.id}`}
            aria-pressed={i === current}
            onClick={() => selectPhase(i)}
          >
            <span className="n">{String(p.order).padStart(2, "0")}</span>
            <span className="t">{p.title}</span>
            <span className="w">{p.when}</span>
          </button>
        ))}
      </div>
      <div className="phase-body">
        <div className="eyebrow">
          Phase {String(phase.order).padStart(2, "0")} · {phase.when}
        </div>
        <h3>{phase.title}</h3>
        <p className="phase-why" dangerouslySetInnerHTML={{ __html: phase.whyHtml }} />
        <div className="cols">
          <div>
            <div className="eyebrow" style={{ marginTop: 8 }}>
              Checklist
            </div>
            <ul className="check">
              {phase.checklistHtml.map((item, i) => {
                const key = keyFor(phase.id, i);
                const on = Boolean(checks[key]);
                return (
                  <li key={key} className={on ? "done" : undefined}>
                    <input
                      type="checkbox"
                      id={`check-${key}`}
                      checked={on}
                      onChange={(e) => toggle(key, e.target.checked)}
                    />
                    <label htmlFor={`check-${key}`} dangerouslySetInnerHTML={{ __html: item }} />
                  </li>
                );
              })}
            </ul>
          </div>
          <div>
            <div className="eyebrow" style={{ marginTop: 8 }}>
              Deliverables
            </div>
            <ul className="deliv">
              {phase.deliverablesHtml.map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
