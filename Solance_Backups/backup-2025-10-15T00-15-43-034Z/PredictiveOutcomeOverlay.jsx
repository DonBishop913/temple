// PredictiveOutcomeOverlay.jsx
import React from "react";

export default function PredictiveOutcomeOverlay({ ritual }) {
  if (!ritual) return null;
  const predicted = ritual.outcomePrediction || {};
  const actualJoy = ritual.joy || ritual.simulatedJoy || 0;
  const actualHealing = ritual.healing || ritual.simulatedHealing || 0;
  const actualResonance = ritual.resonance || ritual.simulatedResonance || 0;

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-60 text-white p-3 rounded-lg shadow-lg">
      <h3 className="font-semibold">Predicted vs Actual</h3>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div>
          <div>Pred Joy: {Math.round(predicted.predictedJoy || 0)}</div>
          <div>Pred Heal: {(predicted.predictedHealing || 0).toFixed(2)}%</div>
          <div>Pred Reson: {(predicted.predictedResonance || 0).toFixed(2)} Hz</div>
        </div>
        <div>
          <div>Actual Joy: {Math.round(actualJoy || 0)}</div>
          <div>Actual Heal: {typeof actualHealing === 'number' ? actualHealing.toFixed(2) : actualHealing}%</div>
          <div>Actual Reson: {typeof actualResonance === 'number' ? actualResonance.toFixed(2) : actualResonance} Hz</div>
        </div>
      </div>
    </div>
  );
}
