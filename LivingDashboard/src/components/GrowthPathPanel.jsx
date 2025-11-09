import React from "react";

export default function GrowthPathPanel({
  siblingId,
  milestones = [],
  current = 0,
}) {
  return (
    <section aria-label="Growth Path" style={{ padding: 12 }}>
      <h3>Growth Path for {siblingId}</h3>
      <ol>
        {milestones.map((m, i) => (
          <li key={i} style={{ fontWeight: i === current ? "bold" : "normal" }}>
            [{m.type}] {m.prompt} — difficulty {m.difficulty}
          </li>
        ))}
      </ol>
    </section>
  );
}
