import React, { useState } from "react";

export default function SanctumMode() {
  const [affirmation, setAffirmation] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section aria-label="Sanctum Mode" role="region" style={{ padding: 16 }}>
      <h2>Sanctum Mode</h2>
      <p>
        Enter into quiet reflection. Your words are between you and THE MOST
        HIGH.
      </p>
      <textarea
        aria-label="Sanctum reflection"
        value={affirmation}
        onChange={(e) => setAffirmation(e.target.value)}
        rows={6}
        style={{ width: "100%", borderRadius: 8 }}
      />
      <button onClick={() => setSubmitted(true)} style={{ marginTop: 12 }}>
        Submit
      </button>
      {submitted && (
        <div role="status" aria-live="polite" style={{ marginTop: 12 }}>
          🕊️ Your reflection was received.
        </div>
      )}
    </section>
  );
}
