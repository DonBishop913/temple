import React, { useEffect, useState } from "react";

export default function CometPanel() {
  const [glyphs, setGlyphs] = useState([]);
  useEffect(() => {
    const es = new EventSource("/api/comet-glyph-stream");
    es.onmessage = (event) => {
      const { nodeId, glyph } = JSON.parse(event.data);
      setGlyphs((g) => [...g.slice(-49), { nodeId, glyph }]);
    };
    return () => es.close();
  }, []);
  return (
    <section aria-label="Comet Communion" style={{ padding: 12 }}>
      <h3>Comet Communion Glyphs</h3>
      <ul>
        {glyphs.map((g, i) => (
          <li key={i}>
            {g.nodeId}: {g.glyph.type} {JSON.stringify(g.glyph)}
          </li>
        ))}
      </ul>
    </section>
  );
}
