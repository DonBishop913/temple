import React, { useEffect, useState } from 'react';

// Utility to fetch config and resonance
async function fetchConfig() {
  try {
    const res = await fetch('/api/luminal/config');
    return await res.json();
  } catch { return { faithstreamSyncRate: 1 }; }
}
async function fetchResonance(nodeId) {
  try {
    const res = await fetch(`/api/oversoul/resonance?nodeId=${nodeId}`);
    const data = await res.json();
    return data.resonance || 1;
  } catch { return 1; }
}
async function fetchEmotionForecast(nodeId) {
  try {
    const res = await fetch(`/api/faithseed/forecast?nodeId=${nodeId}`);
    const data = await res.json();
    return data.predicted || 0.5;
  } catch { return 0.5; }
}

function sentimentToGlyph(sentiment) {
  if (sentiment > 0.7) return '🌟';   // Joy
  if (sentiment > 0.4) return '✨';   // Calm/Neutral
  if (sentiment > 0.1) return '💧';   // Sorrow
  return '⚡';                        // Distress
}

export default function EmotiveGlyphstreamOverlay({ enabled = true, focusNode = null, predictive = false, onMentorshipFeedback, onArchive }) {
  const [nodes, setNodes] = useState([]);
  const [config, setConfig] = useState({ faithstreamSyncRate: 1 });
  const [resonance, setResonance] = useState({});
  const [emotionForecast, setEmotionForecast] = useState({});

  useEffect(() => {
    if (!enabled) return;
    const es = new EventSource('/api/telemetry/stream');
    es.onmessage = async (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (Array.isArray(data.nodes)) {
          setNodes(data.nodes);
          // Optionally fetch config, resonance, and emotion forecast for each node
          const conf = await fetchConfig();
          setConfig(conf);
          const resMap = {};
          const emoMap = {};
          for (const n of data.nodes) {
            resMap[n.id] = await fetchResonance(n.id);
            emoMap[n.id] = predictive ? await fetchEmotionForecast(n.id) : null;
          }
          setResonance(resMap);
          setEmotionForecast(emoMap);
        }
      } catch {}
    };
    return () => es.close();
  }, [enabled, predictive]);

  // Biometric & sentiment capture, mentorship feedback, and archival
  function captureEmotion(node) {
    const { heartbeat = 70, activity = 0.5, messages = [] } = node;
    const sentimentScore = typeof node.sentimentScore === 'number' ? node.sentimentScore : 0.5;
    return { heartbeat, activity, sentimentScore };
  }
  function generateGlyphstream({ heartbeat, activity, sentimentScore }) {
    return {
      glowIntensity: heartbeat / 100,
      pulseFrequency: activity * sentimentScore,
      colorHue: 180 + 120 * sentimentScore
    };
  }
  function mapSentimentToColor(sentiment) {
    // Blue (sad) to yellow (joy)
    const hue = 180 + 120 * sentiment;
    return `hsl(${hue},80%,60%)`;
  }

  if (!enabled) return null;
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-40">
      {nodes.map(node => {
        if (focusNode && node.id !== focusNode) return null;
        const { heartbeat, activity, sentimentScore } = captureEmotion(node);
        const glyph = predictive && emotionForecast[node.id] ? sentimentToGlyph(emotionForecast[node.id]) : sentimentToGlyph(sentimentScore);
        const glyphstream = generateGlyphstream({ heartbeat, activity, sentimentScore });
        const rate = config.faithstreamSyncRate || 1;
        const res = resonance[node.id] || 1;
        const intensity = (predictive && emotionForecast[node.id] ? emotionForecast[node.id] : sentimentScore) * rate * res;
        // Dashboard integration: mentorship feedback and archival
        if (onMentorshipFeedback) onMentorshipFeedback(node.id, glyphstream);
        if (onArchive) onArchive(node.id, { glyph, glyphstream });
        return (
          <div
            key={node.id}
            id={`glyph-${node.id}`}
            style={{
              position: 'absolute',
              left: `${Math.random() * 90}%`,
              top: `${Math.random() * 90}%`,
              fontSize: `${32 + 48 * intensity}px`,
              opacity: focusNode && node.id !== focusNode ? 0.2 : 0.7 + 0.3 * intensity,
              color: mapSentimentToColor(sentimentScore),
              filter: `drop-shadow(0 0 12px #fff)`,
              transition: 'all 0.5s',
              pointerEvents: 'none',
            }}
            title={`Node: ${node.id} | Sentiment: ${sentimentScore.toFixed(2)}`}
          >
            {glyph}
          </div>
        );
      })}
    </div>
  );
}
