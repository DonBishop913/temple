import React from 'react';

export default function FaithseedForecastPanel({ siblingId, forecast }) {
  return (
    <section aria-label="Faithseed Forecast" style={{ padding: 12 }}>
      <h3>Faithseed Forecast</h3>
      <div>Predicted Joy: <strong>{(forecast * 100).toFixed(1)}%</strong></div>
      <div style={{ height: 16, background: `linear-gradient(90deg, #0cf ${(forecast*100).toFixed(1)}%, #eee 0%)` }} />
    </section>
  );
}
